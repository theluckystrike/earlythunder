/**
 * Altcoin season index math.
 *
 * Pure arithmetic over a list of market rows. Nothing here fetches, reads the
 * filesystem, or touches a global. Every exported function can be called from a
 * unit test with hand written rows, and every one of them returns null rather
 * than a number when the sample is too thin to carry a claim.
 *
 * The index is the share of the top N non stablecoin assets other than Bitcoin,
 * whose percentage price change over a chosen lookback window is greater than
 * Bitcoin's percentage price change over the same window. A row whose change is
 * null for the selected window is excluded from the numerator and from the
 * denominator, never counted as a loss.
 */

/** Lookback windows CoinGecko serves on the markets endpoint. No 90 day window exists there. */
export const SEASON_WINDOWS = ["24h", "7d", "30d", "200d", "1y"] as const;

export type SeasonWindow = (typeof SEASON_WINDOWS)[number];

/** Depth ladder used for the breadth curve. */
export const SEASON_DEPTHS = [10, 25, 50, 100, 200] as const;

/** Default depth. blockchaincenter reports the top 50, so the headline matches on depth. */
export const DEFAULT_DEPTH = 50;

/** Default window. blockchaincenter uses 90 days, which this endpoint does not serve. */
export const DEFAULT_WINDOW: SeasonWindow = "30d";

/** Below this many comparable assets the share is noise, so the index is withheld. */
export const MIN_COMPARABLE = 10;

/** Below this many matched tokens per half the fundamentals split is withheld. */
export const MIN_SPLIT_HALF = 20;

/** Hard ceilings so a malformed input cannot produce unbounded work or output. */
export const MAX_DEPTH = 200;
const MIN_DEPTH = 2;
const MAX_ROWS = 1000;
const MAX_SYMBOL_LENGTH = 40;
const MIN_SCORE = 0;
const MAX_SCORE = 250;

/** Band thresholds, taken from the original blockchaincenter reading of the metric. */
const ALTCOIN_SEASON_THRESHOLD = 75;
const BITCOIN_SEASON_THRESHOLD = 25;

export type SeasonBand = "altcoin-season" | "neither" | "bitcoin-season";

/**
 * The minimum row this module needs. UniverseRow from the build time data layer
 * satisfies it structurally, which keeps this file free of any server import.
 */
export interface SeasonRow {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly rank: number;
  readonly change24h: number | null;
  readonly change7d: number | null;
  readonly change30d: number | null;
  readonly change200d: number | null;
  readonly change1y: number | null;
  readonly isStablecoin: boolean;
}

export interface SeasonIndex {
  readonly window: SeasonWindow;
  readonly depth: number;
  /** Assets in the depth slice that beat Bitcoin over the window. */
  readonly beat: number;
  /** Assets in the depth slice carrying a change for the window. */
  readonly comparable: number;
  /** Assets in the depth slice dropped because the window change was null. */
  readonly excluded: number;
  /** beat divided by comparable, expressed 0 to 100 and rounded to one decimal. */
  readonly value: number;
  readonly band: SeasonBand;
  /** Bitcoin's own percentage change over the window, the benchmark being cleared. */
  readonly bitcoinChange: number;
}

export interface SeasonContributor {
  readonly symbol: string;
  readonly name: string;
  readonly rank: number;
  readonly change: number;
  /** change minus Bitcoin's change, in percentage points. Positive means it beat Bitcoin. */
  readonly margin: number;
  readonly score: number | null;
}

export interface FundamentalsSplit {
  readonly window: SeasonWindow;
  readonly depth: number;
  /** Tokens in the depth slice that joined the scorecard on ticker symbol. */
  readonly matched: number;
  /** Median score across the matched tokens, null when nothing matched. */
  readonly medianScore: number | null;
  readonly aboveMedian: SeasonIndex | null;
  readonly belowMedian: SeasonIndex | null;
  /** False when either half holds fewer than MIN_SPLIT_HALF tokens. */
  readonly meaningful: boolean;
  readonly halfSize: number;
}

