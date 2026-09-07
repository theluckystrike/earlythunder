/**
 * Pure market capitalization math for the crypto market cap calculator.
 *
 * No I/O, no framework imports, no clock reads. Every exported function is
 * total: it either returns a finite number or it returns null. Nothing here
 * invents a value, repairs a provider field, or divides by a zero or a null.
 *
 * Two answers are produced for every pair. The circulating answer is the one
 * every ranked competitor prints, taken from circulating market capitalization
 * on both sides. The fully diluted answer applies the target's fully diluted
 * valuation across the source token's eventual supply. The gap between the two
 * is the dilution haircut.
 */

/** Hard ceilings so a malformed row cannot produce unbounded or absurd output. */
export const MAX_VALUATION_USD = 1e15;
export const MAX_SUPPLY_UNITS = 1e30;
export const MAX_PRICE_USD = 1e7;
export const MAX_PEER_ROWS = 600;
export const MAX_SCORECARD_SUBSCORE = 10;

/** Which provider field the eventual supply came from. */
export type SupplyBasis = "circulating" | "total" | "max" | "fdv" | "unavailable";

/** Which provider field the fully diluted valuation came from. */
export type ValuationBasis = "provider" | "derived" | "unavailable";

/** One side of a comparison, carrying only the fields the math needs. */
export interface TokenLeg {
  readonly symbol: string;
  readonly name: string;
  readonly rank: number;
  readonly price: number;
  readonly marketCap: number;
  readonly fullyDilutedValuation: number | null;
  readonly circulatingSupply: number;
  readonly totalSupply: number | null;
  readonly maxSupply: number | null;
}

/** Early Thunder's own dated research row for a token, when one exists. */
export interface ScorecardOverlay {
  readonly score: number;
  readonly maxScore: number;
  readonly verdict: string;
  readonly unlockSchedule: number;
  readonly circFdvRatio: number;
}

/** A universe row as embedded in the page and read by the browser. */
export interface MarketCapRow extends TokenLeg {
  readonly id: string;
  readonly isStablecoin: boolean;
  readonly scorecard: ScorecardOverlay | null;
}

/** Everything the client component needs, embedded at build time. */
export interface MarketCapSnapshot {
  readonly fetchedAt: string;
  readonly scorecardUpdatedAt: string;
  readonly rows: readonly MarketCapRow[];
  readonly defaultSourceId: string;
  readonly defaultTargetId: string;
}

/** A supply figure with the field it was read from. */
export interface SupplyReading {
  readonly units: number | null;
  readonly basis: SupplyBasis;
}

/** A circulating share percentage with the denominator it was read from. */
export interface ShareReading {
  readonly percent: number | null;
  readonly basis: "total" | "max" | "unavailable";
}

/** A fully diluted valuation with the field it was read from. */
export interface ValuationReading {
  readonly usd: number | null;
  readonly basis: ValuationBasis;
}

/** One computed answer lane. Every field is null when an input was missing. */
export interface Lane {
  readonly targetValuationUsd: number | null;
  readonly supplyUnits: number | null;
  readonly supplyBasis: SupplyBasis;
  readonly impliedPrice: number | null;
  readonly multiple: number | null;
  readonly impliedMarketCapUsd: number | null;
  readonly impliedRank: number | null;
}

/** The full result of comparing one token against a target valuation. */
export interface Comparison {
  readonly circulating: Lane;
  readonly diluted: Lane;
  readonly dilutionHaircutPercent: number | null;
  readonly sourceShare: ShareReading;
  readonly targetShare: ShareReading | null;
  readonly targetDilutedValuation: ValuationReading;
  readonly usedOverride: boolean;
}

/** Input to the single entry point. */
export interface ComparisonInput {
  readonly source: TokenLeg;
  readonly target: TokenLeg | null;
  readonly overrideValuationUsd: number | null;
  readonly peerMarketCaps: readonly number[];
}

const UNAVAILABLE_SUPPLY: SupplyReading = { units: null, basis: "unavailable" };
const UNAVAILABLE_SHARE: ShareReading = { percent: null, basis: "unavailable" };
const UNAVAILABLE_VALUATION: ValuationReading = { usd: null, basis: "unavailable" };
const EMPTY_LANE: Lane = {
  targetValuationUsd: null,
  supplyUnits: null,
  supplyBasis: "unavailable",
  impliedPrice: null,
  multiple: null,
  impliedMarketCapUsd: null,
  impliedRank: null,
};

