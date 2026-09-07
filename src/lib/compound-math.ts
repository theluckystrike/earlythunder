/**
 * Compound growth math for a staking position held in tokens.
 *
 * The position has two legs that move independently. The token balance grows
 * at the periodic rate. The dollar value is that balance multiplied by a price
 * the reader assumes. Every function here is pure, bounded, and returns null
 * rather than NaN or Infinity when an input or an intermediate value leaves
 * its declared range.
 */

export const MAX_YEARS = 50;
export const MIN_YEARS = 0.25;
export const MAX_RATE_PERCENT = 1000;
export const MIN_PERIODS_PER_YEAR = 1;
export const MAX_PERIODS_PER_YEAR = 365;
export const MAX_TOKENS = 1e15;
export const MAX_PRICE_USD = 1e9;
export const MIN_PRICE_CHANGE_PERCENT = -99;
export const MAX_PRICE_CHANGE_PERCENT = 1000;

const MAX_PERIODS = MAX_YEARS * MAX_PERIODS_PER_YEAR;
const MAX_TABLE_ROWS = MAX_YEARS + 1;

export interface CompoundInput {
  /** Opening token balance, in token units, not dollars. */
  readonly startTokens: number;
  /** Tokens added at the end of every compounding period. */
  readonly contributionTokens: number;
  /** Nominal annual rate in percent, compounded periodsPerYear times a year. */
  readonly ratePercent: number;
  /** Compounding periods a year, from 1 to 365. */
  readonly periodsPerYear: number;
  /** Holding period in years, from 0.25 to 50. */
  readonly years: number;
  /** Token price in dollars at the start of the projection. */
  readonly priceUsd: number;
  /** Assumed annual price change in percent, from -99 to 1000. */
  readonly annualPriceChangePercent: number;
}

export interface CompoundYearRow {
  /** Elapsed years at the end of this row. */
  readonly elapsedYears: number;
  readonly tokens: number;
  readonly contributedTokens: number;
  readonly interestTokens: number;
  readonly priceUsd: number;
  readonly valueUsd: number;
}

export interface CompoundResult {
  readonly periods: number;
  readonly ratePerPeriod: number;
  /** Effective annual rate as a fraction, so 0.05 means 5 percent. */
  readonly effectiveAnnualRate: number;
  readonly finalTokens: number;
  readonly contributedTokens: number;
  readonly interestTokens: number;
  readonly finalPriceUsd: number;
  readonly finalValueUsd: number;
  /** Dollar value if the price never moves from the entry price. */
  readonly flatPriceValueUsd: number;
  /** Contributed tokens valued at the entry price. */
  readonly contributedValueUsd: number;
  /** Annual price change, as a fraction, that leaves the dollar value equal to the contributed dollars. */
  readonly breakEvenAnnualPriceChange: number | null;
  /** Annual price change, as a fraction, that exactly cancels the compounding rate. */
  readonly yieldCancellingPriceChange: number | null;
  readonly rows: readonly CompoundYearRow[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function inRange(value: number, minimum: number, maximum: number): boolean {
  if (!isFiniteNumber(value)) return false;
  return value >= minimum && value <= maximum;
}

/** Exponentiation with a guarded base and a finite check on the result. */
export function safePower(base: number, exponent: number): number | null {
  if (!isFiniteNumber(base) || !isFiniteNumber(exponent)) return null;
  if (base <= 0) return null;
  if (!inRange(exponent, 0, MAX_PERIODS)) return null;
  const value = Math.pow(base, exponent);
  return Number.isFinite(value) ? value : null;
}

/** Division that refuses a zero, tiny or non finite denominator. */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator)) return null;
  if (Math.abs(denominator) < Number.EPSILON) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

/**
 * Effective annual rate produced by a nominal rate compounded n times a year.
 * A rate quoted as APY is already effective, so passing 1 period a year is the
 * correct choice for a quoted APY and anything higher double counts.
 */
