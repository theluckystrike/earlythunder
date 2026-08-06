import analyticsData from "../../data/scorecard-analytics.json";

/**
 * Typed access to data/scorecard-analytics.json, the derived layer built by
 * scripts/build-scorecard-analytics.mjs.
 *
 * Every field here is either copied from data/altcoin-scorecard.json or is
 * arithmetic over the 251-token universe. Nothing in this file introduces a
 * claim that is not reproducible from those two inputs.
 */

/** Hard ceilings so a malformed data file cannot produce unbounded output. */
const MAX_TOKENS = 2000;
const MAX_GROUPS = 200;

export interface ScoredVariable {
  readonly key: string;
  readonly label: string;
  readonly group: string;
  readonly value: number;
  readonly rank: number;
  readonly percentile: number | null;
  readonly universe_median: number | null;
}

export interface Dilution {
  readonly mcap: number | null;
  readonly fdv: number | null;
  readonly circulating_supply: number | null;
  readonly eventual_supply: number | null;
  readonly dilution_x: number | null;
  readonly overhang_pct: number | null;
  readonly circ_pct: number | null;
  readonly basis: string;
}

export interface Drawdown {
  readonly ath: number | null;
  readonly ath_date: string | null;
  readonly distance_pct: number | null;
  readonly recovery_x: number | null;
}

export interface MarketSnapshot {
  readonly price: number | null;
  readonly market_cap: number | null;
  readonly volume_24h: number | null;
  readonly change_24h: number | null;
  readonly market_cap_rank: number | null;
  /** New ticker when the token renamed after the scoring pass, else null. */
  readonly renamed_to: string | null;
  readonly coingecko_id: string | null;
  readonly as_of: string | null;
  /** "coingecko" when a live row was matched, "unavailable" when none was. */
  readonly source: string;
}

export interface Neighbour {
  readonly symbol: string;
  readonly name: string;
  readonly score: number;
  readonly verdict: string;
  readonly similarity: number;
}

export interface Citation {
  readonly claim: string;
  readonly source: string;
  readonly url: string | null;
  /** False when the URL returned a hard 404 or 410 at the last link check. */
  readonly link_ok: boolean;
}

export interface ScorecardToken {
  readonly symbol: string;
  readonly slug: string;
  readonly name: string;
  readonly score: number;
  readonly max_score: number;
  readonly prev_score: number | null;
  readonly score_delta: number | null;
  readonly rank_overall: number;
  readonly universe_size: number;
  readonly percentile_overall: number | null;
  readonly verdict: string;
  readonly verdict_color: string;
  readonly chain: string | null;
  readonly token_standard: string | null;
  readonly one_liner: string | null;
  readonly key_catalyst: string | null;
  /** Dates inside key_catalyst that have already passed. Empty when current. */
  readonly catalyst_expired_dates: readonly string[];
  readonly key_risk: string | null;
  readonly variables: readonly ScoredVariable[];
  readonly strengths: readonly ScoredVariable[];
  readonly weaknesses: readonly ScoredVariable[];
  readonly dilution: Dilution;
  readonly drawdown: Drawdown;
  readonly tvl: { readonly tvl: number | null; readonly mcap_per_tvl: number | null };
  readonly market: MarketSnapshot;
  readonly where_to_buy: readonly string[];
  readonly cmc_slug: string | null;
  readonly citations: readonly Citation[];
  readonly neighbours: readonly Neighbour[];
  readonly opportunity_slug: string | null;
}

export interface GroupMember {
  readonly symbol: string;
  readonly slug: string;
  readonly name: string;
  readonly score: number;
  readonly rank_overall: number;
  readonly verdict: string;
  readonly verdict_color: string;
  readonly one_liner: string | null;
  readonly market_cap: number | null;
  readonly dilution_x: number | null;
  readonly chain: string | null;
}

export interface ScorecardGroup {
  readonly kind: string;
  readonly name: string;
  readonly slug: string;
  readonly count: number;
  readonly median_score: number | null;
  readonly mean_score: number | null;
  readonly top_score: number;
  readonly bottom_score: number;
  readonly strongest_variables: readonly { readonly key: string; readonly label: string; readonly mean: number | null }[];
  readonly weakest_variables: readonly { readonly key: string; readonly label: string; readonly mean: number | null }[];
  readonly members: readonly GroupMember[];
}

