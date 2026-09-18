// Investment growth model for the Crypto Investment Calculator.
//
// Pure functions only. Given an initial investment, optional recurring
// contributions over a number of periods, a start price, an end price, and a
// fee percent, the model derives units accumulated, average cost, ending
// value, return on investment, and a CAGR when a holding window in years is
// supplied. Every scenario shares the same contribution schedule and differs
// only in the final price.

export const SCENARIO_MULTIPLIERS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface InvestmentInput {
  readonly initial: number;
  readonly recurring: number;
  readonly periods: number;
  readonly startPrice: number;
  readonly endPrice: number;
  readonly feePercent: number;
  readonly years?: number;
}

export interface ScenarioRow {
  readonly multiplier: number;
  readonly endPrice: number;
  readonly endingValue: number;
  readonly roiPercent: number;
}

export interface InvestmentResult {
  readonly totalInvested: number;
  readonly units: number;
  readonly averageCost: number;
  readonly endingValue: number;
  readonly gain: number;
  readonly roiPercent: number;
  readonly cagrPercent: number | null;
  readonly feeCostDollars: number;
  readonly scenarios: readonly ScenarioRow[];
}

function safe(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

// Dollars spent on a single buy turn into units after the fee is taken. The
// fee reduces units, not the cash you record as invested.
export function unitsForCash(cash: number, price: number, feePercent: number): number {
  const money = safe(cash);
  const rate = safe(feePercent) / 100;
  const unitPrice = safe(price);
  if (money === 0 || unitPrice === 0) return 0;
  return (money * (1 - rate)) / unitPrice;
}

function runWithFee(input: InvestmentInput, feePercent: number, years: number, withScenarios: boolean): InvestmentResult {
  const initial = safe(input.initial);
  const recurring = safe(input.recurring);
  const periods = Math.max(0, Math.floor(safe(input.periods)));
  const startPrice = safe(input.startPrice);
  const endPrice = safe(input.endPrice);
  const totalInvested = initial + recurring * periods;

  let units = 0;
  if (startPrice > 0) units += unitsForCash(initial, startPrice, feePercent);
  if (periods > 0 && recurring > 0 && startPrice > 0) {
    for (let index = 1; index <= periods; index += 1) {
      const price = startPrice + ((endPrice - startPrice) * index) / periods;
      if (price > 0) units += unitsForCash(recurring, price, feePercent);
    }
  }

  const endingValue = units * endPrice;
  const gain = endingValue - totalInvested;
  const roiPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const averageCost = units > 0 ? totalInvested / units : 0;

  let cagrPercent: number | null = null;
  if (years > 0 && totalInvested > 0 && endingValue > 0) {
    cagrPercent = (Math.pow(endingValue / totalInvested, 1 / years) - 1) * 100;
  }

  let scenarios: readonly ScenarioRow[] = [];
  if (withScenarios) {
    scenarios = SCENARIO_MULTIPLIERS.map((multiplier) => {
      const scenarioEnd = startPrice * multiplier;
      const run = runWithFee({ ...input, endPrice: scenarioEnd }, feePercent, 0, false);
      return {
        multiplier,
        endPrice: scenarioEnd,
        endingValue: run.endingValue,
        roiPercent: run.roiPercent,
      } as ScenarioRow;
    });
  }

  return {
    totalInvested,
    units,
    averageCost,
    endingValue,
    gain,
    roiPercent,
    cagrPercent,
    feeCostDollars: 0,
    scenarios,
  };
}

export function calculateInvestment(input: InvestmentInput): InvestmentResult {
  const feePercent = safe(input.feePercent);
  const years = Math.max(0, safe(input.years ?? 0));
  const base = runWithFee(input, feePercent, years, true);
  const baseline = runWithFee(input, 0, 0, false);
  return { ...base, feeCostDollars: baseline.endingValue - base.endingValue };
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}%`;
}

export function formatHumanDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function investmentTitle(): string {
  return "Crypto investment calculator with recurring buys";
}

export function investmentIntro(initial: number, recurring: number, periods: number): string {
  return [
    `Set an initial stake of ${formatUsd(initial)} and add ${formatUsd(recurring)} each period.`,
    `The model walks ${periods} buys from a start price to an end price and reports what your holding is worth.`,
    "It also shows what a flat fee costs you against a no fee baseline.",
  ].join(" ");
}

export function investmentExample(): string {
  return [
    "Say you start with $5,000 and add $500 every month for 12 months.",
    "Bitcoin opens at $60,000 and finishes at $90,000.",
    "You accumulate units across a rising path, so later buys grab fewer units.",
    "The average cost lands below the final price, and your position is worth more than the cash you put in.",
    "The fee line shows how much those $5 trades quietly shave off the outcome.",
  ].join(" ");
}

export function investmentDisclosure(): string {
  return [
    "This model is a teaching aid, not a promise of returns.",
    "Prices move in jumps and gap around exchange outages, so a straight line from start to end is a simplification.",
    "Crypto is volatile and can lose most of its value.",
    "The numbers ignore taxes, slippage, and custody risk.",
    "Run the tool to compare fee levels before you put real money in.",
  ].join(" ");
}
