#!/usr/bin/env node
/**
 * fetch-earnings.mjs — EarlyThunder real earnings-yield pipeline.
 *
 * Pulls REAL protocol revenue (DefiLlama fees/dailyRevenue) and REAL market
 * caps (DefiLlama /protocols), joins by slug, computes earnings yield
 * (annualized revenue / mcap), ranks, tiers, and injects the result into
 * public/earnings/index.html (between ET_DATA markers) + writes data.json.
 *
 * Reproducible (run via cron/CI) — this is a permanent data multiplier, not a
 * one-off. Authored to the NASA Power of 10 rules: bounded loops, >=2
 * assertions per function, <60-line functions, every return value checked,
 * no global mutable state, zero suppressions.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const HTML_PATH = join(REPO, "public", "earnings", "index.html");
const JSON_PATH = join(REPO, "public", "earnings", "data.json");

// ---- Tunable, audited constants (NASA Rule 2/3: explicit bounds) ----------
const FEES_URL =
  "https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyRevenue";
const PROTOCOLS_URL = "https://api.llama.fi/protocols";
const MCAP_FLOOR = 5_000_000; // ignore sub-$5M caps (illiquid / noise)
const REV30_FLOOR = 1_000; // ignore dust revenue
const MAX_YIELD = 2000; // drop absurd outliers (bad mcap data)
const TOP_N = 60; // hard cap on rendered rows
const SCAN_CAP = 12000; // hard upper bound on protocols scanned (full DefiLlama set ~7.7k)
const ANNUALIZE = 365 / 30; // 30d revenue -> annualized
const EXCLUDED_CATS = new Set(["CEX", "Chain"]); // not DeFi protocols

const START = "/*ET_DATA_START*/";
const END = "/*ET_DATA_END*/";

/** Fetch JSON with explicit success + shape checks. */
async function fetchJson(url) {
  console.assert(typeof url === "string" && url.length > 0, "url required");
  if (typeof url !== "string" || url.length === 0) throw new Error("bad url");
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res || !res.ok) throw new Error(`fetch failed ${url}: ${res && res.status}`);
  const data = await res.json();
  console.assert(data && typeof data === "object", "json object expected");
  if (!data || typeof data !== "object") throw new Error(`bad json ${url}`);
  return data;
}

/** Build slug -> {mcap, category, symbol} index from /protocols. */
function buildMcapIndex(protocols) {
  console.assert(Array.isArray(protocols), "protocols array required");
  if (!Array.isArray(protocols)) throw new Error("protocols not array");
  const index = new Map();
  const n = Math.min(protocols.length, SCAN_CAP);
  for (let i = 0; i < n; i += 1) {
    const p = protocols[i];
    if (!p || !p.slug || !p.mcap) continue;
    index.set(p.slug, {
      mcap: Number(p.mcap),
      category: p.category || "DeFi",
      symbol: p.symbol && p.symbol !== "-" ? String(p.symbol) : "",
    });
  }
  console.assert(index.size > 0, "mcap index empty");
  if (index.size === 0) throw new Error("no mcaps resolved");
  return index;
}

/** Tier label from yield percent (NASA Rule 1: no fallthrough). */
function tierFor(yieldPct) {
  console.assert(Number.isFinite(yieldPct), "yieldPct finite");
  if (!Number.isFinite(yieldPct)) throw new Error("bad yieldPct");
  if (yieldPct >= 20) return "HYPERLIQUID-GRADE";
  if (yieldPct >= 10) return "HIGH-YIELD";
  if (yieldPct >= 5) return "MODERATE";
  return "LOW";
}

/** Join fees with mcap index -> qualified records (bounded, pure). */
function computeRecords(fees, index) {
  console.assert(Array.isArray(fees), "fees array required");
  console.assert(index instanceof Map, "index map required");
  const out = [];
  const n = Math.min(fees.length, SCAN_CAP);
  for (let i = 0; i < n; i += 1) {
    const f = fees[i];
    if (!f || !f.slug) continue;
    const meta = index.get(f.slug);
    const rev30 = Number(f.total30d) || 0;
    if (!meta || meta.mcap < MCAP_FLOOR || rev30 < REV30_FLOOR) continue;
    if (EXCLUDED_CATS.has(meta.category)) continue;
    const annual = rev30 * ANNUALIZE;
    const yieldPct = (annual / meta.mcap) * 100;
    if (!Number.isFinite(yieldPct) || yieldPct > MAX_YIELD || yieldPct <= 0) continue;
    out.push({
      name: f.displayName || f.name || f.slug,
      symbol: meta.symbol,
      category: meta.category,
      tier: tierFor(yieldPct),
      // Field names match the existing render code (rowHtml/sortValue).
      earnings_yield_pct: Math.round(yieldPct * 100) / 100,
      annualized_revenue: Math.round(annual),
      mcap: Math.round(meta.mcap),
    });
  }
  console.assert(out.length > 0, "no records computed");
  if (out.length === 0) throw new Error("zero qualified records");
  return out;
}

