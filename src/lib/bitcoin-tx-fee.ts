// Bitcoin transaction fee math.
// References (fetched 2026-10-29):
// - BIP 141: transaction weight = base size * 3 + total size;
//   virtual size = weight / 4 rounded up to the next integer (vbyte).
//   Block weight <= 4,000,000 is a block rule, not a transaction cap.
// - Bitcoin Core v32.1 src/policy/feerate.cpp: GetFee(vbytes) = EvaluateFeeUp(vbytes),
//   which is ceil(sat/kvB * vbytes / 1000) for a rate set in sat/kvB.
// - Bitcoin Core v32.1 src/policy/policy.cpp GetDustThreshold: dustRelayFee.GetFee(output size
//   + spend size), spend size 148 bytes, or 67 for a witness program.
// - Bitcoin Core v32.1 src/policy/policy.h: DUST_RELAY_TX_FEE = 3000, DEFAULT_MIN_RELAY_TX_FEE = 100
//   (sat/kvB), MAX_STANDARD_TX_WEIGHT = 400,000.

export const WITNESS_SCALE_FACTOR = 4;
export const MAX_BLOCK_WEIGHT = 4_000_000;
export const DUST_RELAY_TX_FEE_SAT_PER_KVB = 3000;
export const DEFAULT_MIN_RELAY_TX_FEE_SAT_PER_KVB = 100;

/** Weight units of a transaction: base size * 3 + total size. */
export function txWeight(baseSizeBytes: number, totalSizeBytes: number): number {
  if (!Number.isFinite(baseSizeBytes) || !Number.isFinite(totalSizeBytes)) return 0;
  if (baseSizeBytes < 0 || totalSizeBytes < 0 || totalSizeBytes < baseSizeBytes) return 0;
  return baseSizeBytes * 3 + totalSizeBytes;
}

/** Virtual size in vbytes: ceil(weight / 4). */
export function vsizeFromWeight(weight: number): number {
  if (!Number.isFinite(weight) || weight < 0) return 0;
  return Math.ceil(weight / WITNESS_SCALE_FACTOR);
}

/** Convenience: vbytes straight from base and total sizes. */
export function vsizeFromSizes(baseSizeBytes: number, totalSizeBytes: number): number {
  return vsizeFromWeight(txWeight(baseSizeBytes, totalSizeBytes));
}

/** Fee in satoshis for a feerate in sat/vB over a vsize (Bitcoin Core round-up). */
export function feeSats(satPerVbyte: number, vsizeBytes: number): number {
  if (!Number.isFinite(satPerVbyte) || !Number.isFinite(vsizeBytes)) return 0;
  if (satPerVbyte < 0 || vsizeBytes < 0) return 0;
  const satPerKvb = Math.round(satPerVbyte * 1000); // CFeeRate keeps sat/kvB
  const vbytes = Math.ceil(vsizeBytes); // vsize is a whole number
  return Number((BigInt(satPerKvb) * BigInt(vbytes) + BigInt(999)) / BigInt(1000)); // GetFee -> EvaluateFeeUp rounds up, exact integer math
}

/** Inverse: sat/vB feerate a fixed fee implies over a vsize. */
export function feeRateSatsPerVbyte(feeSatsAmount: number, vsizeBytes: number): number {
  if (!Number.isFinite(feeSatsAmount) || !Number.isFinite(vsizeBytes) || vsizeBytes <= 0) return 0;
  if (feeSatsAmount < 0) return 0;
  return feeSatsAmount / vsizeBytes;
}

/**
 * Dust threshold in satoshis for an output, as in GetDustThreshold: the dust relay fee
 * over (output size + spend size). Spend size is 148 bytes, or 67 for a witness program.
 * At 3000 sat/kvB: P2PKH 546, P2SH 540, P2WPKH 294, P2TR 330.
 */
export function dustThresholdSats(output: OutputType, dustRelayFeeSatPerKvb: number = DUST_RELAY_TX_FEE_SAT_PER_KVB): number {
  const isWitnessProgram = output === "P2WPKH" || output === "P2TR";
  const spendInput = isWitnessProgram ? 32 + 4 + 1 + Math.floor(107 / WITNESS_SCALE_FACTOR) + 4 : 32 + 4 + 1 + 107 + 4;
  return Math.floor((dustRelayFeeSatPerKvb * (OUTPUT_SIZES[output] + spendInput) + 999) / 1000);
}

/** vsize of a 1-input, 2-output P2WPKH transaction (weight 562, 140.5 rounded up). */
export const SIMPLE_P2WPKH_VSIZE = 141;

