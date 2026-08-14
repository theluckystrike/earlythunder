import tiersData from "../../data/scorecard-tiers.json";
import type { ScorecardGroup } from "./scorecard-analytics";

/**
 * Typed access to data/scorecard-tiers.json, written by
 * scripts/build-longtail-layer.mjs.
 *
 * A tier is a market-capitalisation band shaped exactly like the verdict and
 * chain groups, so it renders through the same hub component. It carries one
 * figure the other hubs have no use for: whether composite score and market
 * capitalisation move together inside the band. Across the bands they clearly
 * do. Inside one, the answer is the point of the page.
 */

const MAX_TIERS = 20;

export interface ScorecardTier extends ScorecardGroup {
  /** Lower bound of the band in USD. */
  readonly floor: number;
  /** Upper bound in USD, or null for the open-ended top band. */
  readonly ceiling: number | null;
  /**
   * Spearman correlation between composite score and market cap within the
   * band. Null when the band holds too few tokens to state one honestly.
   */
  readonly score_size_rho: number | null;
}

interface TiersFile {
  readonly generated_at: string;
  readonly source_updated_at: string | null;
  readonly universe_size: number;
  readonly max_score: number;
  readonly market_fetched_at: string | null;
  readonly tiers: readonly ScorecardTier[];
}

const FILE = tiersData as unknown as TiersFile;

/** Every size band that has members, largest band first. */
export function getAllTiers(): readonly ScorecardTier[] {
  if (!FILE || !Array.isArray(FILE.tiers)) return [];
  return FILE.tiers.length > MAX_TIERS ? FILE.tiers.slice(0, MAX_TIERS) : FILE.tiers;
}

/** One size band by slug. Null when absent. */
export function getTier(slug: string): ScorecardTier | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const all = getAllTiers();
  if (all.length === 0) return null;
  const wanted = slug.toLowerCase();
  for (let i = 0; i < all.length && i < MAX_TIERS; i += 1) {
    if (all[i].slug === wanted) return all[i];
  }
  return null;
}

/** File-level metadata for the tier layer. */
export function getTiersMeta() {
  if (!FILE || !Array.isArray(FILE.tiers) || FILE.tiers.length === 0) {
    throw new Error("tiers file is missing or carries no tiers");
  }
  return {
    generated_at: FILE.generated_at,
    source_updated_at: FILE.source_updated_at,
    universe_size: FILE.universe_size,
    max_score: FILE.max_score,
    market_fetched_at: FILE.market_fetched_at,
    covered: FILE.tiers.reduce((sum, tier) => sum + tier.count, 0),
  };
}

/** "$10B and above", "$250M to $1B". Reads the band in the units it is set in. */
export function tierRange(tier: ScorecardTier): string {
  if (!tier || !Number.isFinite(tier.floor)) return "";
  const money = (value: number): string => {
    if (value >= 1e9) return `$${value / 1e9}B`;
    return `$${value / 1e6}M`;
  };
  if (tier.ceiling === null) return `${money(tier.floor)} and above`;
  if (tier.floor === 0) return `under ${money(tier.ceiling)}`;
  return `${money(tier.floor)} to ${money(tier.ceiling)}`;
}

/**
 * What the within-band correlation says, in words. This is the sentence the
 * page exists for, so it states the null case as plainly as the measured one.
 */
export function tierPricingReading(tier: ScorecardTier): string {
  if (!tier) return "";
  if (tier.score_size_rho === null) {
    return (
      `The band holds ${tier.count} tokens, too few to put a correlation between score and size on ` +
      `the record without overstating it. The ranking below still stands on its own.`
    );
  }
  const rho = tier.score_size_rho;
  if (Math.abs(rho) < 0.2) {
    return (
      `Inside this band, composite score and market capitalisation correlate ${rho}. That is no ` +
      `relationship at all. Once the size bracket is fixed, being larger says nothing about scoring ` +
      `better, which means the ordering below disagrees with the ordering by market cap almost ` +
      `everywhere, and the disagreement is the reason to read it.`
    );
  }
  if (rho > 0) {
    return (
      `Inside this band, composite score and market capitalisation correlate ${rho}. The larger ` +
      `tokens here do tend to score better, so part of a high score is already reflected in size.`
    );
  }
  return (
    `Inside this band, composite score and market capitalisation correlate ${rho}. The smaller ` +
    `tokens here tend to score better, which is the inverse of what the market is pricing.`
  );
}
