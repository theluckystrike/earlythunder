import screensData from "../../data/scorecard-screens.json";

/**
 * Typed access to data/scorecard-screens.json, written by
 * scripts/build-longtail-layer.mjs.
 *
 * A screen is a filter over the rated universe that a reader could state as a
 * question. The mispricing record is the one figure the whole scorecard exists
 * to produce: the gap between where a token ranks on fundamentals and where it
 * ranks by market capitalisation. That gap only carries information because
 * score and size are uncorrelated inside a size band.
 */

const MAX_SCREENS = 40;
const MAX_ROWS = 400;

export interface ScreenRow {
  readonly symbol: string;
  readonly slug: string;
  readonly name: string;
  readonly score: number;
  readonly rank_overall: number;
  readonly verdict: string;
  readonly verdict_color: string;
  readonly one_liner: string | null;
  readonly chain: string | null;
  readonly market_cap: number | null;
  readonly market_cap_rank: number | null;
  readonly dilution_x: number | null;
  readonly drawdown_pct: number | null;
  /** True when the published text says the protocol is currently impaired. */
  readonly impaired: boolean;
}

export interface MispriceRow extends ScreenRow {
  readonly band: string;
  readonly band_slug: string;
  readonly band_size: number;
  readonly fundamental_rank: number;
  readonly cap_rank: number;
  /** Raw places between the two ranks inside the band. */
  readonly rank_gap: number;
  /** The same gap in percentile points of the band, so bands compare. */
  readonly gap: number;
}

export interface Screen {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
  readonly universe: number;
  readonly median_score: number | null;
  readonly top_score: number;
  readonly bottom_score: number;
  readonly impaired_count: number;
  readonly members: readonly ScreenRow[];
}

export interface Mispricing {
  readonly method: string;
  readonly bands: number;
  readonly universe: number;
  readonly min_gap: number;
  readonly excluded_impaired: readonly string[];
  /** Tokens held out because their vector carries too little signal to rank. */
  readonly excluded_low_confidence: number;
  readonly underpriced_total: number;
  readonly overpriced_total: number;
  readonly underpriced: readonly MispriceRow[];
  readonly overpriced: readonly MispriceRow[];
}

interface ScreensFile {
  readonly generated_at: string;
  readonly source_updated_at: string | null;
  readonly universe_size: number;
  readonly max_score: number;
  readonly market_fetched_at: string | null;
  readonly screens: readonly Screen[];
  readonly mispricing: Mispricing | null;
}

const FILE = screensData as unknown as ScreensFile;

/** Every published screen. */
export function getAllScreens(): readonly Screen[] {
  if (!FILE || !Array.isArray(FILE.screens)) return [];
  return FILE.screens.length > MAX_SCREENS ? FILE.screens.slice(0, MAX_SCREENS) : FILE.screens;
}

/** One screen by slug. Null when absent. */
export function getScreen(slug: string): Screen | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const all = getAllScreens();
  for (let i = 0; i < all.length && i < MAX_SCREENS; i += 1) {
    if (all[i].slug === slug.toLowerCase()) return all[i];
  }
  return null;
}

/** Members of a screen, bounded. Already ordered best score first. */
export function getScreenMembers(screen: Screen): readonly ScreenRow[] {
  if (!screen || !Array.isArray(screen.members)) return [];
  return screen.members.length > MAX_ROWS ? screen.members.slice(0, MAX_ROWS) : screen.members;
}

/** The mispricing record. Null when too few tokens carry live market data. */
export function getMispricing(): Mispricing | null {
  if (!FILE || !FILE.mispricing) return null;
  return FILE.mispricing;
}

/** File-level metadata. */
export function getScreensMeta() {
  if (!FILE || !Array.isArray(FILE.screens)) {
    throw new Error("screens file is missing or malformed");
  }
  return {
    generated_at: FILE.generated_at,
    source_updated_at: FILE.source_updated_at,
    universe_size: FILE.universe_size,
    max_score: FILE.max_score,
    market_fetched_at: FILE.market_fetched_at,
    count: FILE.screens.length,
  };
}