export interface VariableSummary {
  readonly key: string;
  readonly label: string;
  readonly group: string;
  readonly mean: number | null;
  readonly median: number | null;
  readonly min: number;
  readonly max: number;
  readonly histogram: readonly number[];
}

export interface CitationLinkMeta {
  readonly checked_at: string | null;
  readonly dead_count: number;
}

export interface MarketDataMeta {
  readonly source: string;
  readonly source_url: string;
  readonly fetched_at: string;
  readonly covered: number;
  readonly unresolved: readonly string[];
}

interface AnalyticsFile {
  readonly generated_at: string;
  readonly source_updated_at: string | null;
  readonly citation_links: CitationLinkMeta;
  readonly market_data: MarketDataMeta;
  readonly methodology: string | null;
  readonly universe_size: number;
  readonly max_score: number;
  readonly score_range: { readonly min: number; readonly max: number };
  readonly variables: readonly VariableSummary[];
  readonly tokens: readonly ScorecardToken[];
  readonly groups: {
    readonly verdict: readonly ScorecardGroup[];
    readonly chain: readonly ScorecardGroup[];
  };
}

const ANALYTICS = analyticsData as unknown as AnalyticsFile;

/** Universe-level metadata: size, score range, methodology, generation date. */
export function getScorecardMeta() {
  if (!ANALYTICS || typeof ANALYTICS !== "object") {
    throw new Error("scorecard analytics file is missing or malformed");
  }
  if (!Array.isArray(ANALYTICS.tokens) || ANALYTICS.tokens.length === 0) {
    throw new Error("scorecard analytics contains no tokens");
  }
  return {
    generated_at: ANALYTICS.generated_at,
    source_updated_at: ANALYTICS.source_updated_at,
    methodology: ANALYTICS.methodology,
    citation_links: ANALYTICS.citation_links,
    market_data: ANALYTICS.market_data,
    universe_size: ANALYTICS.universe_size,
    max_score: ANALYTICS.max_score,
    score_range: ANALYTICS.score_range,
    variables: ANALYTICS.variables,
  };
}

/** Every token, already ordered best composite score first. */
export function getAllScorecardTokens(): readonly ScorecardToken[] {
  if (!Array.isArray(ANALYTICS.tokens)) return [];
  if (ANALYTICS.tokens.length > MAX_TOKENS) {
    return ANALYTICS.tokens.slice(0, MAX_TOKENS);
  }
  return ANALYTICS.tokens;
}

/** One token by its URL slug (the lowercased symbol). Null when absent. */
export function getScorecardToken(slug: string): ScorecardToken | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const tokens = getAllScorecardTokens();
  if (tokens.length === 0) return null;
  const wanted = slug.toLowerCase();
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    if (tokens[i].slug === wanted) return tokens[i];
  }
  return null;
}

/** Hub groups of one kind ("verdict" or "chain"). */
export function getScorecardGroups(kind: "verdict" | "chain"): readonly ScorecardGroup[] {
  if (kind !== "verdict" && kind !== "chain") return [];
  const groups = ANALYTICS.groups?.[kind];
  if (!Array.isArray(groups)) return [];
  return groups.length > MAX_GROUPS ? groups.slice(0, MAX_GROUPS) : groups;
}

/** One hub group by kind and slug. Null when absent. */
export function getScorecardGroup(
  kind: "verdict" | "chain",
  slug: string,
): ScorecardGroup | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const groups = getScorecardGroups(kind);
  if (groups.length === 0) return null;
  const wanted = slug.toLowerCase();
  for (let i = 0; i < groups.length && i < MAX_GROUPS; i += 1) {
    if (groups[i].slug === wanted) return groups[i];
  }
  return null;
}

/** Resolves a token record for each neighbour symbol, skipping any that vanish. */
export function resolveNeighbours(token: ScorecardToken): readonly ScorecardToken[] {
  if (!token || !Array.isArray(token.neighbours)) return [];
  if (token.neighbours.length === 0) return [];
  const out: ScorecardToken[] = [];
  for (let i = 0; i < token.neighbours.length && i < 20; i += 1) {
    const found = getScorecardToken(token.neighbours[i].symbol.toLowerCase());
    if (found !== null) out.push(found);
  }
  return out;
}
