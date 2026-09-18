import assert from "node:assert/strict";
import test from "node:test";
import {
  costBasis,
  DEFAULT_LONG_TERM_RATE,
  calculateTax,
  formatPercent,
  formatUsd,
  gain,
  isLongTerm,
  proceeds,
  taxDisclosureText,
  taxDragPercent,
  taxExample,
  taxIntroText,
  taxLongTermText,
  taxLossText,
  taxOwed,
  taxShortTermText,
  taxTitle,
} from "../src/lib/tax-calc";

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

// Hand-checked fixture. 1 unit, buy $40,000, sell $60,000, fees 0.5 / 0.5,
// 200 day hold, 24% short term bracket, 15% long term.
function baseRun(overrides: Partial<Parameters<typeof calculateTax>[0]> = {}) {
  return calculateTax({
    buyPrice: 40000,
    sellPrice: 60000,
    quantity: 1,
    buyFeePercent: 0.5,
    sellFeePercent: 0.5,
    holdingDays: 200,
    incomeBracketPercent: 24,
    longTermRatePercent: DEFAULT_LONG_TERM_RATE,
    ...overrides,
  });
}

test("costBasis adds the buy fee on top of the notional", () => {
  near(costBasis(40000, 1, 0.5), 40200);
  near(costBasis(40000, 1, 0), 40000);
  near(costBasis(100, 2, 1), 202);
});

test("proceeds subtract the sell fee from the notional", () => {
  near(proceeds(60000, 1, 0.5), 59700);
  near(proceeds(60000, 1, 0), 60000);
  near(proceeds(100, 2, 1), 198);
});

test("gain is proceeds minus cost basis", () => {
  near(gain(40200, 59700), 19500);
  near(gain(1000, 500), -500);
});

test("short term tax uses the income bracket rate", () => {
  near(taxOwed(19500, 24), 4680);
});

test("long term tax uses the flat long term rate", () => {
  near(taxOwed(19500, 15), 2925);
});

test("a 365 day hold still counts as short term", () => {
  assert.equal(isLongTerm(365), false);
  assert.equal(isLongTerm(366), true);
  assert.equal(isLongTerm(0), false);
});

test("full run splits fees, gain, tax, and after tax proceeds", () => {
  const result = baseRun();
  near(result.costBasis, 40200);
  near(result.proceeds, 59700);
  near(result.gain, 19500);
  near(result.taxOwed, 4680);
  near(result.afterTaxProceeds, 55020);
  near(result.afterTaxGain, 14820);
  near(result.totalFees, 500, 1e-6);
  assert.equal(result.isLongTerm, false);
  near(result.ratePercent, 24);
});

test("tax drag is tax over cost basis in percent", () => {
  const result = baseRun();
  near(result.taxDragPercent, (4680 / 40200) * 100);
  near(taxDragPercent(4680, 40200), result.taxDragPercent);
});

test("holding past a year switches to the long term rate", () => {
  const result = baseRun({ holdingDays: 400 });
  assert.equal(result.isLongTerm, true);
  near(result.ratePercent, 15);
  near(result.taxOwed, 2925);
  near(result.afterTaxProceeds, 56775);
});

test("a loss books zero tax and lowers the after tax proceeds", () => {
  const result = baseRun({ sellPrice: 30000, holdingDays: 400 });
  assert.ok(result.gain < 0, "expected a loss");
  near(result.taxOwed, 0);
  near(result.afterTaxProceeds, result.proceeds);
  near(result.taxDragPercent, 0);
  near(result.afterTaxGain, result.gain);
});

test("zero gain owes no tax", () => {
  const result = baseRun({ sellPrice: 40402.010050251256 });
  near(result.gain, 0, 1e-6);
  near(result.taxOwed, 0);
  near(result.taxDragPercent, 0);
});

test("zero quantity produces a zero basis and a zero bill", () => {
  const result = baseRun({ quantity: 0 });
  near(result.costBasis, 0);
  near(result.proceeds, 0);
  near(result.gain, 0);
  near(result.taxOwed, 0);
  near(result.afterTaxProceeds, 0);
  near(result.breakEvenPrice, 0);
});

test("fractional quantity scales every dollar line", () => {
  const whole = baseRun();
  const half = baseRun({ quantity: 0.5 });
  near(half.costBasis, whole.costBasis / 2);
  near(half.proceeds, whole.proceeds / 2);
  near(half.gain, whole.gain / 2);
  near(half.taxOwed, whole.taxOwed / 2);
});

test("a higher sell fee lowers the gain and the tax bill", () => {
  const cheap = baseRun({ sellFeePercent: 0 });
  const pricey = baseRun({ sellFeePercent: 2 });
  assert.ok(pricey.proceeds < cheap.proceeds);
  assert.ok(pricey.gain < cheap.gain);
  assert.ok(pricey.taxOwed < cheap.taxOwed);
  assert.ok(pricey.totalFees > cheap.totalFees);
});

test("fees are charged on both sides of the trade", () => {
  const result = baseRun();
  near(result.costBasis - 40000, 200, 1e-6);
  near(60000 - result.proceeds, 300, 1e-6);
  near(result.totalFees, 500, 1e-6);
});

test("break even price covers the basis after the sell fee", () => {
  const result = baseRun();
  const atBreakEven = baseRun({ sellPrice: result.breakEvenPrice });
  near(atBreakEven.gain, 0, 1e-6);
});

test("rates above one hundred percent are capped", () => {
  const result = baseRun({ holdingDays: 30, incomeBracketPercent: 250 });
  near(result.ratePercent, 100);
  near(result.taxOwed, result.gain);
});

test("bad inputs degrade safely to zero", () => {
  const result = calculateTax({
    buyPrice: -1,
    sellPrice: -1,
    quantity: -1,
    buyFeePercent: -1,
    sellFeePercent: -1,
    holdingDays: -1,
    incomeBracketPercent: -1,
    longTermRatePercent: -1,
  });
  near(result.costBasis, 0);
  near(result.proceeds, 0);
  near(result.gain, 0);
  near(result.taxOwed, 0);
  near(result.afterTaxProceeds, 0);
  near(result.taxDragPercent, 0);
});

test("copy generators return non-empty humanized strings without artifacts", () => {
  const strings = [
    taxTitle(),
    taxIntroText(40000, 60000, 1),
    taxShortTermText(24),
    taxLongTermText(15),
    taxLossText(),
    taxExample(),
    taxDisclosureText(),
  ];
  const tells = ["This is ", "crucial", "delve", "landscape", "In conclusion", "It is important to note"];
  for (const s of strings) {
    assert.ok(typeof s === "string" && s.length > 0, "copy must be non-empty");
    assert.ok(!s.includes("undefined"), `leaked undefined: ${s}`);
    assert.ok(!s.includes("NaN"), `leaked NaN: ${s}`);
    assert.ok(!s.includes("—"), `em dash leaked: ${s}`);
    for (const tell of tells) {
      assert.ok(!s.includes(tell), `AI tell "${tell}" in: ${s}`);
    }
  }
  assert.ok(taxIntroText(40000, 60000, 1).includes("$40,000.00"));
  assert.ok(taxShortTermText(24).includes("24%"));
  assert.ok(taxLongTermText(15).includes("15%"));
  assert.ok(taxTitle().toLowerCase().includes("capital gains"));
});

test("formatUsd keeps two decimals and formatPercent rounds to two", () => {
  assert.equal(formatUsd(55020), "$55,020.00");
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatPercent(24), "24%");
  assert.equal(formatPercent(11.6382), "11.64%");
});
