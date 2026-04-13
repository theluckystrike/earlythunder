/** Signal scores for the 8-signal pattern filter. Each value 0-100. */
export interface Signals {
  readonly toy_phase: number;
  readonly working_code: number;
  readonly community: number;
  readonly dev_activity: number;
  readonly smart_money: number;
  readonly narrative: number;
  readonly hard_to_buy: number;
  readonly catalyst: number;
}

/** Asset class categories for opportunity classification. */
export type AssetClass =
  | "digital_assets"
  | "public_equities"
  | "private_markets";

/** Tier ranking: 1 = highest conviction, 3 = speculative. */
export type Tier = 1 | 2 | 3;

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
  toy_phase: "Toy Phase",
  working_code: "Working Code",
  community: "Community",
  dev_activity: "Dev Activity",
  smart_money: "Smart Money",
  narrative: "Narrative",
  hard_to_buy: "Hard to Buy",
  catalyst: "Catalyst",
} as const;

/** All signal keys in display order. */
export const SIGNAL_KEYS: readonly (keyof Signals)[] = [
  "toy_phase",
  "working_code",
  "community",
  "dev_activity",
  "smart_money",
  "narrative",
  "hard_to_buy",
  "catalyst",
] as const;
