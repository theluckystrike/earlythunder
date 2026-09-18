// Fetch daily BTC/USD readings for the trailing 365-day window.
//
// Primary series: CoinGecko market_chart (interval=daily). Each returned point is stamped
// 00:00 UTC, i.e. it is the price at the START of that UTC day.
// Cross-check series: Kraken OHLC XBTUSD, interval=1440 (one candle per UTC day), whose
// opening trade is the price at the START of the same UTC day. Comparing start-to-start
// is the like-for-like pairing; comparing a start-of-day CoinGecko point against a
// end-of-day Kraken close is a 24h offset and produces false disagreements.
//
// Any day whose relative gap |cg - kraken| / cg exceeds 1% is dropped and disclosed.
//
// Output: data/btc-daily-365.json
// Run: node scripts/fetch-btc-daily-365.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "data", "btc-daily-365.json");

const CG_NAME = "CoinGecko";
const CG_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily";
const KRAKEN_NAME = "Kraken";
const KRAKEN_URL = "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440";

const TOLERANCE = 0.01; // 1% relative cross-check tolerance
const HEADERS = { accept: "application/json", "user-agent": "earlythunder-research/1.0 (+https://earlythunder.com)" };

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const stampOf = (ms) => new Date(ms).toISOString().slice(11, 16);

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

const cgPayload = await getJson(CG_URL);
const krakenPayload = await getJson(KRAKEN_URL);

if (!Array.isArray(cgPayload.prices) || !Array.isArray(krakenPayload?.result?.XXBTZUSD)) {
  throw new Error("unexpected payload shape from CoinGecko or Kraken");
}

// Keep only the midnight-stamped points; the trailing element is a live intraday quote.
const cgDaily = cgPayload.prices
  .map(([ms, usd]) => ({ date: dayOf(ms), stamp: stampOf(ms), usd: Number(usd) }))
  .filter((row) => row.stamp.startsWith("00:"))
  .filter((row) => Number.isFinite(row.usd) && row.usd > 0);

const cgByDate = new Map(cgDaily.map((row) => [row.date, row.usd]));

// Kraken: one candle per UTC day; field 1 is the open (price at the start of the day).
const krakenByDate = new Map();
for (const candle of krakenPayload.result.XXBTZUSD) {
  const date = dayOf(Number(candle[0]) * 1000);
  const open = Number(candle[1]);
  if (Number.isFinite(open) && open > 0) krakenByDate.set(date, open);
}

const windowDates = [...new Set(cgDaily.map((row) => row.date))].sort();
const rows = [];
const dropped = [];
const crossCheck = [];

for (const date of windowDates) {
  const usd = cgByDate.get(date);
  const kraken = krakenByDate.get(date);
  if (!Number.isFinite(kraken)) {
    dropped.push({ date, reason: `no Kraken ${"XBTUSD"} daily candle published for this UTC day` });
    continue;
  }
  const relative = Math.abs(usd - kraken) / usd;
  crossCheck.push({ date, primary: Number(usd.toFixed(2)), cross: Number(kraken.toFixed(2)), relative });
  if (relative > TOLERANCE) {
    dropped.push({
      date,
      reason: `cross-check disagreement ${(relative * 100).toFixed(2)}% between ${CG_NAME} ($${usd.toFixed(2)}) and ${KRAKEN_NAME} ($${kraken.toFixed(2)})`,
    });
    continue;
  }
  rows.push({ date, usd: Number(usd.toFixed(2)) });
}

rows.sort((a, b) => a.date.localeCompare(b.date));
dropped.sort((a, b) => a.date.localeCompare(b.date));

const crossChecked = crossCheck.filter((c) => c.relative <= TOLERANCE);
const maxRelative = crossChecked.reduce((max, c) => (c.relative > max ? c.relative : max), 0);

const payload = {
  id: "btc-daily-365",
  title: "Bitcoin daily USD readings, trailing 365-day window",
  fetched_at: new Date().toISOString(),
  window: { days: 365, start: rows[0].date, end: rows[rows.length - 1].date },
  primary: { name: CG_NAME, url: CG_URL, field: "market_chart price at 00:00 UTC" },
  cross_check: {
    name: KRAKEN_NAME,
    url: KRAKEN_URL,
    field: "XBTUSD 1440-minute candle open (price at 00:00 UTC)",
    tolerance_percent: TOLERANCE * 100,
    max_observed_percent: Number((maxRelative * 100).toFixed(2)),
    matched: crossChecked.length,
  },
  rows,
  dropped,
  counts: { window: windowDates.length, published: rows.length, dropped: dropped.length },
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");

console.log(
  `wrote ${OUT}\nwindow=${payload.counts.window} published=${payload.counts.published} dropped=${payload.counts.dropped} ` +
    `maxRel=${payload.cross_check.max_observed_percent}% fetched_at=${payload.fetched_at}`,
);
if (dropped.length) console.log("dropped:", JSON.stringify(dropped));
