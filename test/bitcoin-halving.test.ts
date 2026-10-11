import assert from "node:assert/strict";
import test from "node:test";
import {
  ANCHOR_BLOCK,
  daysBetween,
  eraOf,
  eraRows,
  estimateUtc,
  formatBtc,
  GENESIS_BLOCK,
  HALVING_INTERVAL,
  issuedThroughSats,
  MAX_INPUT_HEIGHT,
  nextHalvingHeight,
  parseHeight,
  PAST_HALVINGS,
  subsidySatsAt,
  TOTAL_SCHEDULE_SATS,
  ZERO_SUBSIDY_HEIGHT,
} from "../src/lib/bitcoin-halving";

// Independent reference: the GetBlockSubsidy rule with BigInt.
const ref = (h: number) => {
  const n = Math.floor(h / 210_000);
  return n >= 64 ? BigInt(0) : (BigInt(50) * BigInt(100_000_000)) >> BigInt(n);
};

test("subsidy matches GetBlockSubsidy at era boundaries", () => {
  for (const h of [0, 209_999, 210_000, 839_999, 840_000, 1_049_999, 1_050_000, 6_719_999, 6_720_000, 6_929_999, 6_930_000, 13_439_999, 13_440_000]) {
    assert.equal(BigInt(subsidySatsAt(h)), ref(h), `height ${h}`);
  }
  assert.equal(subsidySatsAt(0), 5_000_000_000);
  assert.equal(subsidySatsAt(840_000), 312_500_000);
  assert.equal(subsidySatsAt(6_720_000), 1);
  assert.equal(subsidySatsAt(6_930_000), 0);
  assert.equal(subsidySatsAt(2_100_000), 4_882_812);
});

test("era table eras 0 to 33", () => {
  const rows = eraRows();
  assert.equal(rows.length, 34);
  assert.equal(rows[0].eraIssueSats, 1_050_000_000_000_000);
  assert.equal(rows[3].cumulativeEndSats, 1_968_750_000_000_000);
  assert.equal(rows[4].cumulativeEndSats, 2_034_375_000_000_000);
  assert.equal(rows[32].startHeight, 6_720_000);
  assert.equal(rows[33].startHeight, 6_930_000);
  assert.equal(rows[33].subsidySats, 0);
  assert.equal(rows[33].cumulativeEndSats, TOTAL_SCHEDULE_SATS);
  assert.equal(ZERO_SUBSIDY_HEIGHT, 6_930_000);
});

test("total schedule is 2,099,999,997,690,000 sats", () => {
  assert.equal(issuedThroughSats(MAX_INPUT_HEIGHT), 2_099_999_997_690_000);
  assert.equal(TOTAL_SCHEDULE_SATS, 2_099_999_997_690_000);
  assert.equal(formatBtc(TOTAL_SCHEDULE_SATS), "20,999,999.97690000");
});

test("supply issued up to h includes height h", () => {
  assert.equal(issuedThroughSats(0), 5_000_000_000);
  assert.equal(issuedThroughSats(1), 10_000_000_000);
  assert.equal(issuedThroughSats(209_999), 1_050_000_000_000_000);
  assert.equal(issuedThroughSats(210_000), 1_050_002_500_000_000);
  assert.equal(issuedThroughSats(970_858), 2_009_643_437_500_000);
  assert.equal(issuedThroughSats(1_049_999), 2_034_375_000_000_000);
  assert.equal(issuedThroughSats(6_929_999), TOTAL_SCHEDULE_SATS);
});

test("next halving", () => {
  assert.equal(nextHalvingHeight(970_858), 1_050_000);
  assert.equal(nextHalvingHeight(1_049_999), 1_050_000);
  assert.equal(nextHalvingHeight(1_050_000), 1_260_000);
  assert.equal(nextHalvingHeight(6_929_999), 6_930_000);
  assert.equal(nextHalvingHeight(6_930_000), null);
  assert.equal(eraOf(970_858), 4);
});

test("past halving timestamps and the estimate", () => {
  assert.deepEqual(PAST_HALVINGS.map((r) => r.timeUtc), ["2012-11-28T15:24:38Z", "2016-07-09T16:46:13Z", "2020-05-11T19:23:43Z", "2024-04-20T00:09:27Z"]);
  assert.deepEqual(PAST_HALVINGS.map((r) => r.height), [1, 2, 3, 4].map((n) => n * HALVING_INTERVAL));
  assert.equal(Date.parse(ANCHOR_BLOCK.timeUtc) / 1000, ANCHOR_BLOCK.unix);
  assert.equal(estimateUtc(1_050_000), "2028-04-12T16:17:51Z");
  assert.equal(daysBetween(GENESIS_BLOCK.timeUtc, PAST_HALVINGS[0].timeUtc), "1424.9");
});

test("input parsing", () => {
  assert.deepEqual(parseHeight("970858"), { ok: true, height: 970_858 });
  assert.deepEqual(parseHeight(" 1,050,000 "), { ok: true, height: 1_050_000 });
  assert.deepEqual(parseHeight("0"), { ok: true, height: 0 });
  for (const bad of ["", "   ", "abc", "-5", "-0", "1.5", "1e12", "1000000001", "13440001", "Infinity", "NaN"]) {
    assert.equal(parseHeight(bad).ok, false, bad);
  }
  assert.deepEqual(parseHeight("13440000"), { ok: true, height: 13_440_000 });
});
