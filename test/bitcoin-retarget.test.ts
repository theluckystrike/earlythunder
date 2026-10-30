import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_EPOCH_SECONDS,
  MAX_INPUT_HEIGHT,
  POW_LIMIT_TARGET,
  TARGET_TIMESPAN_SECONDS,
  blocksUntilRetarget,
  clampRatio,
  compactFromTarget,
  difficultyFromNBits,
  expectedHashes,
  impliedHashrate,
  nextNBits,
  nextRetargetHeight,
  projectedTimespan,
  retargetRatio,
  targetFromCompact,
  transitionIsPermitted,
} from "../src/lib/bitcoin-retarget";

// Ground truth: the four hardcoded vectors of Bitcoin Core v32.1
// src/test/pow_tests.cpp, fetched 2026-10-30T01:26Z.

test("core vector get_next_work: block 32255 -> 0x1d00d86a", () => {
  const actual = 1262152739 - 1261130161; // 1022578 s, 15.46% less than two weeks
  assert.equal(nextNBits(0x1d00ffff, actual), 0x1d00d86a);
});

test("core vector get_next_work_pow_limit: capped at powLimit, not clamped", () => {
  const actual = 1233061996 - 1231006505; // 2055491 s, slower than two weeks; capped at powLimit
  assert.equal(nextNBits(0x1d00ffff, actual), 0x1d00ffff);
});

test("core vector get_next_work_lower_limit_actual: 0x1c05a3f4 -> 0x1c0168fd", () => {
  const actual = 1279297671 - 1279008237; // 289434 s, hits the /4 clamp
  assert.equal(nextNBits(0x1c05a3f4, actual), 0x1c0168fd);
});

test("core vector get_next_work_upper_limit_actual: 0x1c387f6f -> 0x1d00e1fd", () => {
  const actual = 1269211443 - 1263163443; // 6048000 s, hits the *4 clamp
  assert.equal(nextNBits(0x1c387f6f, actual), 0x1d00e1fd);
});

test("clamp bounds follow pow.cpp:57-60", () => {
  assert.equal(clampRatio(0.1), 0.25);
  assert.equal(clampRatio(5), 4);
  assert.equal(clampRatio(1), 1);
});

test("retarget ratio is actual over expected", () => {
  assert.equal(retargetRatio(TARGET_TIMESPAN_SECONDS), 1);
  assert.equal(retargetRatio(604800), 0.5);
});

test("difficultyFromNBits matches GetDifficulty", () => {
  // 0x1b0404cb: GetDifficulty = 0xffff / 0x0404cb * 256^2 = 16307.420938523983 (own calculation)
  assert.equal(difficultyFromNBits(0x1b0404cb), 16307.420938523983);
  assert.equal(difficultyFromNBits(0x1d00ffff), 1);
});

test("expectedHashes is GetBitsProof exactly", () => {
  const h = expectedHashes(0x1d00ffff);
  assert.equal(h, BigInt("4295032833"));
  assert.equal(expectedHashes(0x170335e7), BigInt("376547180057052938322127"));
  assert.equal(expectedHashes(0x01803456), BigInt(0));
  assert.equal(expectedHashes(0), BigInt(0));
});

test("projection and implied hashrate", () => {
  assert.equal(projectedTimespan(2016, 1022578), 1022578);
  assert.equal(projectedTimespan(1008, 600000), 1200596);
  assert.equal(projectedTimespan(1, 600), null);
  assert.equal(impliedHashrate(0x1d00ffff, 600), BigInt("7158388"));
  assert.equal(impliedHashrate(0x1d00ffff, 0), null);
});

test("transition check follows PermittedDifficultyTransition", () => {
  assert.equal(transitionIsPermitted(0x1d00ffff, 0x1d00d86a), true);
  assert.equal(transitionIsPermitted(0x1d00ffff, 0x1c05a3f4), false);
});

test("retarget boundary arithmetic", () => {
  assert.equal(nextRetargetHeight(2016), 4032);
  assert.equal(nextRetargetHeight(0), 2016);
  assert.equal(nextRetargetHeight(32255), 32256);
  assert.equal(blocksUntilRetarget(32256), 2016);
  assert.equal(blocksUntilRetarget(32255), 1);
  assert.equal(blocksUntilRetarget(2_000_001), 0);
});

test("input bounds", () => {
  assert.equal(targetFromCompact(-1), null);
  assert.equal(targetFromCompact(0x1ffffffff), null);
  assert.equal(targetFromCompact(0x01803456), null); // sign bit set
  assert.equal(targetFromCompact(0), null);
  assert.equal(targetFromCompact(0x1d01ffff), null); // above powLimit
  assert.equal(MAX_EPOCH_SECONDS, 4 * TARGET_TIMESPAN_SECONDS);
  assert.equal(MAX_INPUT_HEIGHT, 2_000_000);
});

test("powLimit is 2^224 - 1 and GetCompact gives 0x1d00ffff", () => {
  assert.equal(POW_LIMIT_TARGET, BigInt(2) ** BigInt(224) - BigInt(1));
  assert.equal(compactFromTarget(POW_LIMIT_TARGET), 0x1d00ffff);
  assert.equal(nextNBits(0x1c387f6f, 6048000), 0x1d00e1fd);
});