/** USD cost of a fee given a BTC/USD price. */
export function feeUsd(feeSatsAmount: number, btcUsd: number): number {
  if (!Number.isFinite(feeSatsAmount) || !Number.isFinite(btcUsd) || btcUsd <= 0) return 0;
  if (feeSatsAmount < 0) return 0;
  return (feeSatsAmount / 100_000_000) * btcUsd;
}

/** sat/vB feerate a USD fee target implies. */
export function satPerVbyteFromUsd(usd: number, vsizeBytes: number, btcUsd: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(vsizeBytes) || !Number.isFinite(btcUsd)) return 0;
  if (usd < 0 || vsizeBytes <= 0 || btcUsd <= 0) return 0;
  const sats = Math.floor((usd / btcUsd) * 100_000_000); // whole sats inside the budget
  // round down to 0.001 sat/vB so the fee fits; integer division in BigInt is exact above 2^53
  return Number((BigInt(sats) * BigInt(1000)) / BigInt(Math.ceil(vsizeBytes))) / 1000;
}

export function parseRate(raw: string): number | null { const s = raw.trim(); if (!/^\d+(\.\d{1,3})?$/.test(s)) return null; const v = Number(s); return v > 0 && v <= 1_000_000_000 ? v : null; }

export const SIZE_PRESETS: ReadonlyArray<{ label: string; vsize: number; note: string }> = [
  { label: "Legacy P2PKH spend", vsize: 226, note: "1 P2PKH input, 2 P2PKH outputs. The input size depends on the signature length. This page uses a 107-byte scriptSig (2 push bytes, a 72-byte signature and a 33-byte key), the size in GetDustThreshold. A 71-byte signature gives 225 vB." },
  { label: "Segwit P2WPKH spend", vsize: 141, note: "1 P2WPKH input (72-byte signature), 2 P2WPKH outputs. Weight 562 WU, 140.5 vB rounded up." },
  { label: "Taproot P2TR spend", vsize: 154, note: "1 P2TR key-path input (64-byte signature), 2 P2TR outputs. Weight 616 WU." },
];

export type InputType = "P2PKH" | "P2SH-P2WPKH" | "P2WPKH" | "P2TR";
export type OutputType = "P2PKH" | "P2SH" | "P2WPKH" | "P2TR";
// base = 32 outpoint + 4 sequence + 1 scriptSig length + scriptSig. witness includes the item-count byte.
export const INPUT_SIZES: Record<InputType, { base: number; witness: number }> = {
  P2PKH: { base: 148, witness: 0 }, // scriptSig 107 = 1 + 72 signature + 1 + 33 key
  "P2SH-P2WPKH": { base: 64, witness: 108 }, // scriptSig 23; witness 1 + 1 + 72 + 1 + 33
  P2WPKH: { base: 41, witness: 108 },
  P2TR: { base: 41, witness: 66 }, // key path: 1 + 1 + 64 (SIGHASH_DEFAULT)
};
export const OUTPUT_SIZES: Record<OutputType, number> = { P2PKH: 34, P2SH: 32, P2WPKH: 31, P2TR: 43 };
export function compactSizeLen(n: number): number { return n < 253 ? 1 : n <= 0xffff ? 3 : 5; }
export function txSize(inputs: Partial<Record<InputType, number>>, outputs: Partial<Record<OutputType, number>>) {
  let nIn = 0, nOut = 0, base = 0, witness = 0, legacyIn = 0;
  for (const [t, c] of Object.entries(inputs) as [InputType, number][]) { nIn += c; base += INPUT_SIZES[t].base * c; witness += INPUT_SIZES[t].witness * c; if (INPUT_SIZES[t].witness === 0) legacyIn += c; }
  for (const [t, c] of Object.entries(outputs) as [OutputType, number][]) { nOut += c; base += OUTPUT_SIZES[t] * c; }
  base += 4 + 4 + compactSizeLen(nIn) + compactSizeLen(nOut);
  if (witness > 0) witness += 2 + legacyIn; // marker + flag, and one empty witness byte for each legacy input
  const totalSize = base + witness;
  const weight = base * 3 + totalSize;
  return { baseSize: base, totalSize, weight, vsize: Math.ceil(weight / WITNESS_SCALE_FACTOR) };
}

export const MAX_STANDARD_TX_WEIGHT = 400_000;
export function parseInput(raw: string, max: number): number | null { const s = raw.trim(); if (!/^\d+(\.\d+)?$/.test(s)) return null; const v = Number(s); return v > 0 && v <= max ? v : null; }
export function parseCount(raw: string, max: number): number | null { const s = raw.trim(); if (!/^\d+$/.test(s)) return null; const v = Number(s); return v <= max ? v : null; }