export interface DepthPoint {
  readonly depth: number;
  readonly index: SeasonIndex | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Reads the change for one window. Returns null when the provider served nothing. */
export function changeForWindow(row: SeasonRow, lookback: SeasonWindow): number | null {
  if (!row || typeof row !== "object") throw new TypeError("changeForWindow needs a row.");
  if (!SEASON_WINDOWS.includes(lookback)) throw new RangeError(`Unknown window ${String(lookback)}.`);
  const value =
    lookback === "24h" ? row.change24h
      : lookback === "7d" ? row.change7d
        : lookback === "30d" ? row.change30d
          : lookback === "200d" ? row.change200d
            : row.change1y;
  return isFiniteNumber(value) ? value : null;
}

/** Maps an index value to its band. Guards the 0 to 100 range at the boundary. */
export function classifyIndex(value: number): SeasonBand {
  if (!isFiniteNumber(value)) throw new TypeError("classifyIndex needs a finite value.");
  if (value < 0 || value > 100) throw new RangeError("An index value must sit between 0 and 100.");
  if (value >= ALTCOIN_SEASON_THRESHOLD) return "altcoin-season";
  if (value <= BITCOIN_SEASON_THRESHOLD) return "bitcoin-season";
  return "neither";
}

export function bandLabel(band: SeasonBand): string {
  if (band === "altcoin-season") return "Altcoin season";
  if (band === "bitcoin-season") return "Bitcoin season";
  return "Neither season";
}

/**
 * The ranked slice the index is computed over. Stablecoins and Bitcoin are both
 * removed before the depth is cut, so a depth of 50 means the 50 largest non
 * stablecoin assets other than Bitcoin and the denominator is 50 rather than 49.
 * Sorting is by market cap rank ascending so the slice is deterministic.
 */
export function eligibleRows(rows: readonly SeasonRow[], depth: number): readonly SeasonRow[] {
  if (!Array.isArray(rows)) throw new TypeError("eligibleRows needs an array of rows.");
  if (!Number.isInteger(depth) || depth < MIN_DEPTH || depth > MAX_DEPTH) return [];
  const ranked: SeasonRow[] = [];
  const ceiling = Math.min(rows.length, MAX_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    const row = rows[index];
    if (!row || typeof row !== "object") continue;
    if (row.isStablecoin) continue;
    if (row.id === "bitcoin") continue;
    if (!isFiniteNumber(row.rank)) continue;
    ranked.push(row);
  }
  ranked.sort((left, right) => left.rank - right.rank);
  return ranked.slice(0, depth);
}

/**
 * The index itself. Returns null when fewer than MIN_COMPARABLE assets in the
 * slice carry a change for the window, because a share of eight or nine assets
 * moves ten points on one row and reads as precision it does not have.
 */
export function computeSeasonIndex(
  rows: readonly SeasonRow[],
  bitcoin: SeasonRow,
  lookback: SeasonWindow,
  depth: number,
): SeasonIndex | null {
  if (!Array.isArray(rows)) throw new TypeError("computeSeasonIndex needs an array of rows.");
  if (!bitcoin || typeof bitcoin !== "object") throw new TypeError("computeSeasonIndex needs a Bitcoin row.");
  const benchmark = changeForWindow(bitcoin, lookback);
  if (benchmark === null) return null;
  const slice = eligibleRows(rows, depth);
  let beat = 0;
  let comparable = 0;
  let excluded = 0;
  const ceiling = Math.min(slice.length, MAX_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    const change = changeForWindow(slice[index], lookback);
    if (change === null) {
      excluded += 1;
      continue;
    }
    comparable += 1;
    if (change > benchmark) beat += 1;
  }
  if (comparable < MIN_COMPARABLE) return null;
  const raw = (beat / comparable) * 100;
  if (!isFiniteNumber(raw)) return null;
  const value = Math.round(raw * 10) / 10;
  return { window: lookback, depth, beat, comparable, excluded, value, band: classifyIndex(value), bitcoinChange: benchmark };
}

/** The same index recomputed at every depth on the ladder. */
export function buildDepthCurve(
  rows: readonly SeasonRow[],
  bitcoin: SeasonRow,
  lookback: SeasonWindow,
  depths: readonly number[] = SEASON_DEPTHS,
): readonly DepthPoint[] {
  if (!Array.isArray(depths)) throw new TypeError("buildDepthCurve needs an array of depths.");
  const points: DepthPoint[] = [];
  const ceiling = Math.min(depths.length, SEASON_DEPTHS.length + 8);
  for (let index = 0; index < ceiling; index += 1) {
    const depth = depths[index];
    if (!Number.isInteger(depth) || depth < MIN_DEPTH || depth > MAX_DEPTH) continue;
    points.push({ depth, index: computeSeasonIndex(rows, bitcoin, lookback, depth) });
  }
  return points;
}

/**
 * Every asset in the slice that carries a change, sorted by its margin over
 * Bitcoin. The list is capped at MAX_DEPTH entries so a caller cannot grow it
 * without bound.
 */
export function buildContributors(
  rows: readonly SeasonRow[],
  bitcoin: SeasonRow,
  lookback: SeasonWindow,
  depth: number,
  scores: ReadonlyMap<string, number>,
): readonly SeasonContributor[] {
  if (!(scores instanceof Map)) throw new TypeError("buildContributors needs a score map.");
  const benchmark = changeForWindow(bitcoin, lookback);
  if (benchmark === null) return [];
  const slice = eligibleRows(rows, depth);
  const contributors: SeasonContributor[] = [];
  const ceiling = Math.min(slice.length, MAX_DEPTH);
  for (let index = 0; index < ceiling; index += 1) {
    const row = slice[index];
    const change = changeForWindow(row, lookback);
    if (change === null) continue;
    const margin = change - benchmark;
    if (!isFiniteNumber(margin)) continue;
    const score = scores.get(row.symbol);
    contributors.push({
      symbol: row.symbol,
      name: row.name,
      rank: row.rank,
      change,
      margin,
      score: isFiniteNumber(score) ? score : null,
    });
  }
  contributors.sort((left, right) => right.margin - left.margin);
  return contributors;
}

/** Median of a numeric list. Returns null on an empty list rather than NaN. */
export function medianOf(values: readonly number[]): number | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted: number[] = [];
  const ceiling = Math.min(values.length, MAX_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    if (isFiniteNumber(values[index])) sorted.push(values[index]);
  }
  if (sorted.length === 0) return null;
  sorted.sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  const pair = (sorted[middle - 1] + sorted[middle]) / 2;
  return isFiniteNumber(pair) ? pair : null;
}