export function effectiveAnnualRate(ratePercent: number, periodsPerYear: number): number | null {
  if (!inRange(ratePercent, 0, MAX_RATE_PERCENT)) return null;
  if (!inRange(periodsPerYear, MIN_PERIODS_PER_YEAR, MAX_PERIODS_PER_YEAR)) return null;
  const perPeriod = safeDivide(ratePercent / 100, periodsPerYear);
  if (perPeriod === null) return null;
  const growth = safePower(1 + perPeriod, periodsPerYear);
  if (growth === null) return null;
  const rate = growth - 1;
  return Number.isFinite(rate) ? rate : null;
}

/**
 * Token balance after a whole number of compounding periods, with a fixed
 * contribution added at the end of each period.
 */
export function compoundBalance(
  startTokens: number,
  contributionTokens: number,
  ratePerPeriod: number,
  periods: number,
): number | null {
  if (!inRange(startTokens, 0, MAX_TOKENS)) return null;
  if (!inRange(contributionTokens, 0, MAX_TOKENS)) return null;
  if (!inRange(ratePerPeriod, 0, MAX_RATE_PERCENT)) return null;
  if (!inRange(periods, 0, MAX_PERIODS)) return null;
  if (!Number.isInteger(periods)) return null;
  if (ratePerPeriod === 0) {
    const flat = startTokens + contributionTokens * periods;
    return Number.isFinite(flat) && flat <= MAX_TOKENS ? flat : null;
  }
  const growth = safePower(1 + ratePerPeriod, periods);
  if (growth === null) return null;
  const annuity = safeDivide(contributionTokens * (growth - 1), ratePerPeriod);
  if (annuity === null) return null;
  const balance = startTokens * growth + annuity;
  if (!Number.isFinite(balance) || balance < 0 || balance > MAX_TOKENS) return null;
  return balance;
}

/**
 * The annual price change that leaves the ending dollar value equal to the
 * dollars put in, valued at the entry price. With no contribution this reduces
 * to the price decline that exactly cancels the compounding rate.
 */
export function breakEvenAnnualPriceChange(
  finalTokens: number,
  contributedTokens: number,
  years: number,
): number | null {
  if (!inRange(finalTokens, Number.EPSILON, MAX_TOKENS)) return null;
  if (!inRange(contributedTokens, Number.EPSILON, MAX_TOKENS)) return null;
  if (!inRange(years, MIN_YEARS, MAX_YEARS)) return null;
  const ratio = safeDivide(contributedTokens, finalTokens);
  if (ratio === null || ratio <= 0) return null;
  const exponent = safeDivide(1, years);
  if (exponent === null) return null;
  const factor = safePower(ratio, exponent);
  if (factor === null) return null;
  const change = factor - 1;
  return Number.isFinite(change) ? change : null;
}

/** The annual price change that exactly cancels a given effective annual rate. */
export function yieldCancellingPriceChange(ratePercent: number, periodsPerYear: number): number | null {
  const effective = effectiveAnnualRate(ratePercent, periodsPerYear);
  if (effective === null) return null;
  const factor = safeDivide(1, 1 + effective);
  if (factor === null) return null;
  const change = factor - 1;
  return Number.isFinite(change) ? change : null;
}

function validateInput(input: CompoundInput): boolean {
  if (!input || typeof input !== "object") return false;
  if (!inRange(input.startTokens, 0, MAX_TOKENS)) return false;
  if (!inRange(input.contributionTokens, 0, MAX_TOKENS)) return false;
  if (!inRange(input.ratePercent, 0, MAX_RATE_PERCENT)) return false;
  if (!inRange(input.periodsPerYear, MIN_PERIODS_PER_YEAR, MAX_PERIODS_PER_YEAR)) return false;
  if (!Number.isInteger(input.periodsPerYear)) return false;
  if (!inRange(input.years, MIN_YEARS, MAX_YEARS)) return false;
  if (!inRange(input.priceUsd, Number.EPSILON, MAX_PRICE_USD)) return false;
  if (!inRange(input.annualPriceChangePercent, MIN_PRICE_CHANGE_PERCENT, MAX_PRICE_CHANGE_PERCENT)) return false;
  if (input.startTokens === 0 && input.contributionTokens === 0) return false;
  return true;
}

