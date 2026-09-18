import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFeeDragTable,
  comparisonSummary,
  datasetDisclosure,
  formatUsd,
  runDcaPlan,
  runLumpSumPlan,
  unitsForCash,
  type PriceDataset,
} from "../src/lib/dca-backtest";

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

// Hand-computed 4-row fixture. Prices: 100, 200, 300, 400.
const ROWS = [
  { date: "2026-01-01", usd: 100 },
  { date: "2026-01-02", usd: 200 },
  { date: "2026-01-03", usd: 300 },
  { date: "2026-01-04", usd: 400 },
] as const;

test("unitsForCash applies the fee to units, not to cash", () => {
  // $100 at $100 with 1% fee -> 100 * 0.99 / 100 = 0.99 units, full $100 counted as cash.
  near(unitsForCash(100, 100, 1), 0.99);
  near(unitsForCash(100, 100, 0), 1);
});

test("weekly DCA on 4 rows buys on the first row only", () => {
  const plan = runDcaPlan(ROWS, { contribution: 100, frequencyDays: 7, feePercent: 0 });
  assert.equal(plan.contributions, 1);
  assert.equal(plan.cash, 100);
  near(plan.units, 1); // 100 / 100
  near(plan.finalValue, 400); // 1 unit * 400
  near(plan.gain, 300);
  near(plan.roiPercent, 300);
  near(plan.averageCost, 100);
});

test("daily DCA with a 1% fee matches hand arithmetic", () => {
  // 100 cash each day, fee 1% -> units = 100*0.99/price
  // 0.99 + 0.495 + 0.33 + 0.2475 = 2.0625 units, cash 400, final price 400.
  const plan = runDcaPlan(ROWS, { contribution: 100, frequencyDays: 1, feePercent: 1 });
  assert.equal(plan.contributions, 4);
  assert.equal(plan.cash, 400);
  near(plan.units, 0.99 + 0.495 + 0.33 + 0.2475);
  near(plan.finalValue, 2.0625 * 400);
  near(plan.gain, 2.0625 * 400 - 400);
  near(plan.roiPercent, ((2.0625 * 400 - 400) / 400) * 100);
});

test("every other day DCA buys rows 0 and 2", () => {
  const plan = runDcaPlan(ROWS, { contribution: 100, frequencyDays: 2, feePercent: 0 });
  assert.equal(plan.contributions, 2);
  assert.equal(plan.cash, 200);
  near(plan.units, 1 + 100 / 300);
  near(plan.finalValue, (1 + 100 / 300) * 400);
});

test("lump sum reuses the same cash with exactly one fee", () => {
  const plan = runLumpSumPlan(ROWS, { cash: 400, feePercent: 1 });
  assert.equal(plan.buyDate, "2026-01-01");
  assert.equal(plan.buyPrice, 100);
  near(plan.units, 400 * 0.99 / 100); // 3.96
  near(plan.finalValue, 3.96 * 400); // 1584
  near(plan.gain, 1584 - 400);
  near(plan.roiPercent, 296);
});

test("field reports the single-fee lump sum accurately", () => {
  const plan = runLumpSumPlan(ROWS, { cash: 400, feePercent: 1 });
  // 400 * 0.99 / 100 = 3.96 units, exactly.
  near(plan.units, 3.96);
});

test("dca and lump sum on the same cash differ by real dollars", () => {
  const dca = runDcaPlan(ROWS, { contribution: 100, frequencyDays: 1, feePercent: 1 });
  const lump = runLumpSumPlan(ROWS, { cash: dca.cash, feePercent: 1 });
  assert.equal(dca.cash, lump.cash);
  // DCA spreads the entry and owns fewer units here than a single $400 buy at row 0.
  assert.ok(dca.units < lump.units);
  assert.ok(typeof comparisonSummary(dca, lump) === "string");
  assert.ok(!comparisonSummary(dca, lump).includes("undefined"));
});

