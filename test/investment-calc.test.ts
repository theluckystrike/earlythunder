import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateInvestment,
  formatHumanDate,
  formatPercent,
  formatUsd,
  investmentDisclosure,
  investmentExample,
  investmentIntro,
  investmentTitle,
  unitsForCash,
} from "../src/lib/investment-calc";

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

// Hand-checked fixture. $5,000 initial + $500 * 12 months, start $60k, end $90k, fee 0%.
// Total invested 11,000. Recurring buy j at price 60k + (30k * j) / 12.
function baseRun(feePercent = 0) {
  return calculateInvestment({ initial: 5000, recurring: 500, periods: 12, startPrice: 60000, endPrice: 90000, feePercent });
}

test("unitsForCash takes the fee from units, not from cash", () => {
  near(unitsForCash(5000, 60000, 1), (5000 * 0.99) / 60000);
  near(unitsForCash(5000, 60000, 0), 5000 / 60000);
  near(unitsForCash(5000, 60000, 0), 1 / 12);
});

test("total invested equals initial plus recurring times periods", () => {
  const result = baseRun();
  near(result.totalInvested, 11000);
});

test("recurring buys walk a straight price path from start to end", () => {
  // Buy 12 at prices 62.5k, 65k, ... 90k. Sum of 1/price scaled by 500.
  let units = 5000 / 60000;
  for (let j = 1; j <= 12; j += 1) {
    const price = 60000 + ((90000 - 60000) * j) / 12;
    units += 500 / price;
  }
  near(baseRun().units, units);
});

test("ending value is units times the end price", () => {
  const result = baseRun();
  near(result.endingValue, result.units * 90000);
});

test("average cost is total invested divided by units", () => {
  const result = baseRun();
  near(result.averageCost, result.totalInvested / result.units);
});

test("ROI percent matches the dollar gain over invested cash", () => {
  const result = baseRun();
  const expected = ((result.endingValue - 11000) / 11000) * 100;
  near(result.roiPercent, expected);
  near(result.gain, result.endingValue - 11000);
});

test("CAGR is reported when a holding window in years is supplied", () => {
  const result = calculateInvestment({ initial: 10000, recurring: 0, periods: 0, startPrice: 100, endPrice: 200, feePercent: 0, years: 5 });
  const cagr = result.cagrPercent;
  assert.ok(cagr !== null, "CAGR must be present");
  near(cagr, (Math.pow(2, 1 / 5) - 1) * 100);
});

test("CAGR is null when no holding window is given", () => {
  const result = baseRun();
  assert.equal(result.cagrPercent, null);
});

test("zero recurring contribution yields units only from the initial stake", () => {
  const result = calculateInvestment({ initial: 1000, recurring: 0, periods: 24, startPrice: 100, endPrice: 200, feePercent: 0 });
  near(result.totalInvested, 1000);
  near(result.units, 10);
  near(result.endingValue, 2000);
  near(result.roiPercent, 100);
});

test("zero initial stake is allowed when recurring carries the plan", () => {
  const result = calculateInvestment({ initial: 0, recurring: 100, periods: 5, startPrice: 100, endPrice: 100, feePercent: 0 });
  near(result.totalInvested, 500);
  near(result.units, 5);
  near(result.endingValue, 500);
});

test("zero fee has zero fee cost and matches a hand-built plan", () => {
  const result = baseRun(0);
  near(result.feeCostDollars, 0);
});

test("a positive fee always costs dollars against the zero fee baseline", () => {
  for (const fee of [0.1, 0.5, 1, 2.5]) {
    const result = baseRun(fee);
    assert.ok(result.feeCostDollars > 0, `fee ${fee}% must cost dollars, got ${result.feeCostDollars}`);
    assert.ok(result.units < baseRun(0).units);
  }
});

test("scenario table covers the six requested swings off the start price", () => {
  const result = baseRun();
  const multipliers = result.scenarios.map((row) => row.multiplier);
  assert.deepEqual(multipliers, [0.5, 0.75, 1, 1.25, 1.5, 2]);
  const scenario = result.scenarios.find((row) => row.multiplier === 2);
  assert.ok(scenario);
  near(scenario.endPrice, 120000);
  assert.ok(scenario.endingValue > result.endingValue);
});

test("scenario ending value matches a fresh run at the same swing price", () => {
  const result = baseRun();
  for (const row of result.scenarios) {
    const fresh = calculateInvestment({ initial: 5000, recurring: 500, periods: 12, startPrice: 60000, endPrice: row.endPrice, feePercent: 0 });
    near(row.endingValue, fresh.endingValue);
    near(row.roiPercent, fresh.roiPercent);
  }
});

test("negative swing scenarios report losses on the same schedule", () => {
  const result = baseRun();
  const half = result.scenarios[0];
  assert.equal(half.multiplier, 0.5);
  assert.ok(half.roiPercent < 0, "halving the end price must show a negative ROI");
});

test("copy generators return non-empty humanized strings without artifacts", () => {
  const intro = investmentIntro(5000, 500, 12);
  for (const s of [investmentTitle(), intro, investmentExample(), investmentDisclosure()]) {
    assert.ok(typeof s === "string" && s.length > 0);
    assert.ok(!s.includes("undefined"), `leaked undefined: ${s}`);
    assert.ok(!s.includes("NaN"));
    assert.ok(!s.includes("—"), `em dash leaked: ${s}`);
  }
  assert.ok(intro.includes("$5,000.00"));
  assert.ok(intro.includes("$500.00"));
  assert.ok(investmentTitle().toLowerCase().includes("recurring buys"));
});

test("formatHumanDate renders a month day year label", () => {
  assert.equal(formatHumanDate(new Date(2026, 8, 18)), "September 18, 2026");
});

test("formatUsd keeps two decimals and formatPercent rounds to two", () => {
  assert.equal(formatUsd(1713.96), "$1,713.96");
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatPercent(123.456), "123.46%");
});

test("bad inputs degrade safely to zero", () => {
  const result = calculateInvestment({ initial: -5, recurring: -1, periods: -3, startPrice: 0, endPrice: 0, feePercent: -1 });
  near(result.totalInvested, 0);
  near(result.units, 0);
  near(result.endingValue, 0);
  near(result.roiPercent, 0);
  near(result.feeCostDollars, 0);
});
