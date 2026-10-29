import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MIN_RELAY_TX_FEE_SAT_PER_KVB,
  DUST_RELAY_TX_FEE_SAT_PER_KVB,
  dustThresholdSats,
  feeRateSatsPerVbyte,
  feeSats,
  feeUsd,
  INPUT_SIZES,
  MAX_BLOCK_WEIGHT,
  MAX_STANDARD_TX_WEIGHT,
  OUTPUT_SIZES,
  parseRate,
  satPerVbyteFromUsd,
  SIZE_PRESETS,
  txSize,
  txWeight,
  vsizeFromSizes,
  vsizeFromWeight,
  WITNESS_SCALE_FACTOR,
} from "../src/lib/bitcoin-tx-fee";

// Independent reference: BIP 141 weight rule with BigInt.
const refWeight = (base: number, total: number) => BigInt(base) * BigInt(3) + BigInt(total);

test("constants", () => {
  assert.equal(WITNESS_SCALE_FACTOR, 4);
  assert.equal(MAX_BLOCK_WEIGHT, 4_000_000);
  assert.equal(MAX_STANDARD_TX_WEIGHT, 400_000);
  assert.equal(DUST_RELAY_TX_FEE_SAT_PER_KVB, 3000);
});

test("weight: base*3 + total (uncapped per D9)", () => {
  for (const [base, total] of [[100, 100], [250, 600], [1_000_000, 1_000_000]] as const) {
    assert.equal(txWeight(base, total), Number(refWeight(base, total)));
  }
  assert.equal(txWeight(1_500_000, 1_500_000), 6_000_000); // uncapped
});

test("vsize = ceil(weight/4)", () => {
  assert.equal(vsizeFromWeight(562), 141); // 140.5 -> 141
  assert.equal(vsizeFromWeight(616), 154); // taproot key path spend
  assert.equal(vsizeFromSizes(60, 205), 97); // ceil((60*3+205)/4)
});

test("known spend sizes from the size table", () => {
  // 1 P2WPKH in / 2 P2WPKH out
  const s = txSize({ P2WPKH: 1 }, { P2WPKH: 2 });
  assert.equal(s.vsize, 141);
  assert.equal(s.weight, 562);
  // 1 P2TR in / 2 P2TR out
  const t = txSize({ P2TR: 1 }, { P2TR: 2 });
  assert.equal(t.vsize, 154);
  assert.equal(t.weight, 616);
  // 1 legacy in / 2 legacy out
  const l = txSize({ P2PKH: 1 }, { P2PKH: 2 });
  assert.equal(l.vsize, 226);
});

test("dust limits: 546 legacy (148 vB spend), 294 segwit (67 vB spend) at default relay policy", () => {
  assert.equal(DUST_RELAY_TX_FEE_SAT_PER_KVB, 3000);
  assert.equal(dustThresholdSats("P2PKH"), 546); // 3000 * (34+148) / 1000
  assert.equal(dustThresholdSats("P2SH"), 540); // not a witness program: 3000 * (32+148)/1000
  assert.equal(dustThresholdSats("P2WPKH"), 294); // 3000 * (31+67)/1000
  assert.equal(dustThresholdSats("P2TR"), 330); // 3000 * (43+67)/1000
  assert.equal(feeSats(2.1, 141), 297); // CFeeRate rounding: floor((2.1*1000*141+999)/1000)
});

test("fee rounding matches CFeeRate::GetFee (round up to whole sat)", () => {
  assert.equal(feeSats(20, 141), 2820);
  assert.equal(feeSats(1.2, 141), 170); // 1.2*141 = 169.2 -> 170
  assert.equal(feeSats(0.1, 141), 15); // 14.1 -> 15
});

test("round trip feeRate <-> feeSats", () => {
  for (const [rate, vs] of [[20, 141], [5, 226], [100, 154]] as const) {
    const sats = feeSats(rate, vs);
    assert.ok(feeRateSatsPerVbyte(sats, vs) <= rate + 0.01);
  }
});

test("usd conversions", () => {
  const BTC_USD = 80114;
  assert.equal(feeUsd(2820, BTC_USD), (2820 / 100_000_000) * BTC_USD);
  const back = satPerVbyteFromUsd(1.0, 141, BTC_USD);
  assert.equal(back, 8.851); // floor(1e8 / 80114) = 1248 sats; floor(1248000 / 141) / 1000
});

test("size presets match the txSize computation", () => {
  assert.equal(SIZE_PRESETS[0].vsize, 226);
  assert.equal(SIZE_PRESETS[1].vsize, 141);
  assert.equal(SIZE_PRESETS[2].vsize, 154);
  assert.equal(INPUT_SIZES.P2PKH.base, 148);
  assert.equal(OUTPUT_SIZES.P2PKH, 34);
  assert.equal(OUTPUT_SIZES.P2TR, 43);
});

test("r2 vectors", () => {
  assert.equal(txSize({ "P2SH-P2WPKH": 1 }, { P2SH: 2 }).vsize, 166);
  assert.equal(txSize({ P2PKH: 1, P2WPKH: 1 }, { P2TR: 1, P2WPKH: 1 }).weight, 1203);
  assert.equal(txSize({ P2WPKH: 253 }, { P2WPKH: 1 }).vsize, 17248);
  assert.equal(txSize({ P2TR: 3 }, { P2TR: 1 }).vsize, 226);
  assert.equal(feeSats(1_000_000_000, 1_480_046), 1_480_046_000_000_000);
  assert.equal(parseRate("0.0004"), null);
  assert.equal(feeSats(0.001, 141), 1);
  assert.equal(satPerVbyteFromUsd(1, 141, 80114), 8.851);
  assert.equal(txWeight(1_500_000, 1_500_000), 6_000_000);
});

// Final audit vectors. Expected values come from a separate byte-level Python build of each
// serialized transaction (placeholder bytes, 72-byte ECDSA signature, 33-byte key, 64-byte Schnorr).
test("final vectors", () => {
  assert.equal(DEFAULT_MIN_RELAY_TX_FEE_SAT_PER_KVB, 100);
  assert.deepEqual(txSize({ P2PKH: 2, P2TR: 1 }, { P2WPKH: 1, P2SH: 1 }), { baseSize: 410, totalSize: 480, weight: 1710, vsize: 428 });
  assert.deepEqual(txSize({ "P2SH-P2WPKH": 2, P2TR: 5 }, { P2PKH: 3, P2TR: 2 }), { baseSize: 531, totalSize: 1079, weight: 2672, vsize: 668 });
  assert.deepEqual(txSize({ P2PKH: 10000 }, { P2PKH: 1 }), { baseSize: 1480046, totalSize: 1480046, weight: 5920184, vsize: 1480046 });
  assert.equal(txSize({ P2TR: 2700 }, { P2TR: 1 }).weight, 621222);
  assert.equal(txSize({ P2WPKH: 1 }, { P2WPKH: 253 }).vsize, 7924);
  assert.equal(feeSats(7.777, 2345), 18238);
  assert.equal(satPerVbyteFromUsd(1, 141, 80154), 8.843); // floor(1e8 / 80154) = 1247 sats
  assert.equal(feeSats(8.843, 141), 1247);
  assert.equal(satPerVbyteFromUsd(0.0004, 141, 80154), 0);
});
