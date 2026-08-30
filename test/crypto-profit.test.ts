import assert from "node:assert/strict";
import test from "node:test";
import { buildRecoveryCurve, calculateCryptoProfit, type CalculatorInput } from "../src/lib/crypto-calculator";

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Number.isFinite(actual));
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

test("calculates a profitable quantity position with separate fees", () => {
  const result = calculateCryptoProfit({ mode: "quantity", buyPrice: 100, sellPrice: 150, amount: 2, buyFeePercent: 0.5, sellFeePercent: 0.5 });
  near(result.totalCost, 201);
  near(result.netProceeds, 298.5);
  near(result.profit, 97.5);
  near(result.roiRate, 0.48507462686567165);
  near(result.breakEvenPrice, 101.00502512562814);
});

test("calculates a loss and fee-aware recovery", () => {
  const result = calculateCryptoProfit({ mode: "quantity", buyPrice: 100, sellPrice: 50, amount: 1, buyFeePercent: 1, sellFeePercent: 1 });
  near(result.totalCost, 101);
  near(result.netProceeds, 49.5);
  near(result.breakEvenPrice, 102.02020202020202);
  near(result.recoveryRate ?? 0, 1.0404040404040407);
});

test("keeps the entry fee inside total cash mode", () => {
  const result = calculateCryptoProfit({ mode: "cash", buyPrice: 100, sellPrice: 125, amount: 1_000, buyFeePercent: 1, sellFeePercent: 2 });
  near(result.totalCost, 1_000);
  near(result.buyNotional + result.buyFee, 1_000);
  near(result.quantity, result.buyNotional / 100);
});

test("represents zero-price recovery without inventing a percentage", () => {
  const result = calculateCryptoProfit({ mode: "quantity", buyPrice: 100, sellPrice: 0, amount: 1, buyFeePercent: 0, sellFeePercent: 0 });
  assert.equal(result.recoveryRate, null);
  near(result.profit, -100);
});

test("covers 486 bounded combinations in both amount modes", () => {
  const buyPrices = [0.01, 100, 1_000_000];
  const sellPrices = [0, 50, 1_000_000];
  const amounts = [0.00000001, 1, 1_000_000];
  const fees = [0, 0.5, 99];
  const modes = ["quantity", "cash"] as const;
  let checked = 0;
  for (const mode of modes) for (const buyPrice of buyPrices) for (const sellPrice of sellPrices) {
    for (const amount of amounts) for (const buyFeePercent of fees) for (const sellFeePercent of fees) {
      const input: CalculatorInput = { mode, buyPrice, sellPrice, amount, buyFeePercent, sellFeePercent };
      const result = calculateCryptoProfit(input);
      assert.ok([result.quantity, result.totalCost, result.netProceeds, result.profit, result.roiRate, result.breakEvenPrice].every(Number.isFinite));
      if (mode === "cash") near(result.totalCost, amount);
      else near(result.quantity, amount);
      const breakEven = calculateCryptoProfit({ ...input, sellPrice: result.breakEvenPrice });
      near(breakEven.profit, 0, 1e-7);
      if (sellPrice === 0) assert.equal(result.recoveryRate, null);
      checked += 1;
    }
  }
  assert.equal(checked, 486);
});

test("builds a bounded curve that responds to both fees", () => {
  const base = { mode: "quantity", buyPrice: 100, sellPrice: 50, amount: 1, buyFeePercent: 0, sellFeePercent: 0 } as const;
  const free = buildRecoveryCurve(base);
  const feeAware = buildRecoveryCurve({ ...base, buyFeePercent: 1, sellFeePercent: 2 });
  assert.equal(free.length, 11);
  assert.equal(feeAware.length, 11);
  assert.ok(feeAware.every((point, index) => point.recoveryRate > free[index].recoveryRate));
});

test("rejects invalid and out-of-range inputs", () => {
  const valid: CalculatorInput = { mode: "quantity", buyPrice: 100, sellPrice: 120, amount: 1, buyFeePercent: 0, sellFeePercent: 0 };
  assert.throws(() => calculateCryptoProfit({ ...valid, buyPrice: 0 }), RangeError);
  assert.throws(() => calculateCryptoProfit({ ...valid, sellPrice: -1 }), RangeError);
  assert.throws(() => calculateCryptoProfit({ ...valid, amount: Number.POSITIVE_INFINITY }), RangeError);
  assert.throws(() => calculateCryptoProfit({ ...valid, buyFeePercent: 100 }), RangeError);
  assert.throws(() => calculateCryptoProfit({ ...valid, sellFeePercent: 100 }), RangeError);
  assert.doesNotThrow(() => calculateCryptoProfit({ ...valid, buyPrice: 1_000_000_000, amount: 1_000_000_000_000, buyFeePercent: 99, sellFeePercent: 99 }));
});