/**
 * Splits the depth slice at the median of earlythunder's own fundamental score
 * and computes the index separately for each half.
 *
 * The halves are formed by sorting the matched tokens on score and taking the
 * top and bottom halves of equal size, dropping the middle token when the
 * matched count is odd. Equal halves keep the two shares comparable, and the
 * dropped token is reported rather than silently absorbed.
 */
export function computeFundamentalsSplit(
  rows: readonly SeasonRow[],
  bitcoin: SeasonRow,
  lookback: SeasonWindow,
  depth: number,
  scores: ReadonlyMap<string, number>,
): FundamentalsSplit {
  if (!(scores instanceof Map)) throw new TypeError("computeFundamentalsSplit needs a score map.");
  const slice = eligibleRows(rows, depth);
  const matchedRows: { readonly row: SeasonRow; readonly score: number }[] = [];
  const ceiling = Math.min(slice.length, MAX_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    const row = slice[index];
    const score = scores.get(row.symbol);
    if (!isFiniteNumber(score)) continue;
    matchedRows.push({ row, score });
  }
  const matched = matchedRows.length;
  const medianScore = medianOf(matchedRows.map((entry) => entry.score));
  const halfSize = Math.floor(matched / 2);
  const empty: FundamentalsSplit = {
    window: lookback, depth, matched, medianScore, aboveMedian: null, belowMedian: null,
    meaningful: false, halfSize,
  };
  if (halfSize < MIN_SPLIT_HALF) return empty;
  const sorted = matchedRows.slice().sort((left, right) => right.score - left.score);
  const above = sorted.slice(0, halfSize).map((entry) => entry.row);
  const below = sorted.slice(matched - halfSize).map((entry) => entry.row);
  const aboveIndex = computeSeasonIndex(above, bitcoin, lookback, MAX_DEPTH);
  const belowIndex = computeSeasonIndex(below, bitcoin, lookback, MAX_DEPTH);
  if (aboveIndex === null || belowIndex === null) return empty;
  return {
    window: lookback, depth, matched, medianScore,
    aboveMedian: { ...aboveIndex, depth },
    belowMedian: { ...belowIndex, depth },
    meaningful: true,
    halfSize,
  };
}

/**
 * Validates the raw altcoin scorecard JSON into a symbol to score map. Takes
 * unknown so a malformed data file fails at this boundary rather than deeper in
 * the page. Duplicate symbols keep the first, highest ranked occurrence.
 */
export function readScorecardScores(raw: unknown): ReadonlyMap<string, number> {
  const scores = new Map<string, number>();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return scores;
  const tokens = (raw as Record<string, unknown>).tokens;
  if (!Array.isArray(tokens)) return scores;
  const ceiling = Math.min(tokens.length, MAX_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    const entry = tokens[index];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const symbol = typeof record.symbol === "string" ? record.symbol.trim().toUpperCase() : "";
    const score = record.score;
    if (symbol.length === 0 || symbol.length > MAX_SYMBOL_LENGTH) continue;
    if (!isFiniteNumber(score) || score < MIN_SCORE || score > MAX_SCORE) continue;
    if (!scores.has(symbol)) scores.set(symbol, score);
  }
  return scores;
}

/** Reads the scorecard snapshot date, or null when the file does not carry one. */
export function readScorecardDate(raw: unknown): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = (raw as Record<string, unknown>).updated_at;
  if (typeof value !== "string" || value.length === 0 || value.length > 40) return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

export function windowLabel(lookback: SeasonWindow): string {
  if (lookback === "24h") return "24 hours";
  if (lookback === "7d") return "7 days";
  if (lookback === "30d") return "30 days";
  if (lookback === "200d") return "200 days";
  return "1 year";
}

/** Formats an index value for display. Never emits NaN or Infinity. */
export function formatIndexValue(value: number | null): string {
  if (value === null || !isFiniteNumber(value)) return "not available";
  return value.toFixed(1);
}

/** Formats a percentage point figure with an explicit sign. */
export function formatSignedPercent(value: number | null, digits = 1): string {
  if (value === null || !isFiniteNumber(value)) return "not available";
  const rounded = Number(value.toFixed(digits));
  if (!isFiniteNumber(rounded)) return "not available";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(digits)}%`;
}
