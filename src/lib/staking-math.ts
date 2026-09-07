/**
 * Pure staking math for the crypto staking calculator.
 *
 * Nothing in this module reads the network, the clock or the file system.
 * Every exported function validates its own arguments at its boundary and
 * checks every value it returns for finiteness, so a caller can never render
 * NaN or Infinity from anything produced here. Overflow is reported as a
 * thrown RangeError rather than as a silent Infinity.
 */

export const MAX_RATE_PERCENT = 1_000;
export const MAX_TERM_YEARS = 50;
export const MIN_PERIODS_PER_YEAR = 1;
export const MAX_PERIODS_PER_YEAR = 365;
export const MAX_AMOUNT_TOKENS = 1_000_000_000_000;
export const MAX_PRICE_USD = 1_000_000_000;

/** Highest compounding step count the model will evaluate. */
const MAX_COMPOUNDING_STEPS = MAX_TERM_YEARS * MAX_PERIODS_PER_YEAR;

/** Compounding frequencies offered by the interface, smallest first. */
export const COMPOUNDING_CHOICES = [
  { periodsPerYear: 1, label: "Annually" },
  { periodsPerYear: 4, label: "Quarterly" },
  { periodsPerYear: 12, label: "Monthly" },
  { periodsPerYear: 52, label: "Weekly" },
  { periodsPerYear: 365, label: "Daily" },
] as const;

/**
 * One staking pool from the build time DeFiLlama snapshot, joined to the live
 * market universe and to the dated first party scorecard. Every field that
 * could not be sourced is null and is rendered as an explicit missing state.
 */
export interface StakingPoolOption {
  /** DeFiLlama pool identifier, used only as a stable key. */
  readonly id: string;
  readonly project: string;
  readonly chain: string;
  /** Ticker of the staked position, for example STETH. */
  readonly symbol: string;
  readonly tvlUsd: number;
  readonly apy: number;
  readonly apyBase: number | null;
  readonly apyReward: number | null;
  readonly apyMean30d: number | null;
  /** Underlying asset ticker resolved by the stated mapping, else null. */
  readonly baseSymbol: string | null;
  readonly baseName: string | null;
  readonly basePriceUsd: number | null;
  readonly circulatingSupply: number | null;
  readonly totalSupply: number | null;
  /** Share of total supply not yet circulating, in percent, else null. */
  readonly overhangPercent: number | null;
  readonly score: number | null;
  readonly verdict: string | null;
  readonly stakingYieldScore: number | null;
  readonly supplyInflationScore: number | null;
}

/** Rating scale of the dated research file, measured from the file itself. */
export interface ScorecardScale {
  readonly variables: number;
  readonly subScoreMax: number;
  readonly compositeMax: number;
}

export interface StakingInput {
  /** Tokens staked, denominated in the underlying asset. */
  readonly amountTokens: number;
  /** Nominal annual rate in percent, before compounding is applied. */
  readonly apyPercent: number;
  readonly termYears: number;
  readonly periodsPerYear: number;
  /** Annual supply issuance of the staked asset in percent. */
  readonly issuancePercent: number;
  /** Spot price of the underlying asset, or null when none was sourced. */
  readonly priceUsd: number | null;
}

export interface StakingResult {
  readonly periodicRatePercent: number;
  readonly compoundingSteps: number;
  readonly growthMultiple: number;
  readonly endingTokens: number;
  readonly rewardTokens: number;
  /** Annual yield after the chosen compounding frequency, in percent. */
  readonly effectiveAnnualPercent: number;
  /** Effective annual yield net of issuance, in percent. */
  readonly realYieldPercent: number;
  /** Ending balance restated as a constant share of supply. */
  readonly realEndingTokens: number;
  /** Change in the staker's share of total supply over the term, in percent. */
  readonly supplyShareChangePercent: number;
  /** Issuance rate at which the nominal yield nets to zero, in percent. */
  readonly breakEvenIssuancePercent: number;
  readonly startingValueUsd: number | null;
  readonly endingValueUsd: number | null;
  readonly realEndingValueUsd: number | null;
}

