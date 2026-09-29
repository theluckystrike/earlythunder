import rankingsData from "../../data/scorecard-rankings.json";

/**
 * Typed access to data/scorecard-rankings.json, written by
 * scripts/build-rankings.mjs.
 *
 * A ranking is a list page that answers one long-tail question ("most
 * deflationary crypto", "undervalued altcoins") with a stated rule over the
 * same scored universe the screens use. Unlike a screen, membership is ranked
 * on the variable itself first and composite score second, so the headline
 * order answers the question directly.
 */

const MAX_RANKINGS = 20;

export interface RankingRow {
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
  readonly impaired: boolean;
  /** Percentile on the headline variable, where the ranking defines one. */
  readonly supply_pct?: number;
  readonly buyback_pct?: number;
  readonly net_pct?: number;
  readonly ps_pct?: number;
  readonly supply_value?: number | string | null;
  readonly ps_value?: number | string | null;
}

export interface Ranking {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
  readonly members: readonly RankingRow[];
}

interface RankingsFile {
  readonly generated_at: string;
  readonly source_updated_at: string | null;
  readonly market_fetched_at: string | null;
  readonly universe_size: number;
  readonly max_score: number | null;
  readonly rankings: readonly Ranking[];
}

const FILE = rankingsData as unknown as RankingsFile;

/** Every published ranking. */
export function getAllRankings(): readonly Ranking[] {
  if (!FILE || !Array.isArray(FILE.rankings)) return [];
  return FILE.rankings.length > MAX_RANKINGS ? FILE.rankings.slice(0, MAX_RANKINGS) : FILE.rankings;
}

/** One ranking by slug. Null when absent. */
export function getRanking(slug: string): Ranking | null {
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 64) return null;
  const found = getAllRankings().find((r) => r.slug === slug);
  return found ?? null;
}

export function getRankingsMeta() {
  if (!FILE || !Array.isArray(FILE.rankings)) {
    throw new Error("rankings file is missing or malformed");
  }
  return {
    generated_at: FILE.generated_at,
    source_updated_at: FILE.source_updated_at,
    market_fetched_at: FILE.market_fetched_at,
    universe_size: FILE.universe_size,
    max_score: FILE.max_score,
    count: FILE.rankings.length,
  };
}
