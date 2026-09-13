export const MAX_PERIODS = 1200;
export const MAX_MONEY = 1_000_000_000_000;
export const MAX_PERCENT = 10_000;

export function bounded(raw: string | number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
}

export function calculateDca(input: { contribution: number; periods: number; startPrice: number; endPrice: number; feePercent: number }) {
  const amount = bounded(input.contribution, MAX_MONEY);
  const count = Math.max(1, Math.floor(bounded(input.periods, MAX_PERIODS)));
  const first = bounded(input.startPrice, MAX_MONEY);
  const last = bounded(input.endPrice, MAX_MONEY);
  const feeRate = bounded(input.feePercent, 100) / 100;
  let units = 0;
  for (let index = 0; index < count; index += 1) {
    const price = count === 1 ? first : first + ((last - first) * index) / (count - 1);
    if (price > 0) units += (amount * (1 - feeRate)) / price;
  }
  const invested = amount * count;
  const value = units * last;
  return { count, units, invested, value, gain: value - invested, average: units > 0 ? invested / units : 0 };
}

export function calculateAveragePrice(input: { firstUnits: number; firstPrice: number; secondUnits: number; secondPrice: number; feePercent: number }) {
  const unitsOne = bounded(input.firstUnits, MAX_MONEY);
  const unitsTwo = bounded(input.secondUnits, MAX_MONEY);
  const costOne = unitsOne * bounded(input.firstPrice, MAX_MONEY);
  const costTwo = unitsTwo * bounded(input.secondPrice, MAX_MONEY);
  const feeRate = bounded(input.feePercent, 100) / 100;
  const totalUnits = unitsOne + unitsTwo;
  const grossCost = costOne + costTwo;
  const totalCost = grossCost * (1 + feeRate);
  return { totalUnits, grossCost, fees: totalCost - grossCost, totalCost, average: totalUnits > 0 ? totalCost / totalUnits : 0 };
}

export function calculateFees(input: { amount: number; buyFeePercent: number; sellFeePercent: number; spreadPercent: number; fixedCost: number }) {
  const notional = bounded(input.amount, MAX_MONEY);
  const buy = notional * bounded(input.buyFeePercent, 100) / 100;
  const sell = notional * bounded(input.sellFeePercent, 100) / 100;
  const spreadCost = notional * bounded(input.spreadPercent, 100) / 100;
  const networkCost = bounded(input.fixedCost, MAX_MONEY);
  const total = buy + sell + spreadCost + networkCost;
  return { buy, sell, spreadCost, networkCost, total, rate: notional > 0 ? total / notional * 100 : 0 };
}

export function calculateApy(input: { principal: number; aprPercent: number; compoundsPerYear: number; years: number; inflationPercent: number }) {
  const start = bounded(input.principal, MAX_MONEY);
  const rate = bounded(input.aprPercent, MAX_PERCENT) / 100;
  const frequency = Math.max(1, Math.floor(bounded(input.compoundsPerYear, MAX_PERIODS)));
  const duration = bounded(input.years, 100);
  const inflationRate = bounded(input.inflationPercent, 100) / 100;
  const apy = (Math.pow(1 + rate / frequency, frequency) - 1) * 100;
  const ending = start * Math.pow(1 + rate / frequency, frequency * duration);
  const realEnding = ending / Math.pow(1 + inflationRate, duration);
  return { apy, ending, earned: ending - start, realEnding, realEarned: realEnding - start };
}

export function calculatePositionSize(input: { account: number; riskPercent: number; entryPrice: number; stopPrice: number; feePercent: number }) {
  const balance = bounded(input.account, MAX_MONEY);
  const riskBudget = balance * bounded(input.riskPercent, 100) / 100;
  const entryPrice = bounded(input.entryPrice, MAX_MONEY);
  const stopPrice = bounded(input.stopPrice, MAX_MONEY);
  const feeRate = bounded(input.feePercent, 100) / 100;
  const riskPerUnit = Math.abs(entryPrice - stopPrice) + entryPrice * feeRate + stopPrice * feeRate;
  const units = riskPerUnit > 0 ? riskBudget / riskPerUnit : 0;
  const notional = units * entryPrice;
  return { riskBudget, riskPerUnit, units, notional, allocation: balance > 0 ? notional / balance * 100 : 0, stopDistance: entryPrice > 0 ? Math.abs(entryPrice - stopPrice) / entryPrice * 100 : 0 };
}