/**
 * Accepts a value only when it is a finite number strictly above zero and no
 * greater than the ceiling. Everything else, including a null, a NaN, an
 * Infinity and a negative, becomes null.
 */
export function positiveWithin(value: number | null | undefined, ceiling: number): number | null {
  if (typeof ceiling !== "number" || !Number.isFinite(ceiling) || ceiling <= 0) return null;
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0 || value > ceiling) return null;
  return value;
}

/** True when a leg carries the minimum fields the math needs. */
export function isUsableLeg(leg: TokenLeg | null | undefined): leg is TokenLeg {
  if (leg === null || leg === undefined || typeof leg !== "object") return false;
  if (typeof leg.symbol !== "string" || leg.symbol.length === 0) return false;
  if (positiveWithin(leg.price, MAX_PRICE_USD) === null) return false;
  if (positiveWithin(leg.marketCap, MAX_VALUATION_USD) === null) return false;
  return positiveWithin(leg.circulatingSupply, MAX_SUPPLY_UNITS) !== null;
}

/**
 * Circulating supply as a percentage of eventual supply, using total supply
 * first and maximum supply second. A token that reports neither returns an
 * explicit unavailable reading rather than a zero.
 */
export function circulatingSharePercent(leg: TokenLeg | null): ShareReading {
  if (!isUsableLeg(leg)) return UNAVAILABLE_SHARE;
  const circulating = positiveWithin(leg.circulatingSupply, MAX_SUPPLY_UNITS);
  if (circulating === null) return UNAVAILABLE_SHARE;
  const total = positiveWithin(leg.totalSupply, MAX_SUPPLY_UNITS);
  const max = positiveWithin(leg.maxSupply, MAX_SUPPLY_UNITS);
  const denominator = total ?? max;
  if (denominator === null) return UNAVAILABLE_SHARE;
  const percent = (circulating / denominator) * 100;
  if (!Number.isFinite(percent) || percent <= 0 || percent > 1000) return UNAVAILABLE_SHARE;
  return { percent, basis: total === null ? "max" : "total" };
}

/**
 * The supply the token eventually reaches. Total supply is preferred, maximum
 * supply is the second choice, and the provider's fully diluted valuation
 * divided by price is the third. A token with none of the three returns
 * unavailable, which forces the fully diluted lane to render nothing.
 */
export function eventualSupply(leg: TokenLeg | null): SupplyReading {
  if (!isUsableLeg(leg)) return UNAVAILABLE_SUPPLY;
  const total = positiveWithin(leg.totalSupply, MAX_SUPPLY_UNITS);
  if (total !== null) return { units: total, basis: "total" };
  const max = positiveWithin(leg.maxSupply, MAX_SUPPLY_UNITS);
  if (max !== null) return { units: max, basis: "max" };
  const fdv = positiveWithin(leg.fullyDilutedValuation, MAX_VALUATION_USD);
  const price = positiveWithin(leg.price, MAX_PRICE_USD);
  if (fdv === null || price === null) return UNAVAILABLE_SUPPLY;
  const derived = fdv / price;
  if (!Number.isFinite(derived) || derived <= 0 || derived > MAX_SUPPLY_UNITS) return UNAVAILABLE_SUPPLY;
  return { units: derived, basis: "fdv" };
}

/**
 * The token's fully diluted valuation. The provider field is used when it is
 * present, otherwise price times eventual supply is derived, otherwise the
 * reading is unavailable and no fully diluted answer is shown.
 */
export function dilutedValuation(leg: TokenLeg | null): ValuationReading {
  if (!isUsableLeg(leg)) return UNAVAILABLE_VALUATION;
  const provider = positiveWithin(leg.fullyDilutedValuation, MAX_VALUATION_USD);
  if (provider !== null) return { usd: provider, basis: "provider" };
  const price = positiveWithin(leg.price, MAX_PRICE_USD);
  const supply = eventualSupply(leg);
  if (price === null || supply.units === null) return UNAVAILABLE_VALUATION;
  const derived = price * supply.units;
  if (!Number.isFinite(derived) || derived <= 0 || derived > MAX_VALUATION_USD) return UNAVAILABLE_VALUATION;
  return { usd: derived, basis: "derived" };
}

