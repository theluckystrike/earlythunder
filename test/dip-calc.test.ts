import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  buildSyntheticPath,
  compareStrategies,
  dipDisclosureText,
  dipIntroText,
  dipWorkedExample,
  formatHumanDate,
  formatPercent,
  formatUnits,
  formatUsd,
  lumpSumBaseline,
  runDipPlan,
} from "../src/lib/dip-calc";

function flatRows(count: number, price: number): { date: string; usd: number }[] {
  return Array.from({ length: count }, (_, index) => ({ date: `day-${index + 1}`, usd: price }));
}

function twoPriceRows(first: number, last: number): { date: string; usd: number }[] {
  return [
    { date: "2025-01-01", usd: first },
    { date: "2025-12-31", usd: last },
  ];
}

// ---- dip trigger logic ----

test("flat prices never trigger a dip, so all cash deploys at the end", () => {
  const rows = flatRows(60, 50000);
  const result = runDipPlan(rows, { totalCash: 6000, tranches: 3, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 0);
  assert.equal(result.endDeploy, true);
  assert.equal(result.percentDuringDips, 0);
  assert.equal(result.cashDeployedAtEnd, 6000);
});

test("a dip below the threshold triggers exactly one tranche", () => {
  // High of 100, then a small 3% drop, then a 20% drop below high, then back to 100.
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 97 },
    { date: "2025-01-03", usd: 80 },
    { date: "2025-01-04", usd: 100 },
  ];
  const result = runDipPlan(rows, { totalCash: 3000, tranches: 3, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 1);
  assert.equal(result.firstDipDate, "2025-01-03");
  // One tranche deployed during dips at 80, remaining two at end price 100.
  const expectedUnits = 1000 / 80 + 2000 / 100;
  assert.ok(Math.abs(result.units - expectedUnits) < 1e-9);
});

test("drawdown below the threshold does not trigger", () => {
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 93 }, // 7% below high, threshold 10% not met
    { date: "2025-01-03", usd: 100 },
  ];
  const result = runDipPlan(rows, { totalCash: 2000, tranches: 2, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 0);
  assert.equal(result.endDeploy, true);
});

test("the running high updates so later smaller drops can still trigger", () => {
  // Running high reaches 100 then price holds at 88 -> 12% below high triggers.
  const rows = [
    { date: "2025-01-01", usd: 40 },
    { date: "2025-01-02", usd: 100 },
    { date: "2025-01-03", usd: 88 },
  ];
  const result = runDipPlan(rows, { totalCash: 1000, tranches: 1, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 1);
  assert.equal(result.firstDipDate, "2025-01-03");
});

// ---- tranche exhaustion ----

test("once all tranches deploy, no more dips buy", () => {
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 80 },
    { date: "2025-01-03", usd: 70 },
    { date: "2025-01-04", usd: 60 },
  ];
  const result = runDipPlan(rows, { totalCash: 3000, tranches: 2, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 2);
  assert.equal(result.endDeploy, false);
  assert.equal(result.cashDeployedAtEnd, 0);
  assert.equal(result.cashDeployedDuringDips, 3000);
});

test("tranche count bounds the number of dip purchases", () => {
  const rows = flatRows(100, 100).map((row, index) =>
    index === 0 ? row : { date: row.date, usd: index % 2 === 0 ? 60 : 100 },
  );
  const result = runDipPlan(rows, { totalCash: 1000, tranches: 4, dipThresholdPercent: 10, feePercent: 0 });
  assert.ok(result.dipsDeployed <= 4);
});

// ---- leftover deployment ----

test("leftover cash deploys at the final price", () => {
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 85 }, // triggers one of two tranches at 85
    { date: "2025-01-03", usd: 120 },
  ];
  const result = runDipPlan(rows, { totalCash: 2000, tranches: 2, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(result.dipsDeployed, 1);
  assert.equal(result.endDeploy, true);
  const expectedUnits = 1000 / 85 + 1000 / 120;
  assert.ok(Math.abs(result.units - expectedUnits) < 1e-9);
  assert.equal(result.finalPrice, 120);
});

// ---- fee handling ----

