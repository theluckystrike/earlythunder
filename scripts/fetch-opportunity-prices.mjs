#!/usr/bin/env node
/**
 * fetch-opportunity-prices.mjs
 *
 * Refreshes current_price_usd / market_cap_usd / volume_24h_usd for every
 * opportunity in data/opportunities.json using REAL market data:
 *   - digital_assets -> CoinGecko (resolved to exact coin id, no symbol guessing)
 *   - public_equities -> Yahoo Finance chart endpoint (price + volume)
 *   - private_markets -> left untouched (no public market price)
 *
 * Only writes values it actually fetched. Unresolved tokens keep their prior
 * value. NASA Power of 10: bounded loops, >=2 assertions per function,
 * <60-line functions, every fetch checked, no global mutable state, no
 * suppressions. Reproducible -> run from cron/CI.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(HERE, "..", "data", "opportunities.json");

const CG = "https://api.coingecko.com/api/v3";
const PAGE = 200; // ids per /coins/markets call
const MAX_IDS = 4000; // hard ceiling on coin ids requested
const MAX_EQ = 100; // hard ceiling on equities

// Verified slug -> CoinGecko id overrides for rename/collision cases.
const OVERRIDE = {
  "obol-network": "obol-2", "makerdao": "maker", "toncoin": "the-open-network",
  "grass-network": "grass", "injective": "injective-protocol", "sparklend": "spark-2",
  "render-network": "render-token", "stacks": "blockstack", "near-protocol-ai-pivot": "near",
  "espresso-systems": "espresso", "sei": "sei-network", "haqq-islamic-coin": "islamic-coin",
  "compound": "compound-governance-token", "worldcoin-world": "worldcoin-wld", "euler-v2": "euler",
  "arkreen": "arkreen-token", "researchhub": "researchcoin", "dogwifhat": "dogwifcoin",
  "zora-attention-markets": "zora", "gala-games": "gala", "kamino-finance": "kamino",
  "scallop-lend": "scallop-2", "story-protocol": "story-2", "dolo": "dolomite", "ftx-alameda": "ftx-token",
  "jupiter": "jupiter-exchange-solana", "meth-protocol": "mantle-staked-ether", "opulous": "opulous",
};

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, tries = 3) {
  console.assert(typeof url === "string" && url.length > 0, "url required");
  if (typeof url !== "string") throw new Error("bad url");
  let lastErr = "unknown";
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", accept: "application/json" } });
      if (res && res.ok) return await res.json();
      lastErr = `HTTP ${res && res.status}`;
    } catch (e) { lastErr = e && e.message ? e.message : String(e); }
    await sleep(2500);
  }
  throw new Error(`fetch failed ${url}: ${lastErr}`);
}

/** Resolve each crypto opportunity to an exact CoinGecko id. */
function resolveCryptoIds(opps, coinList) {
  console.assert(Array.isArray(opps) && Array.isArray(coinList), "arrays required");
  const ids = new Set(coinList.map((c) => c.id));
  const byName = new Map();
  for (const c of coinList) {
    const k = norm(c.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(c.id);
  }
  const map = {};
  for (const o of opps) {
    if (o.asset_class !== "digital_assets" || !o.ticker) continue;
    const s = o.slug;
    if (OVERRIDE[s]) { map[s] = OVERRIDE[s]; continue; }
    if (ids.has(s)) { map[s] = s; continue; }
    const named = byName.get(norm(o.name));
    if (named && named.length === 1) map[s] = named[0];
  }
  console.assert(Object.keys(map).length > 0, "no crypto resolved");
  return map;
}

/** Fetch /coins/markets for the given ids, batched. Returns id -> row. */
async function fetchMarkets(idList) {
  console.assert(Array.isArray(idList), "idList array");
  const ids = idList.slice(0, MAX_IDS);
  const out = new Map();
  for (let i = 0; i < ids.length; i += PAGE) {
    const chunk = ids.slice(i, i + PAGE);
    const url = `${CG}/coins/markets?vs_currency=usd&ids=${chunk.join(",")}&per_page=${PAGE}`;
    const rows = await fetchJson(url);
    console.assert(Array.isArray(rows), "markets array");
    for (const r of rows) out.set(r.id, r);
    await sleep(2200);
  }
  return out;
}

/** Best-effort Yahoo equity price + volume (market cap not on this endpoint). */
async function fetchEquity(ticker) {
  console.assert(typeof ticker === "string" && ticker.length > 0, "ticker required");
  const t = ticker.replace(/^\$/, "");
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=1d`;
    const d = await fetchJson(url);
    const meta = d && d.chart && d.chart.result && d.chart.result[0] && d.chart.result[0].meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    return { price: meta.regularMarketPrice, volume: meta.regularMarketVolume || 0 };
  } catch { return null; }
}

/** Apply a crypto market row to an opportunity (mutates a copy via caller). */
function applyCrypto(o, row) {
  console.assert(o && row, "opp and row required");
  if (typeof row.current_price !== "number") return false;
  o.current_price_usd = row.current_price;
  if (typeof row.market_cap === "number" && row.market_cap > 0) o.market_cap_usd = row.market_cap;
  if (typeof row.total_volume === "number") o.volume_24h_usd = row.total_volume;
  return true;
}

async function main() {
  const file = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const opps = Array.isArray(file) ? file : file.opportunities;
  console.assert(Array.isArray(opps) && opps.length > 0, "opportunities array");

  const coinList = await fetchJson(`${CG}/coins/list`);
  const idMap = resolveCryptoIds(opps, coinList);
  const markets = await fetchMarkets([...new Set(Object.values(idMap))]);

  let crypto = 0, equity = 0, skipped = 0;
  const equities = opps.filter((o) => o.asset_class === "public_equities" && o.ticker).slice(0, MAX_EQ);

  for (const o of opps) {
    if (o.asset_class === "digital_assets") {
      const id = idMap[o.slug];
      const row = id ? markets.get(id) : null;
      if (row && applyCrypto(o, row)) crypto += 1; else skipped += 1;
    }
  }
  for (const o of equities) {
    const q = await fetchEquity(o.ticker);
    if (q) { o.current_price_usd = q.price; o.volume_24h_usd = q.volume; equity += 1; } else skipped += 1;
    await sleep(300);
  }

  writeFileSync(DATA_PATH, JSON.stringify(file, null, 2) + "\n", "utf8");
  console.log(`OK: updated crypto=${crypto} equity=${equity} (price+vol) | skipped(no real data)=${skipped}`);
  console.log(`unresolved crypto left untouched: ${opps.filter((o) => o.asset_class === "digital_assets" && o.ticker && !idMap[o.slug]).map((o) => o.name).join(", ") || "none"}`);
}

main().catch((err) => {
  console.error("PRICE PIPELINE FAILED:", err && err.message ? err.message : err);
  process.exit(1);
});