function requireRange(value: number, minimum: number, maximum: number, label: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
  if (value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function requireFiniteResult(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} exceeded the range this calculator can represent.`);
  }
  return value;
}

/** Rate applied at each compounding step, in percent. */
export function periodicRatePercent(apyPercent: number, periodsPerYear: number): number {
  requireRange(apyPercent, 0, MAX_RATE_PERCENT, "Annual rate");
  requireRange(periodsPerYear, MIN_PERIODS_PER_YEAR, MAX_PERIODS_PER_YEAR, "Compounding periods");
  if (!Number.isInteger(periodsPerYear)) throw new RangeError("Compounding periods must be a whole number.");
  return requireFiniteResult(apyPercent / periodsPerYear, "Periodic rate");
}

/**
 * Growth multiple of a staked balance over the term.
 * multiple = (1 + rate / periods) ^ (periods * years)
 */
export function compoundMultiple(apyPercent: number, termYears: number, periodsPerYear: number): number {
  requireRange(termYears, 0, MAX_TERM_YEARS, "Term");
  const perStep = periodicRatePercent(apyPercent, periodsPerYear) / 100;
  if (perStep < 0) throw new RangeError("Periodic rate cannot be negative.");
  const steps = periodsPerYear * termYears;
  if (steps < 0 || steps > MAX_COMPOUNDING_STEPS) {
    throw new RangeError("Compounding step count is out of bounds.");
  }
  return requireFiniteResult(Math.pow(1 + perStep, steps), "Growth multiple");
}

/**
 * Annual yield actually earned once the nominal rate compounds n times a year.
 * At one period a year this returns the entered rate unchanged, which is what
 * makes a provider quoted APY reproduce exactly.
 */
export function effectiveAnnualPercent(apyPercent: number, periodsPerYear: number): number {
  const perStep = periodicRatePercent(apyPercent, periodsPerYear) / 100;
  if (perStep < 0) throw new RangeError("Periodic rate cannot be negative.");
  const grown = Math.pow(1 + perStep, periodsPerYear);
  return requireFiniteResult((grown - 1) * 100, "Effective annual rate");
}

/**
 * Yield net of supply issuance, in percent.
 * real = ((1 + yield) / (1 + issuance) - 1) * 100
 *
 * A staking reward paid in the staked token only raises the holder's share of
 * supply when it outruns the rate at which new supply is minted.
 */
export function realYieldPercent(nominalPercent: number, issuancePercent: number): number {
  requireRange(nominalPercent, -100, MAX_RATE_PERCENT, "Nominal yield");
  requireRange(issuancePercent, 0, MAX_RATE_PERCENT, "Issuance rate");
  const denominator = 1 + issuancePercent / 100;
  if (denominator <= 0) throw new RangeError("Issuance rate would divide by zero.");
  const real = (1 + nominalPercent / 100) / denominator - 1;
  return requireFiniteResult(real * 100, "Real yield");
}

/**
 * Issuance rate at which the nominal yield nets to exactly zero. Setting the
 * real yield to zero gives issuance equal to the effective annual yield, which
 * is the compounded figure and not the rate the reader typed.
 */
export function breakEvenIssuancePercent(apyPercent: number, periodsPerYear: number): number {
  const effective = effectiveAnnualPercent(apyPercent, periodsPerYear);
  if (effective < 0) throw new RangeError("Effective annual rate cannot be negative.");
  return requireFiniteResult(effective, "Break even issuance");
}

function usdValue(tokens: number, priceUsd: number | null, label: string): number | null {
  if (priceUsd === null) return null;
  requireRange(priceUsd, 0, MAX_PRICE_USD, "Price");
  return requireFiniteResult(tokens * priceUsd, label);
}

function validateInput(input: StakingInput): void {
  if (!input || typeof input !== "object") throw new TypeError("Staking input is required.");
  requireRange(input.amountTokens, 0, MAX_AMOUNT_TOKENS, "Amount staked");
  requireRange(input.apyPercent, 0, MAX_RATE_PERCENT, "Annual rate");
  requireRange(input.termYears, 0, MAX_TERM_YEARS, "Term");
  requireRange(input.periodsPerYear, MIN_PERIODS_PER_YEAR, MAX_PERIODS_PER_YEAR, "Compounding periods");
  requireRange(input.issuancePercent, 0, MAX_RATE_PERCENT, "Issuance rate");
  if (input.priceUsd !== null) requireRange(input.priceUsd, 0, MAX_PRICE_USD, "Price");
}

/**
 * Full staking result in token terms, in USD terms at the supplied price, and
 * in supply share terms after issuance. Throws rather than returning a value
 * the interface would have to print as Infinity.
 */
export function calculateStaking(input: StakingInput): StakingResult {
  validateInput(input);
  const multiple = compoundMultiple(input.apyPercent, input.termYears, input.periodsPerYear);
  const endingTokens = requireFiniteResult(input.amountTokens * multiple, "Ending balance");
  const effective = effectiveAnnualPercent(input.apyPercent, input.periodsPerYear);
  const real = realYieldPercent(effective, input.issuancePercent);
  const realMultiple = requireFiniteResult(
    Math.pow(1 + real / 100, input.termYears),
    "Supply share multiple",
  );
  const realEndingTokens = requireFiniteResult(input.amountTokens * realMultiple, "Supply share balance");
  const result: StakingResult = {
    periodicRatePercent: periodicRatePercent(input.apyPercent, input.periodsPerYear),
    compoundingSteps: input.periodsPerYear * input.termYears,
    growthMultiple: multiple,
    endingTokens,
    rewardTokens: requireFiniteResult(endingTokens - input.amountTokens, "Reward tokens"),
    effectiveAnnualPercent: effective,
    realYieldPercent: real,
    realEndingTokens,
    supplyShareChangePercent: requireFiniteResult((realMultiple - 1) * 100, "Supply share change"),
    breakEvenIssuancePercent: breakEvenIssuancePercent(input.apyPercent, input.periodsPerYear),
    startingValueUsd: usdValue(input.amountTokens, input.priceUsd, "Starting value"),
    endingValueUsd: usdValue(endingTokens, input.priceUsd, "Ending value"),
    realEndingValueUsd: usdValue(realEndingTokens, input.priceUsd, "Supply share value"),
  };
  if (result.endingTokens < 0) throw new RangeError("Ending balance cannot be negative.");
  if (result.growthMultiple < 1) throw new RangeError("Growth multiple cannot fall below one.");
  return result;
}