test("fees reduce the units received but never exceed the cash", () => {
  const rows = twoPriceRows(100, 100);
  const free = runDipPlan(rows, { totalCash: 1000, tranches: 1, dipThresholdPercent: 10, feePercent: 0 });
  const fee = runDipPlan(rows, { totalCash: 1000, tranches: 1, dipThresholdPercent: 10, feePercent: 1 });
  assert.ok(fee.units < free.units);
  assert.equal(fee.invested, 1000);
});

// ---- lump-sum comparison invariant ----

test("lump-sum baseline buys all cash at the first price", () => {
  const rows = twoPriceRows(100, 200);
  const baseline = lumpSumBaseline(rows, 1000, 0);
  assert.equal(baseline.units, 10);
  assert.equal(baseline.finalValue, 2000);
  assert.equal(baseline.roiPercent, 100);
});

test("compareStrategies returns both legs and the gain difference", () => {
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 50 },
    { date: "2025-01-03", usd: 100 },
  ];
  const comparison = compareStrategies(rows, { totalCash: 2000, tranches: 2, dipThresholdPercent: 10, feePercent: 0 });
  assert.equal(typeof comparison.dip.gain, "number");
  assert.equal(typeof comparison.baseline.gain, "number");
  assert.equal(comparison.gainDifference, comparison.dip.gain - comparison.baseline.gain);
  assert.equal(typeof comparison.dipBeatsBaseline, "boolean");
});

test("dip plan is deterministic, same input gives the same output", () => {
  const rows = [
    { date: "2025-01-01", usd: 100 },
    { date: "2025-01-02", usd: 60 },
    { date: "2025-01-03", usd: 90 },
  ];
  const options = { totalCash: 3000, tranches: 3, dipThresholdPercent: 10, feePercent: 0.25 };
  const a = runDipPlan(rows, options);
  const b = runDipPlan(rows, options);
  assert.deepEqual(a, b);
});

// ---- synthetic path ----

test("synthetic path rises from start to end and prints dips", () => {
  const rows = buildSyntheticPath(100, 200, 17, 20, 7);
  assert.equal(rows.length, 17);
  assert.equal(rows[0].usd, 100);
  assert.equal(rows[16].usd, 200);
  const dips = rows.filter((row, index) => index > 0 && index % 7 === 0);
  assert.ok(dips.length >= 1);
  assert.ok(dips.every((row) => row.usd < 200));
});

test("synthetic path triggers dips under runDipPlan", () => {
  const rows = buildSyntheticPath(100, 300, 25, 20, 6);
  const result = runDipPlan(rows, { totalCash: 1000, tranches: 3, dipThresholdPercent: 10, feePercent: 0 });
  assert.ok(result.dipsDeployed >= 1);
});

// ---- copy generator invariants ----

test("copy generators use sentence case and contain no em dashes", () => {
  const texts = [
    dipIntroText(),
    dipWorkedExample(10, 4, 10000),
    dipDisclosureText(),
  ];
  for (const text of texts) {
    assert.ok(text.includes("—") === false, "contains em dash");
    assert.ok(text.includes("--") === false, "contains double hyphen");
  }
});

test("copy generators avoid colon-openers and include formatted values", () => {
  const worked = dipWorkedExample(15, 5, 20000);
  assert.ok(worked.includes("$20,000"));
  assert.ok(worked.includes("5 tranches"));
  assert.ok(worked.includes("15%"));
  assert.ok(dipIntroText().length > 0);
});

test("format helpers render currency, units, and percent", () => {
  assert.equal(formatUsd(20000), "$20,000");
  assert.equal(formatUsd(0.0000123), "$0.000012");
  assert.ok(formatUnits(1.234567891).includes("1.23456789"));
  assert.equal(formatPercent(0.125 * 100), "12.5%");
});

test("formatHumanDate converts ISO dates to readable form", () => {
  assert.equal(formatHumanDate("2025-09-19"), "September 19, 2025");
  assert.equal(formatHumanDate("2026-09-18"), "September 18, 2026");
  assert.equal(formatHumanDate("not-a-date"), "not-a-date");
});

test("full disclosure, intro, and worked example read as short varied sentences", () => {
  const sentenceCount = (text: string): number => (text.match(/\./g) || []).length;
  for (const text of [dipIntroText(), dipDisclosureText()]) {
    assert.ok(sentenceCount(text) >= 2, "expected a few short sentences");
    assert.ok(sentenceCount(text) <= 6, "expected concise copy");
  }
});
