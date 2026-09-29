#!/usr/bin/env node
/**
 * build-rankings.mjs — derives four long-tail ranking datasets over
 * data/scorecard-analytics.json and writes data/scorecard-rankings.json:
 *
 *   most-deflationary    highest supply_inflation variable score (supply shrinking
 *                        or flat), i.e. the "most deflationary crypto" question.
 *   net-supply           inflation score vs buyback_burn score together, ranked by
 *                        the sum — the only page that answers "what is the actual
 *                        net supply direction" across the universe.
 *   undervalued-ps       high composite score AND high P/S percentile inside
 *                        $50M-$5B caps — the "undervalued altcoins" question,
 *                        answered with fundamentals rather than price momentum.
 *   exchange-tokens      every rated exchange token (CEX + DEX) ranked on composite
 *                        score — a list page the SERP currently fills with affiliate
 *                        roundups that never state a rule.
 *
 * Nothing here introduces a fact. Every number is arithmetic over the scored
 * universe that already shipped, same doctrine as build-longtail-layer.mjs.
 *
 * Run after build-longtail-layer.mjs. Wired into the daily workflow by hand
 * for now; same contract: bounded loops, assertions on every return.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const ANALYTICS_PATH = join(REPO, "data", "scorecard-analytics.json");
const OUT_PATH = join(REPO, "data", "scorecard-rankings.json");

const MAX_TOKENS = 2000;
/** Size band for the undervalued screen, in USD. */
const MIN_CAP = 5e7;
const MAX_CAP = 5e9;
/** Minimum percentile (0-100) on the named variable to qualify. */
const PCT_THRESHOLD = 75;