/** Rank by yield desc, cap to TOP_N, assign 1-based rank. */
function rankAndCap(records) {
  console.assert(Array.isArray(records) && records.length > 0, "records required");
  const sorted = [...records].sort(
    (a, b) => b.earnings_yield_pct - a.earnings_yield_pct,
  );
  const top = sorted.slice(0, TOP_N).map((r, i) => ({ rank: i + 1, ...r }));
  console.assert(top.length > 0 && top.length <= TOP_N, "top within bounds");
  return top;
}

/** Tier breakdown counts (single pass, bounded by array length). */
function tierCounts(rows) {
  console.assert(Array.isArray(rows), "rows array required");
  const c = { total: rows.length, hyper: 0, high: 0, moderate: 0, low: 0 };
  for (let i = 0; i < rows.length; i += 1) {
    const t = rows[i].tier;
    if (t === "HYPERLIQUID-GRADE") c.hyper += 1;
    else if (t === "HIGH-YIELD") c.high += 1;
    else if (t === "MODERATE") c.moderate += 1;
    else c.low += 1;
  }
  console.assert(c.hyper + c.high + c.moderate + c.low === rows.length, "counts sum");
  return c;
}

/** Inject the data block into the HTML between markers (idempotent). */
function injectHtml(html, rows, meta) {
  console.assert(typeof html === "string" && html.includes(START), "START marker missing");
  console.assert(html.includes(END) && meta && Number.isFinite(meta.scanned), "END/meta required");
  const i = html.indexOf(START);
  const j = html.indexOf(END);
  if (i < 0 || j < 0 || j <= i) throw new Error("markers not found / out of order");
  const json = JSON.stringify(rows);
  const block =
    `${START}\n  var PROTOCOLS = ${json};\n` +
    `  var DATA_DATE = ${JSON.stringify(meta.date)};\n` +
    `  var DATA_SCANNED = ${meta.scanned};\n` +
    `  var DATA_QUALIFIED = ${meta.qualified};\n  ${END}`;
  const next = html.slice(0, i) + block + html.slice(j + END.length);
  console.assert(next.length > 0 && next.includes(json.slice(0, 24)), "injection failed");
  return next;
}

/** Refresh the JSON-LD dateModified value (SEO freshness), targeted + safe. */
function updateDateModified(html, isoDate) {
  console.assert(typeof html === "string", "html string required");
  console.assert(/^\d{4}-\d{2}-\d{2}$/.test(isoDate), "iso date required");
  const re = /("dateModified":\s*")\d{4}-\d{2}-\d{2}(")/;
  if (!re.test(html)) return html; // absent is acceptable, not an error
  return html.replace(re, `$1${isoDate}$2`);
}

async function main() {
  const [feesRaw, protocols] = await Promise.all([
    fetchJson(FEES_URL),
    fetchJson(PROTOCOLS_URL),
  ]);
  const fees = feesRaw.protocols;
  console.assert(Array.isArray(fees) && Array.isArray(protocols), "api shapes");
  if (!Array.isArray(fees)) throw new Error("fees.protocols missing");

  const index = buildMcapIndex(protocols);
  const records = computeRecords(fees, index);
  const rows = rankAndCap(records);
  const counts = tierCounts(rows);
  const isoDate = new Date().toISOString().slice(0, 10);
  const meta = { date: isoDate, scanned: fees.length, qualified: records.length };

  const html = readFileSync(HTML_PATH, "utf8");
  const injected = updateDateModified(injectHtml(html, rows, meta), isoDate);
  writeFileSync(HTML_PATH, injected, "utf8");
  writeFileSync(
    JSON_PATH,
    JSON.stringify(
      { generated: isoDate, scanned: meta.scanned, qualified: meta.qualified, shown: rows.length, counts, protocols: rows },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`OK: ${rows.length} protocols  (date ${isoDate})`);
  console.log(
    `tiers -> hyper:${counts.hyper} high:${counts.high} moderate:${counts.moderate} low:${counts.low}`,
  );
  console.log(
    `top: ${rows[0].name} ${rows[0].earnings_yield_pct}%  |  ` +
      `bottom: ${rows[rows.length - 1].name} ${rows[rows.length - 1].earnings_yield_pct}%`,
  );
}

main().catch((err) => {
  console.error("PIPELINE FAILED:", err && err.message ? err.message : err);
  process.exit(1);
});
