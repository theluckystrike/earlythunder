import { impermanentLossFromRatio, impermanentLossFromChanges, positionOutcome } from "../src/lib/impermanent-loss";
import { liquidationDistanceFraction, longLiquidationPrice, shortLiquidationPrice } from "../src/lib/liquidation-math";

let fails = 0;
function near(label: string, got: number | null, want: number, tol = 1e-9) {
  const ok = got !== null && Math.abs(got - want) <= tol;
  if (!ok) fails += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${label}  got=${got} want=${want}`);
}

// Textbook constant product impermanent loss checkpoints.
near("IL at ratio 1 is zero", impermanentLossFromRatio(1), 0);
near("IL at 2x divergence is -5.719%", impermanentLossFromRatio(2), 2 * Math.SQRT2 / 3 - 1, 1e-12);
near("IL at ratio 4 is -20%", impermanentLossFromRatio(4), 2 * 2 / 5 - 1, 1e-12);
near("IL is symmetric in r and 1/r", impermanentLossFromRatio(4), impermanentLossFromRatio(0.25) ?? NaN, 1e-12);
near("IL from +100% against flat equals ratio 2", impermanentLossFromChanges(100, 0), 2 * Math.SQRT2 / 3 - 1, 1e-12);
console.log("IL at ratio 0 returns null:", impermanentLossFromRatio(0) === null ? "pass" : "FAIL");
console.log("IL from -100% returns null:", impermanentLossFromChanges(-100, 0) === null ? "pass" : "FAIL");

// A 10000 dollar position, asset A quadruples, asset B flat.
const out = positionOutcome(10_000, 300, 0);
if (out === null) { console.log("FAIL positionOutcome returned null"); fails += 1; }
else {
  near("hold value at 4x and flat", out.holdValue, 10_000 * (4 + 1) / 2, 1e-9);
  near("lp value at 4x and flat", out.lpValue, 10_000 * Math.sqrt(4 * 1), 1e-9);
  near("lp minus hold is the 20% loss", out.lpValue / out.holdValue - 1, -0.2, 1e-12);
}

// Liquidation, isolated, no cushion. 10x long at 0.5% maintenance liquidates 9.5% below entry.
near("10x isolated distance", liquidationDistanceFraction(10, 0.5, 0), 1 / 10 - 0.005, 1e-12);
near("10x long liq price from 100", longLiquidationPrice({ side: "long", marginMode: "isolated", entryPrice: 100, positionSizeUsd: 1000, leverage: 10, maintenanceMarginPercent: 0.5, extraBalanceUsd: 0 }), 100 * (1 - (0.1 - 0.005)), 1e-9);
near("10x short liq price from 100", shortLiquidationPrice({ side: "short", marginMode: "isolated", entryPrice: 100, positionSizeUsd: 1000, leverage: 10, maintenanceMarginPercent: 0.5, extraBalanceUsd: 0 }), 100 * (1 + (0.1 - 0.005)), 1e-9);
near("1x long distance is nearly the whole price", liquidationDistanceFraction(1, 0.5, 0), 1 - 0.005, 1e-12);

console.log(fails === 0 ? "\nALL MATH CHECKS PASSED" : `\n${fails} MATH CHECKS FAILED`);
process.exit(fails === 0 ? 0 : 1);
