/**
 * Constant product impermanent loss math.
 *
 * Every function here is pure, bounded and total. A value that cannot be
 * computed inside finite bounds is returned as null so that no caller can ever
 * render NaN or Infinity. A price change of exactly minus 100 percent drives a
 * price factor to zero, which makes the ratio undefined, so that case returns
 * null rather than an infinity.
 *
 * The model is a two asset constant product pool with equal starting weights.
 * It is not concentrated liquidity, it carries no trading fees unless a caller
 * adds them, and it ignores gas and reward emissions.
 */

export const IL_WINDOWS = ["24h", "7d", "30d", "200d", "1y"] as const;

export type IlWindow = (typeof IL_WINDOWS)[number];

export const WINDOW_DAYS: Readonly<Record<IlWindow, number>> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "200d": 200,
  "1y": 365,
};

export const WINDOW_LABELS: Readonly<Record<IlWindow, string>> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  "200d": "200 days",
  "1y": "1 year",
};

export interface PositionOutcome {
  /** Starting position value in USD, split evenly across the two assets. */
  readonly startValue: number;
  /** Value of simply holding the two starting balances. */
  readonly holdValue: number;
  /** Value of the constant product LP position, fees excluded. */
  readonly lpValue: number;
  /** LP value divided by hold value, minus one. Zero or negative. */
  readonly ilFraction: number;
  /** LP value minus hold value, in USD. Zero or negative. */
  readonly lpMinusHoldUsd: number;
  /** Total return of the hold, as a fraction of the starting value. */
  readonly holdReturnFraction: number;
  /** Total return of the LP position, as a fraction of the starting value. */
  readonly lpReturnFraction: number;
  /** Price of asset A relative to asset B, rebased to the window start. */
  readonly priceRatio: number;
}

const DAYS_PER_YEAR = 365;
const MIN_CHANGE_PERCENT = -100;
const MAX_CHANGE_PERCENT = 1_000_000;
const MAX_POSITION_USD = 1_000_000_000_000;
const MAX_APY_PERCENT = 100_000;
const MAX_BREAK_EVEN_DAYS = 1_000_000;

/**
 * Converts a percentage price change into a multiplicative price factor.
 * Returns null when the factor is not strictly positive, which is what a minus
 * 100 percent change produces.
 */
export function priceFactor(changePercent: number): number | null {
  if (typeof changePercent !== "number" || !Number.isFinite(changePercent)) return null;
  if (changePercent < MIN_CHANGE_PERCENT || changePercent > MAX_CHANGE_PERCENT) return null;
  const factor = 1 + changePercent / 100;
  if (!Number.isFinite(factor) || factor <= 0) return null;
  return factor;
}

/**
 * Price ratio implied by two percentage changes over the same window. This is
 * the r that the textbook formula takes, derived from real moves rather than a
 * number the reader invents.
 */
export function ratioFromChanges(changeAPercent: number, changeBPercent: number): number | null {
  const factorA = priceFactor(changeAPercent);
  const factorB = priceFactor(changeBPercent);
  if (factorA === null || factorB === null) return null;
  if (factorB <= 0) return null;
  const ratio = factorA / factorB;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  return ratio;
}

/**
 * The constant product impermanent loss for a price ratio r, defined as
 * 2 times the square root of r, divided by 1 plus r, minus 1. The result is
 * always zero or negative and never below minus 1.
 */
export function impermanentLossFromRatio(ratio: number): number | null {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) return null;
  if (ratio <= 0) return null;
  const root = Math.sqrt(ratio);
  if (!Number.isFinite(root) || root <= 0) return null;
  const denominator = 1 + ratio;
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const loss = (2 * root) / denominator - 1;
  if (!Number.isFinite(loss)) return null;
  if (loss > 0) return 0;
  if (loss <= -1) return null;
  return loss;
}

/** Impermanent loss implied by two real percentage changes over one window. */
export function impermanentLossFromChanges(changeAPercent: number, changeBPercent: number): number | null {
  const ratio = ratioFromChanges(changeAPercent, changeBPercent);
  if (ratio === null) return null;
  return impermanentLossFromRatio(ratio);
}

/**
 * Full LP against hold comparison for a position of a given size, split evenly
 * across the two assets at the start of the window.
 */
export function positionOutcome(
  positionUsd: number,
  changeAPercent: number,
  changeBPercent: number,
): PositionOutcome | null {
  if (typeof positionUsd !== "number" || !Number.isFinite(positionUsd)) return null;
  if (positionUsd <= 0 || positionUsd > MAX_POSITION_USD) return null;
  const factorA = priceFactor(changeAPercent);
  const factorB = priceFactor(changeBPercent);
  if (factorA === null || factorB === null) return null;
  const ratio = factorA / factorB;
  const ilFraction = impermanentLossFromRatio(ratio);
  if (ilFraction === null) return null;
  const holdValue = (positionUsd * (factorA + factorB)) / 2;
  const product = factorA * factorB;
  if (!Number.isFinite(product) || product <= 0) return null;
  const lpValue = positionUsd * Math.sqrt(product);
  if (!Number.isFinite(holdValue) || !Number.isFinite(lpValue)) return null;
  if (holdValue <= 0 || lpValue <= 0) return null;
  return {
    startValue: positionUsd,
    holdValue,
    lpValue,
    ilFraction,
    lpMinusHoldUsd: lpValue - holdValue,
    holdReturnFraction: holdValue / positionUsd - 1,
    lpReturnFraction: lpValue / positionUsd - 1,
    priceRatio: ratio,
  };
}

/**
 * Fee yield earned over a number of days at a stated APY, accrued pro rata with
 * no compounding. Expressed as a fraction of the position value.
 */
export function feeYieldOverDays(apyPercent: number, days: number): number | null {
  if (typeof apyPercent !== "number" || !Number.isFinite(apyPercent)) return null;
  if (typeof days !== "number" || !Number.isFinite(days)) return null;
  if (apyPercent < 0 || apyPercent > MAX_APY_PERCENT) return null;
  if (days < 0 || days > MAX_BREAK_EVEN_DAYS) return null;
  const yieldFraction = (apyPercent / 100) * (days / DAYS_PER_YEAR);
  if (!Number.isFinite(yieldFraction)) return null;
  return yieldFraction;
}

/**
 * Days of fee accrual at a stated APY needed to offset a measured impermanent
 * loss. Returns null when the APY is zero or negative, because no holding
 * period offsets the loss in that case.
 */
export function feeBreakEvenDays(ilFraction: number, apyPercent: number): number | null {
  if (typeof ilFraction !== "number" || !Number.isFinite(ilFraction)) return null;
  if (typeof apyPercent !== "number" || !Number.isFinite(apyPercent)) return null;
  if (ilFraction > 0 || ilFraction <= -1) return null;
  if (apyPercent > MAX_APY_PERCENT) return null;
  const loss = -ilFraction;
  if (loss === 0) return 0;
  if (apyPercent <= 0) return null;
  const dailyRate = apyPercent / 100 / DAYS_PER_YEAR;
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) return null;
  const days = loss / dailyRate;
  if (!Number.isFinite(days) || days < 0) return null;
  if (days > MAX_BREAK_EVEN_DAYS) return null;
  return days;
}