/** Target valuation spread across a supply. Null whenever either input fails. */
export function impliedPrice(targetValuationUsd: number | null, supplyUnits: number | null): number | null {
  const valuation = positiveWithin(targetValuationUsd, MAX_VALUATION_USD);
  const supply = positiveWithin(supplyUnits, MAX_SUPPLY_UNITS);
  if (valuation === null || supply === null) return null;
  const price = valuation / supply;
  if (!Number.isFinite(price) || price <= 0 || price > MAX_VALUATION_USD) return null;
  return price;
}

/** How many times today's price the implied price is. */
export function priceMultiple(implied: number | null, currentPrice: number | null): number | null {
  const target = positiveWithin(implied, MAX_VALUATION_USD);
  const current = positiveWithin(currentPrice, MAX_PRICE_USD);
  if (target === null || current === null) return null;
  const multiple = target / current;
  if (!Number.isFinite(multiple) || multiple <= 0) return null;
  return multiple;
}

/** An implied price applied to today's circulating float. */
export function impliedMarketCap(implied: number | null, circulatingSupply: number | null): number | null {
  const price = positiveWithin(implied, MAX_VALUATION_USD);
  const supply = positiveWithin(circulatingSupply, MAX_SUPPLY_UNITS);
  if (price === null || supply === null) return null;
  const cap = price * supply;
  if (!Number.isFinite(cap) || cap <= 0 || cap > MAX_VALUATION_USD) return null;
  return cap;
}

/**
 * The percentage the honest fully diluted answer sits below the circulating
 * answer. A positive number means the competitors' figure is too high. A
 * negative number means the target itself carries the larger supply overhang,
 * so the fully diluted answer is the higher of the two.
 */
export function dilutionHaircutPercent(circulatingPrice: number | null, dilutedPrice: number | null): number | null {
  const naive = positiveWithin(circulatingPrice, MAX_VALUATION_USD);
  const honest = positiveWithin(dilutedPrice, MAX_VALUATION_USD);
  if (naive === null || honest === null) return null;
  const haircut = (1 - honest / naive) * 100;
  if (!Number.isFinite(haircut)) return null;
  return haircut;
}

/**
 * Where a market capitalization would sit in the ranking, counting only peers
 * strictly above it. The caller must exclude the token being repriced from the
 * peer list, otherwise the token counts itself.
 */
export function impliedRank(peerMarketCaps: readonly number[], marketCapUsd: number | null): number | null {
  if (!Array.isArray(peerMarketCaps) || peerMarketCaps.length === 0) return null;
  if (peerMarketCaps.length > MAX_PEER_ROWS) return null;
  const cap = positiveWithin(marketCapUsd, MAX_VALUATION_USD);
  if (cap === null) return null;
  let above = 0;
  const ceiling = Math.min(peerMarketCaps.length, MAX_PEER_ROWS);
  for (let index = 0; index < ceiling; index += 1) {
    const peer = positiveWithin(peerMarketCaps[index], MAX_VALUATION_USD);
    if (peer !== null && peer > cap) above += 1;
  }
  return above + 1;
}

/** Builds one lane from a target valuation and a supply reading. */
function buildLane(
  targetValuationUsd: number | null,
  supply: SupplyReading,
  source: TokenLeg,
  peerMarketCaps: readonly number[],
): Lane {
  const valuation = positiveWithin(targetValuationUsd, MAX_VALUATION_USD);
  if (valuation === null || supply.units === null) return EMPTY_LANE;
  const price = impliedPrice(valuation, supply.units);
  if (price === null) return EMPTY_LANE;
  const cap = impliedMarketCap(price, source.circulatingSupply);
  return {
    targetValuationUsd: valuation,
    supplyUnits: supply.units,
    supplyBasis: supply.basis,
    impliedPrice: price,
    multiple: priceMultiple(price, source.price),
    impliedMarketCapUsd: cap,
    impliedRank: impliedRank(peerMarketCaps, cap),
  };
}

