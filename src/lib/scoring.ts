import type { Signals } from "./types";

/** Signal weight configuration. Quality signals (75%) + Asymmetry signals (25%). */
export const SIGNAL_WEIGHTS: Readonly<Record<keyof Signals, number>> = {
  working_code: 0.20,
  dev_activity: 0.15,
  smart_money: 0.10,
  community: 0.10,
  catalyst: 0.15,
  narrative: 0.05,
  valuation_gap: 0.15,
  obscurity: 0.10,
} as const;

/** Quality signal keys (75% total weight). */
export const QUALITY_SIGNALS: readonly (keyof Signals)[] = [
  "working_code", "dev_activity", "smart_money", "community", "catalyst", "narrative",
] as const;

/** Asymmetry signal keys (25% total weight). */
export const ASYMMETRY_SIGNALS: readonly (keyof Signals)[] = [
  "valuation_gap", "obscurity",
] as const;

/** Calculate composite score from signal values. Returns 0-100. */
export function calculateComposite(signals: Signals): number {
  if (!signals || typeof signals !== "object") return 0;

  let total = 0;
  for (const [key, weight] of Object.entries(SIGNAL_WEIGHTS)) {
    const value = signals[key as keyof Signals];
    const clamped = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;
    total += clamped * weight;
  }

  return Math.round(total * 10) / 10;
}

/** Derive tier from composite score. */
export function deriveTier(score: number): 1 | 2 | 3 {
  if (score >= 75) return 1;
  if (score >= 55) return 2;
  return 3;
}

/** Valuation gap scoring based on market cap in USD. */
export function scoreValuationGap(marketCapUsd: number | null, isPreToken: boolean): number {
  if (marketCapUsd === null || marketCapUsd <= 0) {
    return isPreToken ? 90 : 75;
  }
  if (marketCapUsd < 5e6) return 97;
  if (marketCapUsd < 25e6) return 85;
  if (marketCapUsd < 100e6) return 72;
  if (marketCapUsd < 500e6) return 55;
  if (marketCapUsd < 2e9) return 35;
  if (marketCapUsd < 10e9) return 18;
  if (marketCapUsd < 50e9) return 7;
  return 2;
}

/** Obscurity scoring guide. Higher = fewer people know about it. */
export function scoreObscurity(marketCapUsd: number | null, isWellKnown: boolean): number {
  if (isWellKnown) return 25;
  if (marketCapUsd === null || marketCapUsd <= 0) return 80;
  if (marketCapUsd < 5e6) return 90;
  if (marketCapUsd < 25e6) return 80;
  if (marketCapUsd < 100e6) return 65;
  if (marketCapUsd < 500e6) return 50;
  if (marketCapUsd < 2e9) return 35;
  if (marketCapUsd < 10e9) return 20;
  if (marketCapUsd < 50e9) return 10;
  return 5;
}
