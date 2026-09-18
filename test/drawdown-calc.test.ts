import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  analyzeDrawdown,
  bounded,
  drawdownDisclosureText,
  drawdownIntroText,
  drawdownPercent,
  drawdownWorkedExample,
  formatMultiple,
  formatPercent,
  formatUsd,
  indexCrashExampleText,
  recoveryGainPercent,
  recoveryMathNote,
  recoveryMultiple,
  recoveryTable,
} from "../src/lib/drawdown-calc";

function close(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Math.abs(actual - expected) < tolerance, `expected ${expected}, got ${actual}`);
}

// ---- known-input math ----

test("a 100k peak with a 50k trough is a 50% drawdown", () => {
  assert.equal(drawdownPercent(100000, 50000), 50);
});

test("a 50% drawdown needs a 100% recovery gain", () => {
  close(recoveryGainPercent(50), 100);
});

test("a 50% drawdown is a 2x recovery multiple", () => {
  close(recoveryMultiple(50), 2);
});

test("a 100k peak with a 25k trough is a 75% drawdown and a 300% gain", () => {
  assert.equal(drawdownPercent(100000, 25000), 75);
  close(recoveryGainPercent(75), 300);
  close(recoveryMultiple(75), 4);
});

test("an 80% drawdown needs a 400% recovery gain", () => {
  close(recoveryGainPercent(80), 400);
  close(recoveryMultiple(80), 5);
});

test("analyzeDrawdown reports drawdown, recovery gain, and multiple together", () => {
  const result = analyzeDrawdown(100000, 50000);
  assert.equal(result.drawdownPercent, 50);
  close(result.recoveryGainPercent, 100);
  close(result.recoveryMultiple, 2);
  assert.equal(result.peakPrice, 100000);
  assert.equal(result.troughPrice, 50000);
  assert.equal(result.priceIsClamped, false);
});

test("analyzeDrawdown computes the dollar gain back to the peak", () => {
  const result = analyzeDrawdown(100000, 50000);
  assert.equal(result.recoverTargetPrice, 100000);
  assert.equal(result.gainNeededUsd, 50000);
});

// ---- edges ----

test("a trough above the peak is clamped so the drawdown never goes negative", () => {
  assert.equal(drawdownPercent(100, 150), 0);
  const result = analyzeDrawdown(100, 150);
  assert.equal(result.drawdownPercent, 0);
  assert.equal(result.troughPrice, 100);
  assert.equal(result.priceIsClamped, true);
});

test("zero inputs return zero instead of NaN or Infinity", () => {
  assert.equal(drawdownPercent(0, 0), 0);
  assert.equal(recoveryGainPercent(0), 0);
  assert.equal(recoveryMultiple(0), 1);
  const result = analyzeDrawdown(0, 0);
  assert.equal(result.drawdownPercent, 0);
  assert.equal(Number.isFinite(result.recoveryMultiple), true);
});

test("no fall at all needs no recovery gain", () => {
  assert.equal(drawdownPercent(80000, 80000), 0);
  assert.equal(recoveryGainPercent(0), 0);
  assert.equal(recoveryMultiple(0), 1);
});

test("negative and non finite inputs are bounded away", () => {
  assert.equal(bounded(-500, 1000), 0);
  assert.equal(bounded(Number.NaN, 1000), 0);
  assert.equal(bounded(Number.POSITIVE_INFINITY, 1000), 1000);
  assert.equal(drawdownPercent(-100, 50), 0);
});

test("a total loss is clamped to the terminal drawdown and stays finite", () => {
  assert.equal(drawdownPercent(100, 0), 99.99);
  assert.equal(recoveryGainPercent(100), recoveryGainPercent(99.99));
  assert.equal(Number.isFinite(recoveryGainPercent(100)), true);
  assert.equal(Number.isFinite(recoveryMultiple(100)), true);
});

test("a drawdown just short of a total loss needs an enormous gain", () => {
  const gain = recoveryGainPercent(99.99);
  const multiple = recoveryMultiple(99.99);
  assert.ok(gain > 900000, `expected a huge gain, got ${gain}`);
  assert.ok(multiple > 9000, `expected a huge multiple, got ${multiple}`);
  assert.equal(Number.isFinite(gain), true);
});

test("a recovery target above the peak reports the extra gain", () => {
  const result = analyzeDrawdown(100000, 50000, 25);
  assert.equal(result.recoverTargetPrice, 125000);
  assert.equal(result.gainNeededUsd, 75000);
});

test("an explicit recovery price overrides the target percent", () => {
  const result = analyzeDrawdown(100000, 50000, 25, 90000);
  assert.equal(result.recoverTargetPrice, 90000);
  assert.equal(result.gainNeededUsd, 40000);
});

// ---- recovery table ----

test("the recovery table spans 10% to 90% in steps of 10", () => {
  const rows = recoveryTable();
  assert.equal(rows.length, 9);
  assert.equal(rows[0].drawdownPercent, 10);
  assert.equal(rows[8].drawdownPercent, 90);
});

test("every recovery table row is larger than its drawdown", () => {
  for (const row of recoveryTable()) {
    assert.ok(row.recoveryGainPercent > row.drawdownPercent, `row ${row.drawdownPercent} not bigger`);
    assert.ok(row.remainingValuePercent === 100 - row.drawdownPercent);
  }
  const halfway = recoveryTable().find((row) => row.drawdownPercent === 50);
  assert.ok(halfway !== undefined);
  close(halfway.recoveryGainPercent, 100);
});

test("the recovery table accepts a custom start and end", () => {
  const rows = recoveryTable(20, 40, 10);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].drawdownPercent, 20);
  assert.equal(rows[2].drawdownPercent, 40);
});

// ---- copy generators ----

test("drawdown copy generators return non empty human sentences", () => {
  const texts = [
    drawdownIntroText(),
    drawdownDisclosureText(),
    drawdownWorkedExample(100000, 50000),
    recoveryMathNote(50, 100),
    indexCrashExampleText("index", 1000, 200),
  ];
  for (const text of texts) {
    assert.equal(text.length > 40, true, "copy too short");
    assert.ok(text.includes("\u2014") === false, "contains em dash");
    assert.ok(text.includes("--") === false, "contains double hyphen");
    assert.ok(/^This is\b/.test(text) === false, "opens with This is");
  }
});

test("the drawdown copy opens without an AI tell phrase", () => {
  for (const text of [drawdownIntroText(), drawdownDisclosureText()]) {
    assert.ok(/^(This is|In today's|Let's|As an AI)\b/i.test(text) === false);
  }
});

test("the worked example quotes the real numbers it was given", () => {
  const text = drawdownWorkedExample(100000, 50000);
  assert.ok(text.includes("$100,000"));
  assert.ok(text.includes("$50,000"));
  assert.ok(text.includes("50%"));
  assert.ok(text.includes("100%"));
  assert.ok(text.includes("2.00x"));
});

test("format helpers render currency, percent, and multiple", () => {
  assert.equal(formatUsd(20000), "$20,000");
  assert.equal(formatUsd(0.0000123), "$0.000012");
  assert.equal(formatPercent(12.5), "12.5%");
  assert.equal(formatPercent(Number.POSITIVE_INFINITY), "not reachable");
  assert.equal(formatMultiple(2), "2.00x");
  assert.equal(formatMultiple(Number.POSITIVE_INFINITY), "not reachable");
});

// ---- determinism ----

test("the same inputs always produce the same drawdown result", () => {
  const a = analyzeDrawdown(68000, 16000, 15);
  const b = analyzeDrawdown(68000, 16000, 15);
  assert.deepEqual(a, b);
});