test("fee drag is a positive dollar loss measured against the fee-less plan", () => {
  const table = buildFeeDragTable(ROWS, { contribution: 100, frequencyDays: 1, feePercents: [0, 0.25, 1, 2.5] });
  assert.equal(table.length, 4);
  // 0% baseline: daily buys of $100 at 100/200/300/400 = 0.99? No — fee-less, so
  // 1 + 0.5 + 0.333... + 0.25 = 2.083333... units, * 400 final price.
  const baselineUnits = 1 + 0.5 + 100 / 300 + 0.25;
  near(table[0].units, baselineUnits);
  near(table[0].finalValue, baselineUnits * 400);
  assert.equal(table[0].feeCostDollars, 0);
  for (const row of table.slice(1)) {
    assert.ok(row.feeCostDollars > 0, `fee ${row.feePercent}% must lose dollars, got ${row.feeCostDollars}`);
    assert.ok(row.units < table[0].units);
  }
  // 1% fee: units 2.0625 -> 825 value; loss = 833.333... - 825 = 8.333...
  const onePercent = table.find((row) => row.feePercent === 1);
  assert.ok(onePercent);
  near(onePercent.units, 2.0625);
  near(onePercent.finalValue, 825);
  near(onePercent.feeCostDollars, baselineUnits * 400 - 825);
  // 2.5% fee: units = 0.975*(1 + 0.5 + 1/3 + 0.25) = 0.975 * 2.083333... ; loss vs baseline.
  const twoAndHalf = table.find((row) => row.feePercent === 2.5);
  assert.ok(twoAndHalf);
  near(twoAndHalf.units, 0.975 * baselineUnits);
  near(twoAndHalf.feeCostDollars, (1 - 0.975) * baselineUnits * 400);
});

test("disclosure strings are always defined and name the dropped day", () => {
  const dataset = {
    id: "fixture", title: "fixture", fetched_at: "2026-09-18T00:00:00.000Z",
    window: { days: 365, start: ROWS[0].date, end: ROWS[3].date },
    primary: { name: "CoinGecko", url: "https://example.com/cg" },
    cross_check: { name: "Kraken", url: "https://example.com/kr", tolerance_percent: 1 },
    rows: ROWS, dropped: [{ date: "2026-02-23", reason: "cross-check disagreement 3.71%" }],
    counts: { window: 365, published: 4, dropped: 1 },
  } as unknown as PriceDataset;
  const lines = datasetDisclosure(dataset);
  assert.ok(lines.length >= 3);
  for (const line of lines) {
    assert.ok(typeof line === "string" && line.length > 0);
    assert.ok(!line.includes("undefined"), `line leaked undefined: ${line}`);
    assert.ok(!line.includes("NaN"));
  }
  assert.ok(lines[0].includes("4 of 365"));
  assert.ok(lines.some((line) => line.includes("2026-02-23")));
});

test("disclosure reports a clean window when nothing is dropped", () => {
  const dataset = {
    id: "f", title: "f", fetched_at: "2026-09-18T00:00:00.000Z",
    window: { days: 4, start: ROWS[0].date, end: ROWS[3].date },
    primary: { name: "CoinGecko", url: "u" },
    cross_check: { name: "Kraken", url: "u", tolerance_percent: 1 },
    rows: ROWS, dropped: [], counts: { window: 4, published: 4, dropped: 0 },
  } as unknown as PriceDataset;
  const lines = datasetDisclosure(dataset);
  assert.ok(lines.some((line) => line.includes("No readings were dropped")));
});

test("fee drag never reports a zero loss for a non-zero fee", () => {
  for (const feePercent of [0.25, 1, 2.5]) {
    const table = buildFeeDragTable(ROWS, { contribution: 100, frequencyDays: 1, feePercents: [0, feePercent] });
    assert.ok(table[1].feeCostDollars > 0);
  }
});

test("fee drag baseline does not depend on the 0% row being present or first", () => {
  const withoutZero = buildFeeDragTable(ROWS, { contribution: 100, frequencyDays: 1, feePercents: [1, 2.5] });
  // Identical values to running with 0% present: the baseline is computed internally.
  near(withoutZero[0].finalValue, 825);
  near(withoutZero[0].feeCostDollars, (1 + 0.5 + 100 / 300 + 0.25) * 400 - 825);
  const zeroLast = buildFeeDragTable(ROWS, { contribution: 100, frequencyDays: 1, feePercents: [1, 0] });
  assert.equal(zeroLast[1].feeCostDollars, 0);
  near(zeroLast[0].feeCostDollars, (1 + 0.5 + 100 / 300 + 0.25) * 400 - 825);
});

test("formatUsd keeps two decimals so small drags stay visible", () => {
  assert.equal(formatUsd(75.731), "$75.73");
  assert.equal(formatUsd(1600), "$1,600.00");
  assert.equal(formatUsd(0), "$0.00");
});

test("empty dataset degrades safely", () => {
  const plan = runDcaPlan([], { contribution: 100, feePercent: 1 });
  assert.equal(plan.cash, 0);
  assert.equal(plan.units, 0);
  assert.equal(runLumpSumPlan([], { cash: 100, feePercent: 1 }).finalValue, 0);
});