/**
 * The single entry point. Produces the circulating answer, the fully diluted
 * answer, the haircut between them, and the circulating share of both sides.
 *
 * An override valuation replaces the target's market capitalization on the
 * circulating lane and the target's fully diluted valuation on the diluted
 * lane, so the two lanes then differ only by the source token's own supply.
 */
export function compareLegs(input: ComparisonInput): Comparison {
  if (input === null || typeof input !== "object") {
    return {
      circulating: EMPTY_LANE,
      diluted: EMPTY_LANE,
      dilutionHaircutPercent: null,
      sourceShare: UNAVAILABLE_SHARE,
      targetShare: null,
      targetDilutedValuation: UNAVAILABLE_VALUATION,
      usedOverride: false,
    };
  }
  const { source, target, overrideValuationUsd, peerMarketCaps } = input;
  const override = positiveWithin(overrideValuationUsd, MAX_VALUATION_USD);
  const usable = isUsableLeg(source);
  const targetLeg = isUsableLeg(target) ? target : null;
  const targetFdv = dilutedValuation(targetLeg);
  if (!usable) {
    return {
      circulating: EMPTY_LANE,
      diluted: EMPTY_LANE,
      dilutionHaircutPercent: null,
      sourceShare: UNAVAILABLE_SHARE,
      targetShare: targetLeg === null ? null : circulatingSharePercent(targetLeg),
      targetDilutedValuation: targetFdv,
      usedOverride: override !== null,
    };
  }
  const peers = Array.isArray(peerMarketCaps) ? peerMarketCaps : [];
  const circulatingTarget = override ?? (targetLeg === null ? null : targetLeg.marketCap);
  const dilutedTarget = override ?? targetFdv.usd;
  const circulating = buildLane(
    circulatingTarget,
    { units: source.circulatingSupply, basis: "circulating" },
    source,
    peers,
  );
  const diluted = buildLane(dilutedTarget, eventualSupply(source), source, peers);
  return {
    circulating,
    diluted,
    dilutionHaircutPercent: dilutionHaircutPercent(circulating.impliedPrice, diluted.impliedPrice),
    sourceShare: circulatingSharePercent(source),
    targetShare: targetLeg === null ? null : circulatingSharePercent(targetLeg),
    targetDilutedValuation: targetFdv,
    usedOverride: override !== null,
  };
}

/** Fully diluted valuation divided by circulating market capitalization. */
export function overhangMultiple(leg: TokenLeg | null): number | null {
  if (!isUsableLeg(leg)) return null;
  const fdv = dilutedValuation(leg).usd;
  const cap = positiveWithin(leg.marketCap, MAX_VALUATION_USD);
  if (fdv === null || cap === null) return null;
  const ratio = fdv / cap;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  return ratio;
}

/* Formatting. Pure, locale fixed, and null safe so no view renders NaN. */

/** United States dollars, with more decimals for sub cent prices. */
export function formatUsd(value: number | null, forceDecimals?: number): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  const magnitude = Math.abs(value);
  const decimals = typeof forceDecimals === "number" ? forceDecimals : magnitude > 0 && magnitude < 0.01 ? 8 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Large valuations shortened to billions or millions. */
export function formatCompactUsd(value: number | null): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  if (Math.abs(value) >= 1e9) return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value / 1e9)}B USD`;
  if (Math.abs(value) >= 1e6) return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value / 1e6)}M USD`;
  return formatUsd(value, 0);
}

/** A ratio rendered as a multiple of today's price. */
export function formatMultiple(value: number | null): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(value)}x`;
}

/** A percentage already expressed in percentage points. */
export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}%`;
}

/** A whole number rank. */
export function formatRank(value: number | null): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return `#${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

/** A token quantity. */
export function formatSupply(value: number | null): string {
  if (value === null || typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/** Plain English for the field a supply reading came from. */
export function supplyBasisLabel(basis: SupplyBasis): string {
  if (basis === "circulating") return "circulating supply";
  if (basis === "total") return "total supply";
  if (basis === "max") return "maximum supply";
  if (basis === "fdv") return "fully diluted valuation divided by price";
  return "not reported";
}
