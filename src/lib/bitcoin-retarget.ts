/**
 * Bitcoin difficulty retarget math, ported line for line from Bitcoin Core
 * v32.1 (tag v32.1, fetched 2026-10-30T01:26Z, copies in the run folder).
 *
 * Sources (all fetched this sprint, run folder fetched-sources/):
 * - src/pow.cpp: GetNextWorkRequired (pow.cpp:14-48), CalculateNextWorkRequired
 *   (pow.cpp:50-85), DeriveTarget (pow.cpp:146-159),
 *   PermittedDifficultyTransition (pow.cpp:89-136).
 * - src/kernel/chainparams.cpp lines 126-128: mainnet powLimit
 *   0x00000000ffff..., nPowTargetTimespan = 14 * 24 * 60 * 60,
 *   nPowTargetSpacing = 10 * 60.
 * - src/consensus/params.h line 130: DifficultyAdjustmentInterval() =
 *   nPowTargetTimespan / nPowTargetSpacing = 2016.
 * - src/arith_uint256.cpp: SetCompact / GetCompact (the nBits format).
 * - src/chain.cpp GetBitsProof (chain.cpp:120-133): expected hashes =
 *   ~target / (target + 1) + 1.
 * - src/rpc/blockchain.cpp GetDifficulty (rpc/blockchain.cpp:136-155): the
 *   RPC's difficulty readout.
 * - src/test/pow_tests.cpp: four hardcoded expected nBits vectors used by the
 *   test suite as ground truth.
 *
 * The 256-bit target lives in BigInt, so every target arithmetic step is
 * exact integer math, mirroring arith_uint256. Difficulty uses floating point
 * with explicit finite checks because the RPC readout itself is a double.
 *
 * NASA Power of 10: bounded loops, every input range checked, no recursion,
 * single-exit helpers, no silent casts.
 */

/** Mainnet proof-of-work limit as a compact value (chainparams.cpp:126). */
export const POW_LIMIT_COMPACT = 0x1d00ffff;
/** nPowTargetTimespan: two weeks in seconds (chainparams.cpp:127). */
export const TARGET_TIMESPAN_SECONDS = 14 * 24 * 60 * 60;
/** nPowTargetSpacing: ten minutes in seconds (chainparams.cpp:128). */
export const TARGET_SPACING_SECONDS = 600;
/** DifficultyAdjustmentInterval(): timespan / spacing = 2016 blocks. */
export const RETARGET_INTERVAL = TARGET_TIMESPAN_SECONDS / TARGET_SPACING_SECONDS;
/** Actual timespan is clamped into [timespan/4, timespan*4] (pow.cpp:57-60). */
export const MIN_ACTUAL_TIMESPAN = TARGET_TIMESPAN_SECONDS / 4;
/** Upper clamp: timespan * 4 = 4,838,400 s (pow.cpp:59-60). */
export const MAX_ACTUAL_TIMESPAN = TARGET_TIMESPAN_SECONDS * 4;
/** Highest height the calculator accepts: 2,000,000 blocks of headroom. */
export const MAX_INPUT_HEIGHT = 2_000_000;
/** Largest block interval that impliedHashrate accepts: 8 weeks (4,838,400 s), equal to the upper clamp. */
export const MAX_EPOCH_SECONDS = MAX_ACTUAL_TIMESPAN;
/** Mainnet powLimit 0x00000000ffff...ffff = 2^224 - 1 (chainparams.cpp:126). Its GetCompact is 0x1d00ffff. */
export const POW_LIMIT_TARGET = BigInt(2) ** BigInt(224) - BigInt(1);

/** A valid compact nBits word: 32-bit, sign bit never set on real targets. */
function nBitsIsValid(nBits: number): boolean {
  return Number.isSafeInteger(nBits) && nBits >= 0 && nBits <= 0xffffffff;
}

/**
 * SetCompact (arith_uint256.cpp:176-194): the compact bits decode to a 256-bit
 * target. Null for a negative, zero, or overflow word, exactly as
 * DeriveTarget rejects them (pow.cpp:146-159).
 */
