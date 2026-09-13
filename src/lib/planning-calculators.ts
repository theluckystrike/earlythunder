export const MAX_PERIODS = 1200;
export const MAX_MONEY = 1_000_000_000_000;
export const MAX_PERCENT = 10_000;
export const MAX_APR_PERCENT = 1_000;
export const MAX_YEARS = 50;
export const MAX_FEE_PERCENT = 99.99;

export function bounded(raw: string | number, max: number): number {
  const parsed = Number(raw);
  if (Number.isFinite(parsed) === false || parsed < 0) return 0;
  return Math.min(parsed, max);
}

export function calculateDca(input: { contribution: number; periods: number; startPrice: number; endPrice: number; feePercent: number }) {
  const amount = bounded(input.contribution, MAX_MONEY);
  const count = Math.floor(bounded(input.periods, MAX_PERIODS));
  const first = bounded(input.startPrice, MAX_MONEY);
  const last = bounded(input.endPrice, MAX_MONEY);
  const feeRate = bounded(input.feePercent, MAX_FEE_PERCENT) / 100;
  let units = 0;
  if (count === 0) return { count: 0, units: 0, invested: 0, value: 0, gain: 0, average: 0 };
  if (first <= 0 || last <= 0) return { count, units: 0, invested: 0, value: 0, gain: 0, average: 0 };
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
  const feeRate = bounded(input.feePercent, MAX_FEE_PERCENT) / 100;
  const totalUnits = unitsOne + unitsTwo;
  const grossCost = costOne + costTwo;
  const fees = costTwo * feeRate;
  const totalCost = grossCost + fees;
  return { totalUnits, grossCost, fees, totalCost, average: totalUnits > 0 ? totalCost / totalUnits : 0 };
}

export function calculateFees(input: { amount: number; buyFeePercent: number; sellFeePercent: number; spreadPercent: number; fixedCost: number }) {
  const notional = bounded(input.amount, MAX_MONEY);
  const buyRate = bounded(input.buyFeePercent, MAX_FEE_PERCENT) / 100;
  const sellRate = bounded(input.sellFeePercent, MAX_FEE_PERCENT) / 100;
  const buy = notional * buyRate;
  const spreadCost = notional * bounded(input.spreadPercent, 100) / 100;
  const networkCost = bounded(input.fixedCost, MAX_MONEY);
  const breakEvenExit = notional > 0 ? (notional + buy + spreadCost + networkCost) / (1 - sellRate) : 0;
  const sell = breakEvenExit * sellRate;
  const total = buy + sell + spreadCost + networkCost;
  return { buy, sell, spreadCost, networkCost, total, rate: notional > 0 ? (breakEvenExit / notional - 1) * 100 : null };
}

export function calculateApy(input: { principal: number; aprPercent: number; compoundsPerYear: number; years: number; inflationPercent: number }) {
  const start = bounded(input.principal, MAX_MONEY);
  const rate = bounded(input.aprPercent, MAX_APR_PERCENT) / 100;
  const frequency = Math.max(1, Math.floor(bounded(input.compoundsPerYear, MAX_PERIODS)));
  const duration = bounded(input.years, MAX_YEARS);
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
  const feeRate = bounded(input.feePercent, MAX_FEE_PERCENT) / 100;
  const riskPerUnit = Math.abs(entryPrice - stopPrice) + entryPrice * feeRate + stopPrice * feeRate;
  const riskSizedUnits = riskPerUnit > 0 ? riskBudget / riskPerUnit : 0;
  const cashSizedUnits = entryPrice > 0 ? balance / (entryPrice * (1 + feeRate)) : 0;
  const units = Math.min(riskSizedUnits, cashSizedUnits);
  const notional = units * entryPrice;
  const entryFee = notional * feeRate;
  const cashRequired = notional + entryFee;
  return { riskBudget, riskPerUnit, units, notional, entryFee, cashRequired, allocation: balance > 0 ? notional / balance * 100 : 0, stopDistance: entryPrice > 0 ? Math.abs(entryPrice - stopPrice) / entryPrice * 100 : 0 };
}