function priceAt(input: CompoundInput, elapsedYears: number): number | null {
  if (!inRange(elapsedYears, 0, MAX_YEARS)) return null;
  const factor = safePower(1 + input.annualPriceChangePercent / 100, elapsedYears);
  if (factor === null) return null;
  const price = input.priceUsd * factor;
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function buildRow(input: CompoundInput, elapsedYears: number): CompoundYearRow | null {
  const perPeriod = safeDivide(input.ratePercent / 100, input.periodsPerYear);
  if (perPeriod === null) return null;
  const periods = Math.floor(input.periodsPerYear * elapsedYears);
  if (!inRange(periods, 0, MAX_PERIODS)) return null;
  const tokens = compoundBalance(input.startTokens, input.contributionTokens, perPeriod, periods);
  if (tokens === null) return null;
  const contributed = input.startTokens + input.contributionTokens * periods;
  if (!Number.isFinite(contributed) || contributed > MAX_TOKENS) return null;
  const price = priceAt(input, elapsedYears);
  if (price === null) return null;
  const value = tokens * price;
  if (!Number.isFinite(value)) return null;
  return {
    elapsedYears,
    tokens,
    contributedTokens: contributed,
    interestTokens: tokens - contributed,
    priceUsd: price,
    valueUsd: value,
  };
}

function buildRows(input: CompoundInput): readonly CompoundYearRow[] | null {
  const rows: CompoundYearRow[] = [];
  const wholeYears = Math.floor(input.years);
  for (let year = 1; year <= wholeYears; year += 1) {
    if (rows.length >= MAX_TABLE_ROWS) break;
    const row = buildRow(input, year);
    if (row === null) return null;
    rows.push(row);
  }
  if (input.years > wholeYears && rows.length < MAX_TABLE_ROWS) {
    const row = buildRow(input, input.years);
    if (row === null) return null;
    rows.push(row);
  }
  return rows.length > 0 ? rows : null;
}

/**
 * Projects a staking position. Returns null when any input is out of range or
 * any intermediate value stops being finite, so a caller never renders NaN.
 */
export function projectCompound(input: CompoundInput): CompoundResult | null {
  if (!validateInput(input)) return null;
  const perPeriod = safeDivide(input.ratePercent / 100, input.periodsPerYear);
  if (perPeriod === null) return null;
  const periods = Math.floor(input.periodsPerYear * input.years);
  if (!inRange(periods, 0, MAX_PERIODS)) return null;
  const effective = effectiveAnnualRate(input.ratePercent, input.periodsPerYear);
  if (effective === null) return null;
  const finalTokens = compoundBalance(input.startTokens, input.contributionTokens, perPeriod, periods);
  if (finalTokens === null) return null;
  const contributedTokens = input.startTokens + input.contributionTokens * periods;
  if (!Number.isFinite(contributedTokens) || contributedTokens > MAX_TOKENS) return null;
  const finalPrice = priceAt(input, input.years);
  if (finalPrice === null) return null;
  const rows = buildRows(input);
  if (rows === null) return null;
  const finalValue = finalTokens * finalPrice;
  const flatValue = finalTokens * input.priceUsd;
  const contributedValue = contributedTokens * input.priceUsd;
  if (!Number.isFinite(finalValue) || !Number.isFinite(flatValue) || !Number.isFinite(contributedValue)) return null;
  return {
    periods,
    ratePerPeriod: perPeriod,
    effectiveAnnualRate: effective,
    finalTokens,
    contributedTokens,
    interestTokens: finalTokens - contributedTokens,
    finalPriceUsd: finalPrice,
    finalValueUsd: finalValue,
    flatPriceValueUsd: flatValue,
    contributedValueUsd: contributedValue,
    breakEvenAnnualPriceChange: breakEvenAnnualPriceChange(finalTokens, contributedTokens, input.years),
    yieldCancellingPriceChange: yieldCancellingPriceChange(input.ratePercent, input.periodsPerYear),
    rows,
  };
}
