/** Signal scores for the 8-signal pattern filter. Each value 0-100. */
export interface Signals {
  readonly working_code: number;     // 20% weight — Quality
  readonly dev_activity: number;     // 15% weight — Quality
  readonly smart_money: number;      // 10% weight — Quality (reduced from 15%)
  readonly community: number;        // 10% weight — Quality
  readonly catalyst: number;         // 15% weight — Quality
  readonly narrative: number;        // 5% weight — Quality
  readonly valuation_gap: number;    // 15% weight — Asymmetry (NEW)
  readonly obscurity: number;        // 10% weight — Asymmetry (NEW)
}

/** Asset class categories for opportunity classification. */
export type AssetClass =
  | "digital_assets"
  | "public_equities"
  | "private_markets";

/** Tier ranking: 1 = highest conviction, 3 = speculative. */
export type Tier = 1 | 2 | 3;

/** Classification of citation origin. */
export type CitationType = "official" | "news" | "data" | "research" | "filing" | "github";

/** Citation reference for opportunity claims. */
export interface Citation {
  readonly claim: string;
  readonly source: string;
  readonly url: string;
  readonly type?: CitationType;
}

/** On-chain metrics for DeFi and blockchain projects. */
export interface OnChainMetrics {
  readonly tvl?: string;
  readonly tvl_change_30d?: string;
  readonly daily_active_addresses?: string;
  readonly daa_change_30d?: string;
  readonly daily_transactions?: string;
  readonly tx_change_30d?: string;
  readonly fees_30d?: string;
  readonly revenue_30d?: string;
  readonly token_velocity?: string;
  readonly holder_count?: string;
  readonly top_10_holders_pct?: string;
  readonly whale_accumulation?: string;
  readonly sources?: readonly { readonly metric: string; readonly source: string; readonly url: string; readonly date: string }[];
}

/** Insider and whale trading activity. */
export interface InsiderActivity {
  readonly recent_buys?: readonly {
    readonly who: string;
    readonly amount: string;
    readonly date: string;
    readonly source: string;
    readonly url: string;
  }[];
  readonly recent_sells?: readonly {
    readonly who: string;
    readonly amount: string;
    readonly date: string;
    readonly source: string;
    readonly url: string;
  }[];
  readonly token_unlocks_next_90d?: string;
  readonly vesting_schedule?: string;
  readonly insider_sentiment?: "accumulating" | "neutral" | "distributing";
}

/** Team profile and background. */
export interface TeamProfile {
  readonly key_members?: readonly {
    readonly name: string;
    readonly role: string;
    readonly background: string;
    readonly linkedin?: string;
    readonly twitter?: string;
    readonly notable: string;
  }[];
  readonly team_size?: string;
  readonly anon_team?: boolean;
  readonly team_track_record?: string;
  readonly advisors?: readonly string[];
}

/** Token supply and economic structure. */
export interface Tokenomics {
  readonly total_supply?: string;
  readonly circulating_supply?: string;
  readonly circulating_pct?: string;
  readonly inflation_rate?: string;
  readonly burn_mechanism?: string;
  readonly staking_yield?: string;
  readonly fdv?: string;
  readonly mcap_to_fdv_ratio?: string;
  readonly next_unlock_date?: string;
  readonly next_unlock_amount?: string;
  readonly treasury_size?: string;
  readonly treasury_runway?: string;
}

/** Competitive landscape and market positioning. */
export interface CompetitivePosition {
  readonly competitors?: readonly {
    readonly name: string;
    readonly ticker?: string;
    readonly mcap?: string;
    readonly comparison: string;
  }[];
  readonly moat?: string;
  readonly market_size?: string;
  readonly current_penetration?: string;
}

/** Core opportunity data model. */
export interface Opportunity {
  readonly slug: string;
  readonly name: string;
  readonly ticker: string | null;
  readonly category: string;
  readonly asset_class: AssetClass;
  readonly tier: Tier;
  readonly composite_score: number;
  readonly one_liner: string;
  readonly thesis: string;
  readonly signals: Signals;
  readonly catalysts: readonly string[];
  readonly risks: readonly string[];
  readonly related_slugs: readonly string[];
  readonly updated_at: string;
  readonly is_graveyard: boolean;
  readonly citations: readonly Citation[];
  readonly current_price_usd: number | null;
  readonly market_cap_usd: number | null;
  readonly volume_24h_usd: number | null;

  // Deep data dimensions (populated incrementally by enrichment pipeline)
  readonly on_chain?: OnChainMetrics | null;
  readonly insider_activity?: InsiderActivity | null;
  readonly team?: TeamProfile | null;
  readonly tokenomics?: Tokenomics | null;
  readonly competitive?: CompetitivePosition | null;

  // Quick-glance metrics (populated by enrichment scripts)
  readonly fdv?: string | null;
  readonly circulating_pct?: string | null;
  readonly tvl?: string | null;
  readonly fees_30d?: string | null;
  readonly holders?: string | null;
  readonly github_stars?: string | null;
  readonly github_contributors?: string | null;
  readonly last_github_commit?: string | null;
  readonly google_trends_interest?: string | null;

  // Analysis and verdict (populated for deep-dive opportunities)
  readonly free_access?: boolean;
  readonly verdict?: string | null;
  readonly red_flags?: readonly string[] | null;
  readonly conviction_signals?: readonly string[] | null;
  readonly edge_data?: readonly string[] | null;
  readonly thesis_changers?: {
    readonly bull_breaks_if: string;
    readonly bear_breaks_if: string;
  } | null;
}

/** Blog post data model. */
export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly content: string;
  readonly published_at: string;
  readonly author: string;
  readonly tags: readonly string[];
}

/** Signal label mapping for display purposes. */
export const SIGNAL_LABELS: Record<keyof Signals, string> = {
  working_code: "Working Code",
  dev_activity: "Dev Activity",
  smart_money: "Smart Money",
  community: "Community",
  catalyst: "Catalyst",
  narrative: "Narrative",
  valuation_gap: "Valuation Gap",
  obscurity: "Obscurity",
} as const;

/** All signal keys in display order. */
export const SIGNAL_KEYS: readonly (keyof Signals)[] = [
  "working_code",
  "dev_activity",
  "smart_money",
  "community",
  "catalyst",
  "narrative",
  "valuation_gap",
  "obscurity",
] as const;
