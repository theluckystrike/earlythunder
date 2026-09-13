import assert from "node:assert/strict";
import test from "node:test";
import { bounded, calculateApy, calculateAveragePrice, calculateDca, calculateFees, calculatePositionSize, MAX_MONEY } from "../src/lib/planning-calculators";

test("calculates DCA units along a bounded path", () => {
  const result = calculateDca({ contribution: 100, periods: 2, startPrice: 10, endPrice: 20, feePercent: 0 });
  assert.equal(result.invested, 200);
  assert.equal(result.units, 15);
  assert.equal(result.value, 300);
  assert.equal(result.average, 200 / 15);
});

test("calculates a fee-aware weighted average", () => {
  const result = calculateAveragePrice({ firstUnits: 1.25, firstPrice: 42000, secondUnits: 0.75, secondPrice: 58000, feePercent: 0.2 });
  assert.equal(result.totalUnits, 2);
  assert.equal(result.grossCost, 96000);
  assert.equal(result.totalCost, 96087);
  assert.equal(result.average, 48043.5);
});

test("adds explicit, spread, and fixed costs", () => {
  const result = calculateFees({ amount: 10000, buyFeePercent: 0.4, sellFeePercent: 0.4, spreadPercent: 0.15, fixedCost: 8 });
  assert.ok(Math.abs(result.total - 103.41365461847389) < 1e-9);
  assert.ok(result.rate !== null && Math.abs(result.rate - 1.0341365461847389) < 1e-9);
  assert.equal(calculateFees({ amount: 0, buyFeePercent: 0.4, sellFeePercent: 0.4, spreadPercent: 0.15, fixedCost: 8 }).rate, null);
});

test("converts APR and discounts token inflation", () => {
  const result = calculateApy({ principal: 10000, aprPercent: 12, compoundsPerYear: 365, years: 2, inflationPercent: 4 });
  assert.ok(result.apy > 12.74 && result.apy < 12.76);
  assert.ok(result.ending > 12700 && result.ending < 12720);
  assert.ok(result.realEnding < result.ending);
  assert.ok(Number.isFinite(calculateApy({ principal: 1e12, aprPercent: 1e9, compoundsPerYear: 1e9, years: 1e9, inflationPercent: 0 }).ending));
});

test("sizes a position from fee-aware stop risk", () => {
  const result = calculatePositionSize({ account: 25000, riskPercent: 1, entryPrice: 100, stopPrice: 92, feePercent: 0.2 });
  assert.equal(result.riskBudget, 250);
  assert.ok(Math.abs(result.riskPerUnit - 8.384) < 1e-10);
  assert.ok(result.units > 29.81 && result.units < 29.83);
  const cashCapped = calculatePositionSize({ account: 25000, riskPercent: 1, entryPrice: 100, stopPrice: 100, feePercent: 0.2 });
  assert.ok(cashCapped.notional < 25000);
  assert.ok(Math.abs(cashCapped.cashRequired - 25000) < 1e-9);
  assert.ok(cashCapped.allocation < 100);
});

test("bounds invalid and hostile inputs", () => {
  assert.equal(bounded(-1, 100), 0);
  assert.equal(bounded(Number.NaN, 100), 0);
  assert.equal(bounded(Number.POSITIVE_INFINITY, 100), 0);
  assert.equal(bounded(MAX_MONEY * 2, MAX_MONEY), MAX_MONEY);
  const dca = calculateDca({ contribution: 10, periods: 0, startPrice: 0, endPrice: 0, feePercent: 1000 });
  assert.equal(dca.count, 0);
  assert.equal(dca.invested, 0);
  assert.equal(dca.units, 0);
  assert.equal(dca.average, 0);
});

test("locks the five published worked examples", () => {
  const dca = calculateDca({ contribution: 250, periods: 24, startPrice: 50000, endPrice: 80000, feePercent: 0.25 });
  assert.equal(dca.invested, 6000);
  assert.ok(Math.abs(dca.average - 63885.674235932165) < 1e-8);
  const average = calculateAveragePrice({ firstUnits: 1.25, firstPrice: 42000, secondUnits: 0.75, secondPrice: 58000, feePercent: 0.2 });
  assert.equal(average.totalCost, 96087);
  assert.equal(average.average, 48043.5);
  const fees = calculateFees({ amount: 10000, buyFeePercent: 0.4, sellFeePercent: 0.4, spreadPercent: 0.15, fixedCost: 8 });
  assert.ok(Math.abs((fees.rate ?? 0) - 1.0341365461847389) < 1e-9);
  const apy = calculateApy({ principal: 10000, aprPercent: 12, compoundsPerYear: 365, years: 2, inflationPercent: 4 });
  assert.ok(Math.abs(apy.ending - 12711.990089089582) < 1e-8);
  const position = calculatePositionSize({ account: 25000, riskPercent: 1, entryPrice: 100, stopPrice: 92, feePercent: 0.2 });
  assert.ok(Math.abs(position.notional - 2981.870229007634) < 1e-9);
});
