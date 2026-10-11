// Bitcoin halving schedule math. Pure functions, no network calls.
//
// Rule (Bitcoin Core src/validation.cpp, GetBlockSubsidy, fetched 2026-10-11):
//   halvings = nHeight / nSubsidyHalvingInterval; if (halvings >= 64) return 0;
//   nSubsidy = 50 * COIN; nSubsidy >>= halvings;
// nSubsidyHalvingInterval = 210000 and nPowTargetSpacing = 10 * 60 (src/kernel/chainparams.cpp).
// COIN = 100'000'000 (src/consensus/amount.h).
// All satoshi values are integers. The right shift uses BigInt, so no float touches a satoshi value.

export const HALVING_INTERVAL = 210_000;
export const SATS_PER_BTC = 100_000_000;
export const INITIAL_SUBSIDY_SATS = 50 * SATS_PER_BTC;
export const TARGET_SPACING_SECONDS = 600;
/** Highest height that the calculator accepts: the start of era 64. */
export const MAX_INPUT_HEIGHT = HALVING_INTERVAL * 64;
/** Sum of all block subsidies. Computed by issuedThroughSats(); the test checks it. */
export const TOTAL_SCHEDULE_SATS = 2_099_999_997_690_000;

/** Block header timestamps from mempool.space, fetched 2026-10-11. */
export const GENESIS_BLOCK = { height: 0, timeUtc: "2009-01-03T18:15:05Z" } as const;
export const PAST_HALVINGS = [
  { number: 1, height: 210_000, timeUtc: "2012-11-28T15:24:38Z", hash: "000000000000048b95347e83192f69cf0366076336c639f9b7228e9ba171342e" },
  { number: 2, height: 420_000, timeUtc: "2016-07-09T16:46:13Z", hash: "000000000000000002cce816c0ab2c5c269cb081896b7dcb34b8422d6b74ffa1" },
  { number: 3, height: 630_000, timeUtc: "2020-05-11T19:23:43Z", hash: "000000000000000000024bead8df69990852c202db0e0097c1a12ea637d7e96d" },
  { number: 4, height: 840_000, timeUtc: "2024-04-20T00:09:27Z", hash: "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5" },
] as const;

/** Anchor for the one future estimate: block 970,858 and its header timestamp (mempool.space, fetched 2026-10-11). */
export const ANCHOR_BLOCK = {
  height: 970_858,
  timeUtc: "2026-10-11T01:57:51Z",
  unix: 1_791_683_871,
  hash: "0000000000000000000140fcf0713f1c25e2fa497c5e5e8364507c012c13ed85",
} as const;

export function isHeight(height: number): boolean {
  return Number.isSafeInteger(height) && height >= 0;
}

export function eraOf(height: number): number {
  return Math.floor(height / HALVING_INTERVAL);
}

/** Block subsidy in satoshis at a height, as GetBlockSubsidy computes it. */
export function subsidySatsAt(height: number): number {
  if (!isHeight(height)) return 0;
  return subsidySatsForEra(eraOf(height));
}

export function subsidySatsForEra(era: number): number {
  if (!Number.isInteger(era) || era < 0 || era >= 64) return 0;
  return Number(BigInt(INITIAL_SUBSIDY_SATS) >> BigInt(era));
}

/** First height of the era where the subsidy is zero (era 33). */
export const ZERO_SUBSIDY_HEIGHT = (() => {
  let era = 0;
  while (subsidySatsForEra(era) > 0) era += 1;
  return era * HALVING_INTERVAL;
})();

/** Next height where the subsidy changes. Null when the subsidy is already zero. */
export function nextHalvingHeight(height: number): number | null {
  if (!isHeight(height) || height >= ZERO_SUBSIDY_HEIGHT) return null;
  return (eraOf(height) + 1) * HALVING_INTERVAL;
}

/** Supply issued by schedule up to height h: the sum of subsidies for heights 0 to h, with h included. */
export function issuedThroughSats(height: number): number {
  if (!isHeight(height)) return 0;
  const era = eraOf(height);
  let total = 0;
  for (let e = 0; e < era && e < 64; e += 1) total += subsidySatsForEra(e) * HALVING_INTERVAL;
  return total + subsidySatsForEra(era) * (height - era * HALVING_INTERVAL + 1);
}

export interface EraRow {
  readonly era: number;
  readonly startHeight: number;
  readonly subsidySats: number;
  readonly eraIssueSats: number;
  readonly cumulativeEndSats: number;
}

/** Eras 0 to 33. Era 33 is the first era with a zero subsidy. */
export function eraRows(): EraRow[] {
  const rows: EraRow[] = [];
  let cumulative = 0;
  const lastEra = ZERO_SUBSIDY_HEIGHT / HALVING_INTERVAL;
  for (let era = 0; era <= lastEra; era += 1) {
    const subsidySats = subsidySatsForEra(era);
    const eraIssueSats = subsidySats * HALVING_INTERVAL;
    cumulative += eraIssueSats;
    rows.push({ era, startHeight: era * HALVING_INTERVAL, subsidySats, eraIssueSats, cumulativeEndSats: cumulative });
  }
  return rows;
}

/** Exact BTC text with 8 decimals and thousands separators, from integer satoshis. */
export function formatBtc(sats: number): string {
  if (!Number.isSafeInteger(sats) || sats < 0) return "0.00000000";
  const whole = Math.floor(sats / SATS_PER_BTC);
  const frac = String(sats % SATS_PER_BTC).padStart(8, "0");
  return `${whole.toLocaleString("en-US")}.${frac}`;
}

export function formatInt(value: number): string {
  return Math.trunc(value).toLocaleString("en-US");
}

/** Estimate for a future height: 600 seconds per block from the anchor block timestamp. */
export function estimateUtc(height: number): string {
  const unix = ANCHOR_BLOCK.unix + (height - ANCHOR_BLOCK.height) * TARGET_SPACING_SECONDS;
  return new Date(unix * 1000).toISOString().replace(".000Z", "Z");
}

/** Days between two UTC timestamps, one decimal. */
export function daysBetween(fromUtc: string, toUtc: string): string {
  const days = (Date.parse(toUtc) - Date.parse(fromUtc)) / 86_400_000;
  return days.toFixed(1);
}

export type ParsedHeight =
  | { readonly ok: true; readonly height: number }
  | { readonly ok: false; readonly message: string };

/** Parse user text. Spaces and thousands commas are removed. Only whole numbers from 0 to MAX_INPUT_HEIGHT pass. */
export function parseHeight(raw: string): ParsedHeight {
  const cleaned = raw.replace(/[\s,]/g, "");
  if (cleaned === "") return { ok: false, message: "Enter a block height." };
  if (!/^\d+$/.test(cleaned)) return { ok: false, message: "Enter a whole number with digits only (0 or more)." };
  const height = Number(cleaned);
  if (!Number.isSafeInteger(height) || height > MAX_INPUT_HEIGHT) {
    return { ok: false, message: `Enter a height from 0 to ${formatInt(MAX_INPUT_HEIGHT)}.` };
  }
  return { ok: true, height };
}