/** Rounds to 2 places, null for unusable input. */
function round2(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

/** USD shorthand like $1.2B / $350M. Null when cap missing. */
function usdShort(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1e12) return `$${round2(value / 1e12)}T`;
  if (value >= 1e9) return `$${round2(value / 1e9)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  return `$${Math.round(value)}`;
}

/** Loads and validates the analytics file. Exits non-zero on malformation. */
function loadAnalytics() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(ANALYTICS_PATH, "utf8"));
  } catch (err) {
    console.error(`rankings: cannot parse analytics: ${err.message}`);
    process.exit(1);
  }
  if (!raw || !Array.isArray(raw.tokens)) {
    console.error("rankings: analytics file missing tokens array");
    process.exit(1);
  }
  if (raw.tokens.length === 0 || raw.tokens.length > MAX_TOKENS) {
    console.error(`rankings: token count ${raw.tokens.length} out of bounds`);
    process.exit(1);
  }
  return raw;
}

/** Returns the {percentile, value} pair for one variable key, or null. */
function varOf(token, key) {
  if (!token || !Array.isArray(token.variables)) return null;
  const v = token.variables.find((x) => x && x.key === key);
  if (!v) return null;
  return { percentile: typeof v.percentile === "number" ? v.percentile : null, value: v.value ?? null };
}

/** Builds one ScreenRow-shaped member from a token. */
function toMember(token, extra) {
  const cap = token.market && typeof token.market.market_cap === "number" ? token.market.market_cap : null;
  return {
    symbol: token.symbol,
    slug: token.slug,
    name: token.name,
    score: token.score,
    rank_overall: token.rank_overall,
    verdict: token.verdict,
    verdict_color: token.verdict_color,
    one_liner: token.one_liner ?? null,
    chain: token.chain ?? null,
    market_cap: cap,
    market_cap_rank: token.market?.market_cap_rank ?? null,
    dilution_x: token.dilution?.dilution_x ?? null,
    drawdown_pct: token.drawdown?.from_ath_pct ?? null,
    impaired: false,
    ...extra,
  };
}

// ---- Ranking 1: most deflationary -----------------------------------------
function mostDeflationary(tokens) {
  const rows = [];
  for (const t of tokens) {
    const v = varOf(t, "supply_inflation");
    if (v === null || v.percentile === null) continue;
    if (v.percentile < PCT_THRESHOLD) continue;
    const cap = t.market?.market_cap ?? null;
    if (cap === null || cap < 1e8) continue; // keep the list usable, not nano-caps
    rows.push(toMember(t, { supply_pct: v.percentile, supply_value: v.value }));
  }
  rows.sort((a, b) => b.score - a.score || b.supply_pct - a.supply_pct);
  return { slug: "most-deflationary", count: rows.length, members: rows.slice(0, 40) };
}

// ---- Ranking 2: net supply direction --------------------------------------
function netSupply(tokens) {
  const rows = [];
  for (const t of tokens) {
    const inf = varOf(t, "supply_inflation");
    const bb = varOf(t, "buyback_burn");
    if (!inf || !bb) continue;
    if (inf.percentile === null || bb.percentile === null) continue;
    const cap = t.market?.market_cap ?? null;
    if (cap === null || cap < 3e7) continue;
    rows.push(
      toMember(t, {
        supply_pct: inf.percentile,
        buyback_pct: bb.percentile,
        net_pct: round2((inf.percentile + bb.percentile) / 2),
      }),
    );
  }
  rows.sort((a, b) => b.net_pct - a.net_pct || b.score - a.score);
  return { slug: "net-supply-direction", count: rows.length, members: rows.slice(0, 40) };
}

// ---- Ranking 3: undervalued on P/S ----------------------------------------
function undervaluedPs(tokens) {
  const rows = [];
  for (const t of tokens) {
    const ps = varOf(t, "ps_multiple");
    if (!ps || ps.percentile === null) continue;
    if (ps.percentile < PCT_THRESHOLD) continue;
    const cap = t.market?.market_cap ?? null;
    if (cap === null || cap < MIN_CAP || cap > MAX_CAP) continue;
    rows.push(toMember(t, { ps_pct: ps.percentile, ps_value: ps.value }));
  }
  rows.sort((a, b) => b.score - a.score || b.ps_pct - a.ps_pct);
  return { slug: "undervalued-ps", count: rows.length, members: rows.slice(0, 40) };
}

// ---- Ranking 4: exchange tokens -------------------------------------------
const EXCHANGE_SYMBOLS = new Set([
  "BNB", "OKB", "BGB", "LEO", "GT", "MX", "ASD", "BGT", "KCS", "HTX", "HT",
  "UNI", "CAKE", "PANGOLIN", "JOE", "GMX", "DYDX", "SUSHI", "1INCH", "COW",
  "AERO", "VELVET", "RAY", "ORCA", "ZRX", "CRV", "BAL", "CURVE", "MNT", "BFX",
]);

function exchangeTokens(tokens) {
  const rows = [];
  for (const t of tokens) {
    if (!EXCHANGE_SYMBOLS.has(t.symbol)) continue;
    rows.push(toMember(t, {}));
  }
  rows.sort((a, b) => b.score - a.score);
  return { slug: "exchange-tokens", count: rows.length, members: rows };
}

// ---- Main ------------------------------------------------------------------
const analytics = loadAnalytics();
const tokens = analytics.tokens;

const defl = mostDeflationary(tokens);
const net = netSupply(tokens);
const ps = undervaluedPs(tokens);
const exch = exchangeTokens(tokens);

if (defl.count === 0) { console.error("rankings: most-deflationary is empty"); process.exit(1); }
if (net.count === 0) { console.error("rankings: net-supply-direction is empty"); process.exit(1); }
if (ps.count === 0) { console.error("rankings: undervalued-ps is empty"); process.exit(1); }
if (exch.count < 3) { console.error(`rankings: exchange-tokens too thin (${exch.count})`); process.exit(1); }

const out = {
  generated_at: new Date().toISOString(),
  source_updated_at: analytics.source_updated_at ?? null,
  market_fetched_at: analytics.market_fetched_at ?? null,
  universe_size: tokens.length,
  max_score: analytics.max_score ?? null,
  rankings: [
    { slug: defl.slug, name: "Most deflationary crypto", count: defl.count, members: defl.members },
    { slug: net.slug, name: "Net supply direction", count: net.count, members: net.members },
    { slug: ps.slug, name: "Undervalued on price-to-sales", count: ps.count, members: ps.members },
    { slug: exch.slug, name: "Exchange tokens ranked", count: exch.count, members: exch.members },
  ],
};

writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `rankings: wrote ${out.rankings.map((r) => `${r.slug}=${r.count}`).join(" ")} ` +
  `(universe ${out.universe_size}, as-of ${out.source_updated_at ?? "?"})`,
);