export function targetFromCompact(nBits: number): bigint | null {
  if (!nBitsIsValid(nBits)) return null;
  const size = (nBits >>> 24) & 0xff;
  const word = nBits & 0x007fffff;
  const negative = word !== 0 && (nBits & 0x00800000) !== 0;
  const overflow = size > 34 || (word > 0xff && size > 33) || (word > 0xffff && size > 32);
  if (negative || overflow) return null;
  let target: bigint;
  if (size <= 3) {
    target = BigInt(word) >> BigInt(8 * (3 - size));
  } else {
    target = BigInt(word) << BigInt(8 * (size - 3));
  }
  if (target === BigInt(0)) return null;
  if (target > POW_LIMIT_TARGET) return null; // DeriveTarget: bnTarget > powLimit -> {}
  return target;
}

/**
 * GetCompact (arith_uint256.cpp:196-217): encode a 256-bit target back into
 * compact form. If the 0x00800000 sign bit is set in the mantissa, Core
 * divides the mantissa by 256 and adds 1 to the size. The byte shifted out
 * is dropped, exactly as the C++ code does. Null for a negative or zero
 * target, which cannot be encoded.
 */
export function compactFromTarget(target: bigint): number | null {
  if (typeof target !== "bigint" || target < BigInt(0)) return null;
  if (target === BigInt(0)) return null;
  let size = target.toString(2).length / 8;
  size = Math.ceil(size);
  let mantissa: bigint;
  if (size <= 3) {
    mantissa = target << BigInt(8 * (3 - size));
  } else {
    mantissa = target >> BigInt(8 * (size - 3));
  }
  // GetCompact: if the 0x00800000 sign bit is set, divide the mantissa by 256
  // and add 1 to the size. Core does this for every size, also size <= 3.
  if ((mantissa & BigInt(0x00800000)) !== BigInt(0)) {
    mantissa >>= BigInt(8);
    size += 1;
  }
  const compact = (Number(mantissa) | (size << 24)) >>> 0;
  return compact;
}

/**
 * CalculateNextWorkRequired (pow.cpp:50-85) reduced to the ratio the page
 * shows. Returns the unclamped ratio actual/expected; the caller clamps.
 * Both inputs are seconds. Total and bounded for every finite input.
 */
export function retargetRatio(actualEpochSeconds: number): number {
  if (!Number.isFinite(actualEpochSeconds) || actualEpochSeconds <= 0) return 1;
  return actualEpochSeconds / TARGET_TIMESPAN_SECONDS;
}

/** The pow.cpp:57-60 clamp applied to a ratio. */
export function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  if (ratio < 0.25) return 0.25;
  if (ratio > 4) return 4;
  return ratio;
}

/**
 * CalculateNextWorkRequired (pow.cpp:50-85) on the compact representation:
 * clamp the actual epoch time into [timespan/4, timespan*4], then
 * new_target = last_target * clamped / timespan, capped at the pow limit,
 * and re-encoded with GetCompact. Returns null when the input nBits cannot
 * be decoded, so a caller never renders a fabricated value.
 */
export function nextNBits(lastNBits: number, actualEpochSeconds: number): number | null {
  if (!nBitsIsValid(lastNBits)) return null;
  if (!Number.isFinite(actualEpochSeconds) || actualEpochSeconds <= 0) return null;
  const clamped = Math.min(Math.max(actualEpochSeconds, MIN_ACTUAL_TIMESPAN), MAX_ACTUAL_TIMESPAN);
  const target = targetFromCompact(lastNBits);
  if (target === null) return null;
  const scaled = (target * BigInt(Math.round(clamped))) / BigInt(TARGET_TIMESPAN_SECONDS);
  const capped = scaled > POW_LIMIT_TARGET ? POW_LIMIT_TARGET : scaled;
  if (capped <= BigInt(0)) return null;
  return compactFromTarget(capped);
}

/**
 * GetDifficulty (rpc/blockchain.cpp:136-155): the RPC's difficulty readout
 * as a multiple of the minimum difficulty. Floating point by definition.
 */
