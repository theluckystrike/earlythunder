"use client";

import { useMemo, useState } from "react";
import {
  MAX_ACTUAL_TIMESPAN,
  MIN_ACTUAL_TIMESPAN,
  MAX_INPUT_HEIGHT,
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
} from "@/lib/bitcoin-retarget";

function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "invalid";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function pct(n: number): string {
  if (!Number.isFinite(n)) return "invalid";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function DifficultyRetargetCalculator() {
  const [epochSeconds, setEpochSeconds] = useState("1022578");
  const [nBitsRaw, setNBitsRaw] = useState("0x1d00ffff");
  const [height, setHeight] = useState("32255");
  const [blocksMined, setBlocksMined] = useState("2016");
  const [intervalSeconds, setIntervalSeconds] = useState("600");
  const [targetRaw, setTargetRaw] = useState("0x00000000ffff0000000000000000000000000000000000000000000000000000");

  const nBits = /^0x[0-9a-fA-F]{1,8}$/.test(nBitsRaw.trim()) ? Number.parseInt(nBitsRaw.trim(), 16) : Number.NaN;
  const nBitsValid = /^0x[0-9a-f]{1,8}$/.test(nBitsRaw) && targetFromCompact(nBits) !== null;
  const heightValid = /^\d{1,7}$/.test(height.trim()) && Number(height) <= MAX_INPUT_HEIGHT;
  const blockHeight = heightValid ? Number(height.trim()) : -1;
  const blocksCount = /^\d{1,4}$/.test(blocksMined.trim()) ? Number(blocksMined.trim()) : 0;
  const epoch = projectedTimespan(blocksCount, boundedNumber(epochSeconds, 999999999999)) ?? 0;
  const clampedEpoch = Math.min(Math.max(epoch, MIN_ACTUAL_TIMESPAN), MAX_ACTUAL_TIMESPAN);

  const result = useMemo(() => {
    if (!nBitsValid || epoch <= 0) return null;
    const ratio = clampRatio(retargetRatio(epoch));
    const next = nextNBits(nBits, epoch);
    if (next === null) return null;
    const oldDiff = difficultyFromNBits(nBits);
    const newDiff = difficultyFromNBits(next);
    return {
      ratio,
      clamped: ratio !== retargetRatio(epoch),
      next,
      target: targetFromCompact(nBits),
      oldDiff,
      newDiff,
      changePct: (newDiff / oldDiff - 1) * 100,
      newTarget: targetFromCompact(next),
      hashes: expectedHashes(nBits),
      newHashes: expectedHashes(next),
    };
  }, [epoch, nBits, nBitsValid]);

  const intervalValue = /^\d{1,7}$/.test(intervalSeconds.trim()) ? Number(intervalSeconds.trim()) : 0;
  const hashrate = nBitsValid ? impliedHashrate(nBits, intervalValue) : null;
  const blockInPeriod = heightValid ? (blockHeight % 2016) + 1 : 0;
  const targetInput = /^0x[0-9a-f]{1,64}$/.test(targetRaw) ? BigInt(targetRaw) : null;
  const targetNBits = targetInput !== null ? compactFromTarget(targetInput) : null;
  const targetDecoded = targetNBits !== null ? targetFromCompact(targetNBits) : null;

  const boundary = useMemo(() => {
    if (!heightValid) return null;
    const nextHeight = nextRetargetHeight(blockHeight);
    const remaining = blocksUntilRetarget(blockHeight);
    if (nextHeight === 0) return null;
    return { nextHeight, remaining };
  }, [blockHeight, heightValid]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          Seconds from the first block of the period to the latest block
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="numeric" value={epochSeconds} onChange={(e) => setEpochSeconds(e.target.value)} />
          <small>The full-period time (projected when fewer than 2016 blocks are mined) is clamped into 302,400 to 4,838,400 seconds, the Core 4x bounds.</small>
        </label>
        <label>
          Current nBits (compact target, hex)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="text" aria-invalid={!nBitsValid} value={nBitsRaw} onChange={(e) => setNBitsRaw(e.target.value.trim().toLowerCase())} />
          <small role="status">{nBitsValid ? "" : "Enter a mainnet nBits in hex, like 0x1d00ffff. Zero, a negative value (sign bit 0x00800000), an overflow or a target above powLimit is not valid."}</small>
        </label>
        <label>
          Current block height (the latest mined block)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} />
          <small role="status">{heightValid ? "Retarget happens every 2,016 blocks." : "Enter a whole block height from 0 to 2,000,000."}</small>
        </label>
        <label>
          Blocks mined in this period so far (2 to 2016)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="numeric" value={blocksMined} onChange={(e) => setBlocksMined(e.target.value)} />
          <small>2016 means the period is complete. With fewer blocks the page projects the full period over 2015 intervals.</small>
        </label>
        <label>
          Your average block interval, seconds
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="numeric" value={intervalSeconds} onChange={(e) => setIntervalSeconds(e.target.value)} />
          <small>Used only for the implied hashrate row.</small>
        </label>
      </div>

      <p role="status" className="empty:sr-only">{nBitsValid && epoch <= 0 ? "Enter the seconds as a whole number above 0 and the blocks mined as a whole number from 2 to 2016." : ""}</p>

      {heightValid && blocksCount >= 2 && blocksCount <= 2016 && blockInPeriod !== blocksCount && <p role="status">Block {blockHeight.toLocaleString("en-US")} is block {blockInPeriod.toLocaleString("en-US")} of its 2016-block period, but the blocks mined input is {blocksCount.toLocaleString("en-US")}. Enter both values from the same period.</p>}

      {result && (
        <div className="overflow-x-auto scroll-mt-20" tabIndex={0} role="region" aria-label="Retarget result table"><table className="w-full border-collapse text-left font-mono text-sm">
          <tbody>
            <tr><th scope="row">Measured timespan used (after clamp)</th><td>{clampedEpoch.toLocaleString("en-US")} s{clampedEpoch !== epoch ? ` (input ${epoch.toLocaleString("en-US")} s)` : ""}</td></tr>
            {blocksCount < 2016 && <tr><th scope="row">Timespan source</th><td>projected from {blocksCount.toLocaleString("en-US")} blocks ({(blocksCount - 1).toLocaleString("en-US")} {blocksCount === 2 ? "interval" : "intervals"}) to 2015 intervals</td></tr>}
            <tr><th scope="row">Timespan ratio actual / 1,209,600 s</th><td>{result.ratio.toFixed(4)}{result.clamped ? " (clamped)" : ""}</td></tr>
            <tr><th scope="row">Current target (256-bit, hex)</th><td className="break-all">{result.target !== null ? `0x${result.target.toString(16).padStart(64, "0")}` : "invalid nBits"}</td></tr>
            <tr><th scope="row">Next nBits (compact)</th><td>0x{result.next.toString(16).padStart(8, "0")}</td></tr>
            <tr><th scope="row">Target after retarget (256-bit, hex)</th><td className="break-all">{result.newTarget !== null ? `0x${result.newTarget.toString(16).padStart(64, "0")}` : "invalid nBits"}</td></tr>
            <tr><th scope="row">Difficulty now</th><td>{fmt(result.oldDiff, 6)}</td></tr>
            <tr><th scope="row">Difficulty after retarget</th><td>{fmt(result.newDiff, 6)}</td></tr>
            <tr><th scope="row">Difficulty change</th><td>{pct(result.changePct)}</td></tr>
            <tr><th scope="row">Expected hashes per block now (GetBitsProof)</th><td>{result.hashes.toLocaleString("en-US")}</td></tr>
            <tr><th scope="row">Expected hashes per block after retarget (GetBitsProof)</th><td>{result.newHashes.toLocaleString("en-US")}</td></tr>
            <tr><th scope="row">Implied network hashrate at your interval</th><td>{hashrate !== null ? `${hashrate.toLocaleString("en-US")} H/s` : "enter a whole number of seconds from 1 to 4,838,400"}</td></tr>
            {boundary && (
              <>
                <tr><th scope="row">Next retarget boundary block</th><td>{boundary.nextHeight.toLocaleString("en-US")}</td></tr>
                <tr><th scope="row">Blocks until retarget</th><td>{boundary.remaining.toLocaleString("en-US")}</td></tr>
              </>
            )}
          </tbody>
        </table></div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          Target to nBits (256-bit target, hex)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber scroll-mt-20" inputMode="text" value={targetRaw} onChange={(e) => setTargetRaw(e.target.value.trim().toLowerCase())} />
          <small className="[overflow-wrap:anywhere]">{targetNBits !== null && targetDecoded !== null ? `nBits 0x${targetNBits.toString(16).padStart(8, "0")}, difficulty ${fmt(difficultyFromNBits(targetNBits), 6)}. GetCompact keeps only the top 3 bytes of the target (the top 2 if the first of them is 0x80 or more), so this nBits decodes to 0x${targetDecoded.toString(16).padStart(64, "0")}.` : "Enter a target in hex from 0x1 up to powLimit 0x00000000ffff...ffff."}</small>
        </label>
      </div>

      <p>The default inputs are the get_next_work vector from src/test/pow_tests.cpp: a period of 1,022,578 seconds (15.46% less than two weeks) starting from nBits 0x1d00ffff produces 0x1d00d86a, and block 32255 is the last block of that period.</p>
      <p>
        Difficulty of 1 means the maximum target (powLimit, nBits 0x1d00ffff). GetBitsProof gives
        4,295,032,833 expected hashes per block for it, which is close to but not equal to 2<sup>32</sup>.
        The page computes 2<sup>256</sup> / (target + 1) with integers for every valid nBits.
      </p>
    </div>
  );
}

function boundedNumber(raw: string, max: number): number {
  const trimmed = String(raw ?? "").trim();
  if (!/^\d{1,12}$/.test(trimmed)) return 0;
  const parsed = Number(trimmed);
  if (Number.isFinite(parsed) === false || parsed < 0) return 0;
  return Math.min(parsed, max);
}