export function difficultyFromNBits(nBits: number): number {
  if (!nBitsIsValid(nBits)) return 0;
  const shift = (nBits >>> 24) & 0xff;
  let diff = 0x0000ffff / (nBits & 0x00ffffff);
  let s = shift;
  while (s < 29) { diff *= 256.0; s++; }
  while (s > 29) { diff /= 256.0; s--; }
  return diff;
}

/**
 * GetBitsProof (chain.cpp:120-133): expected hashes per block,
 * ~target / (target + 1) + 1, which equals floor(2^256 / (target + 1)).
 * Exact BigInt. 0 for a negative, zero, overflow or above-powLimit nBits.
 * At nBits 0x1d00ffff the value is 4,295,032,833.
 */
export function expectedHashes(nBits: number): bigint {
  const target = targetFromCompact(nBits);
  if (target === null) return BigInt(0);
  return (BigInt(2) ** BigInt(256)) / (target + BigInt(1));
}

/**
 * Projected period length from a period in progress: blocksMined blocks
 * (2..2016) took elapsedSeconds from the first block of the period to the
 * latest block, so elapsed covers blocksMined - 1 intervals. Core times the
 * full period over 2015 intervals (pindexLast->nHeight - 2015).
 */
export function projectedTimespan(blocksMined: number, elapsedSeconds: number): number | null {
  if (!Number.isSafeInteger(blocksMined) || blocksMined < 2 || blocksMined > RETARGET_INTERVAL) return null;
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return null;
  return Math.round((elapsedSeconds * (RETARGET_INTERVAL - 1)) / (blocksMined - 1));
}

/** Implied network hashrate in hashes per second: GetBitsProof / the block interval that the user enters. */
export function impliedHashrate(nBits: number, intervalSeconds: number): bigint | null {
  if (!Number.isSafeInteger(intervalSeconds) || intervalSeconds <= 0 || intervalSeconds > MAX_EPOCH_SECONDS) return null;
  const hashes = expectedHashes(nBits);
  if (hashes === BigInt(0)) return null;
  return hashes / BigInt(intervalSeconds);
}

/**
 * PermittedDifficultyTransition (pow.cpp:89-136): the new target must lie
 * between old*timespan/4 and old*timespan*4, both rounded through
 * GetCompact/SetCompact exactly as Core does, and capped at the pow limit.
 */
export function transitionIsPermitted(oldNBits: number, newNBits: number): boolean {
  if (!nBitsIsValid(oldNBits) || !nBitsIsValid(newNBits)) return false;
  const oldTarget = targetFromCompact(oldNBits);
  const newTarget = targetFromCompact(newNBits);
  if (oldTarget === null || newTarget === null) return false;
  const largestRaw = (oldTarget * BigInt(MAX_ACTUAL_TIMESPAN)) / BigInt(TARGET_TIMESPAN_SECONDS);
  const smallestRaw = (oldTarget * BigInt(MIN_ACTUAL_TIMESPAN)) / BigInt(TARGET_TIMESPAN_SECONDS);
  const largest = largestRaw > POW_LIMIT_TARGET ? POW_LIMIT_TARGET : largestRaw;
  const smallest = smallestRaw > POW_LIMIT_TARGET ? POW_LIMIT_TARGET : smallestRaw;
  const maxCompact = compactFromTarget(largest);
  const minCompact = compactFromTarget(smallest);
  if (maxCompact === null || minCompact === null) return false;
  const maxRounded = targetFromCompact(maxCompact);
  const minRounded = targetFromCompact(minCompact);
  if (maxRounded === null || minRounded === null) return false;
  return newTarget <= maxRounded && newTarget >= minRounded;
}

/**
 * Height of the first block that uses a new target, after the latest mined
 * block `height`: the next multiple of 2016 above it. 0 for invalid input.
 */
export function nextRetargetHeight(height: number): number {
  if (!Number.isSafeInteger(height) || height < 0 || height > MAX_INPUT_HEIGHT) return 0;
  return (Math.floor(height / RETARGET_INTERVAL) + 1) * RETARGET_INTERVAL;
}

/** Blocks still to mine until that block, counting it (1 to 2016). 0 for invalid input. */
export function blocksUntilRetarget(height: number): number {
  const next = nextRetargetHeight(height);
  return next === 0 ? 0 : next - height;
}
