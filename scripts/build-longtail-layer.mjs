#!/usr/bin/env node
/**
 * build-longtail-layer.mjs — derives two further layers over
 * data/scorecard-analytics.json and writes them as their own files:
 *
 *   data/scorecard-signals.json  one record per scored variable: the full
 *                                251-token leaderboard on that variable, its
 *                                distribution, and how it co-moves with the
 *                                composite score, with the other 24 variables
 *                                and with market capitalisation.
 *   data/scorecard-pairs.json    the curated head-to-head pair list that
 *                                /scorecard/compare/[pair] renders.
 *
 * Nothing here introduces a fact. Every number is arithmetic over the scored
 * universe that already shipped. The correlation figures are the point: they
 * answer a question no per-token page can, which is whether the market pays
 * for a variable at all.
 *
 * Run after scripts/build-scorecard-analytics.mjs. Both are wired into
 * .github/workflows/daily-prices.yml.
 *
 * NASA Power of 10: bounded loops, >=2 assertions per function, <60-line
 * functions, every return checked, no global mutable state.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const ANALYTICS_PATH = join(REPO, "data", "scorecard-analytics.json");
const SIGNALS_OUT = join(REPO, "data", "scorecard-signals.json");
const PAIRS_OUT = join(REPO, "data", "scorecard-pairs.json");
const TIERS_OUT = join(REPO, "data", "scorecard-tiers.json");

// ---- Audited bounds -------------------------------------------------------
const MAX_TOKENS = 2000;
const MAX_VARIABLES = 60;
const MAX_PAIRS = 1200; // hard ceiling on generated comparison routes
const PROFILE_NEIGHBOURS = 3; // nearest fundamental profiles paired per token
const MCAP_HEAD = 40; // how deep the market-cap head goes
const MCAP_SPAN = 10; // pair only tokens within this many mcap places
const CHAIN_HEAD = 8; // top members of a chain paired with each other
const CORRELATION_PEERS = 3; // co-moving variables surfaced per signal page
/** Below this many rated tokens a correlation is not worth publishing. */
const MIN_CORRELATION_N = 30;

// ---- Small helpers --------------------------------------------------------

/** Rounds to a fixed number of places, returning null for unusable input. */
function round(value, places) {
  if (!Number.isFinite(value)) return null;
  if (!Number.isInteger(places) || places < 0 || places > 6) throw new Error("bad places");
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Pearson correlation of two equal-length numeric series. Null when undefined. */
function pearson(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) throw new Error("pearson: arrays required");
  if (xs.length !== ys.length) throw new Error("pearson: length mismatch");
  const n = xs.length;
  if (n < MIN_CORRELATION_N) return null;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n && i < MAX_TOKENS; i += 1) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n && i < MAX_TOKENS; i += 1) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx2 += a * a;
    dy2 += b * b;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return round(num / Math.sqrt(dx2 * dy2), 2);
}

/**
 * Converts a series to average ranks, so Pearson over the result is Spearman.
 * Ties share the mean of the positions they span.
 */
function toRanks(values) {
  if (!Array.isArray(values)) throw new Error("toRanks: array required");
  if (values.length === 0) return [];
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);
  const ranks = new Array(indexed.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) j += 1;
    const shared = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[indexed[k].index] = shared;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation. Null when either series is degenerate. */
function spearman(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) throw new Error("spearman: arrays required");
  if (xs.length !== ys.length) throw new Error("spearman: length mismatch");
  if (xs.length < MIN_CORRELATION_N) return null;
  return pearson(toRanks(xs), toRanks(ys));
}

/** Reads and validates the analytics file this layer derives from. */
function loadAnalytics() {
  const raw = readFileSync(ANALYTICS_PATH, "utf8");
  if (raw.length === 0) throw new Error("analytics file is empty");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.tokens) || parsed.tokens.length === 0) {
    throw new Error("analytics file carries no tokens");
  }
  if (!Array.isArray(parsed.variables) || parsed.variables.length === 0) {
    throw new Error("analytics file carries no variable summaries");
  }
  return parsed;
}

/** The 1-10 value a token scored on one variable, or null when absent. */
function valueOf(token, key) {
  if (!token || !Array.isArray(token.variables)) throw new Error("valueOf: bad token");
  if (typeof key !== "string" || key.length === 0) throw new Error("valueOf: bad key");
  const found = token.variables.find((v) => v.key === key);
  return found === undefined ? null : found.value;
}

// ---- Signal layer ---------------------------------------------------------

/** One leaderboard row. Kept narrow: these files ship to the browser. */
function leaderRow(token, key) {
  if (!token) throw new Error("leaderRow: token required");
  if (typeof key !== "string") throw new Error("leaderRow: key required");
  const entry = token.variables.find((v) => v.key === key);
  return {
    symbol: token.symbol,
    slug: token.slug,
    name: token.name,
    value: entry === undefined ? null : entry.value,
    rank: entry === undefined ? null : entry.rank,
    percentile: entry === undefined ? null : entry.percentile,
    score: token.score,
    verdict: token.verdict,
    verdict_color: token.verdict_color,
    chain: token.chain,
    market_cap: token.market ? token.market.market_cap : null,
    one_liner: token.one_liner,
  };
}

/**
 * How a variable co-moves with the other 24. Returned strongest first, which
 * is what tells a reader whether a variable carries information of its own or
 * is a restatement of one already on the page.
 */
function variablePeers(key, tokens, variables) {
  if (typeof key !== "string" || key.length === 0) throw new Error("variablePeers: key required");
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("variablePeers: tokens required");
  const mine = tokens.map((t) => valueOf(t, key));
  const out = [];
  for (let i = 0; i < variables.length && i < MAX_VARIABLES; i += 1) {
    const other = variables[i];
    if (other.key === key) continue;
    const r = pearson(mine, tokens.map((t) => valueOf(t, other.key)));
    if (r === null) continue;
    out.push({ key: other.key, label: other.label, r });
  }
  out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return out.slice(0, CORRELATION_PEERS);
}

/** Counts of tokens at each end of a variable's 1-10 range. */
function variableExtremes(values) {
  if (!Array.isArray(values)) throw new Error("variableExtremes: array required");
  if (values.length === 0) throw new Error("variableExtremes: empty");
  let top = 0;
  let bottom = 0;
  for (let i = 0; i < values.length && i < MAX_TOKENS; i += 1) {
    if (values[i] >= 9) top += 1;
    if (values[i] <= 2) bottom += 1;
  }
  return { at_nine_or_ten: top, at_two_or_below: bottom };
}

/**
 * Builds one signal record: distribution, leaderboard, and the three
 * correlations that make the page say something a token page cannot.
 */
function buildSignal(summary, tokens) {
  if (!summary || typeof summary.key !== "string") throw new Error("buildSignal: bad summary");
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("buildSignal: tokens required");

  const key = summary.key;
  const values = tokens.map((t) => valueOf(t, key));
  const scored = tokens.filter((t) => valueOf(t, key) !== null);
  const withMcap = scored.filter(
    (t) => t.market && Number.isFinite(t.market.market_cap) && t.market.market_cap > 0,
  );

  const leaders = scored
    .map((t) => leaderRow(t, key))
    .sort((a, b) => (b.value - a.value) || (a.rank - b.rank) || (b.score - a.score));

  return {
    key,
    label: summary.label,
    group: summary.group,
    mean: summary.mean,
    median: summary.median,
    min: summary.min,
    max: summary.max,
    histogram: summary.histogram,
    extremes: variableExtremes(values.filter((v) => v !== null)),
    score_r: pearson(
      scored.map((t) => valueOf(t, key)),
      scored.map((t) => t.score),
    ),
    mcap_rho: spearman(
      withMcap.map((t) => valueOf(t, key)),
      withMcap.map((t) => t.market.market_cap),
    ),
    mcap_n: withMcap.length,
    peers: variablePeers(key, scored, tokens[0].variables),
    leaders,
  };
}

// ---- Pair layer -----------------------------------------------------------

/** Canonical pair slug. Alphabetical, so a pair has exactly one URL. */
function pairSlug(a, b) {
  if (typeof a !== "string" || a.length === 0) throw new Error("pairSlug: a required");
  if (typeof b !== "string" || b.length === 0) throw new Error("pairSlug: b required");
  const [first, second] = a < b ? [a, b] : [b, a];
  return `${first}-vs-${second}`;
}

/** Records a pair under its canonical slug, keeping the first reason seen. */
function addPair(into, aSlug, bSlug, reason) {
  if (!(into instanceof Map)) throw new Error("addPair: map required");
  if (typeof reason !== "string" || reason.length === 0) throw new Error("addPair: reason required");
  if (aSlug === bSlug) return;
  const slug = pairSlug(aSlug, bSlug);
  if (into.has(slug)) return;
  const [a, b] = aSlug < bSlug ? [aSlug, bSlug] : [bSlug, aSlug];
  into.set(slug, { slug, a, b, reason });
}

/** Pairs each token with its nearest fundamental-profile matches. */
function pairsByProfile(tokens, into) {
  if (!Array.isArray(tokens)) throw new Error("pairsByProfile: tokens required");
  if (!(into instanceof Map)) throw new Error("pairsByProfile: map required");
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const token = tokens[i];
    if (!Array.isArray(token.neighbours)) continue;
    for (let n = 0; n < token.neighbours.length && n < PROFILE_NEIGHBOURS; n += 1) {
      addPair(into, token.slug, token.neighbours[n].symbol.toLowerCase(), "profile");
    }
  }
}

/**
 * Pairs the market-cap head with itself, but only across a bounded span of
 * places, so the list stays to comparisons a reader would actually make.
 */
function pairsByMarketCap(tokens, into) {
  if (!Array.isArray(tokens)) throw new Error("pairsByMarketCap: tokens required");
  if (!(into instanceof Map)) throw new Error("pairsByMarketCap: map required");
  const head = tokens
    .filter((t) => t.market && Number.isFinite(t.market.market_cap) && t.market.market_cap > 0)
    .sort((a, b) => b.market.market_cap - a.market.market_cap)
    .slice(0, MCAP_HEAD);
  for (let i = 0; i < head.length; i += 1) {
    for (let j = i + 1; j < head.length && j <= i + MCAP_SPAN; j += 1) {
      addPair(into, head[i].slug, head[j].slug, "market-cap");
    }
  }
}

/** Pairs the strongest members of each chain against each other. */
function pairsByChain(tokens, into) {
  if (!Array.isArray(tokens)) throw new Error("pairsByChain: tokens required");
  if (!(into instanceof Map)) throw new Error("pairsByChain: map required");
  const buckets = new Map();
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const chain = tokens[i].chain;
    if (typeof chain !== "string" || chain.length === 0) continue;
    if (!buckets.has(chain)) buckets.set(chain, []);
    buckets.get(chain).push(tokens[i]);
  }
  for (const members of buckets.values()) {
    const head = [...members].sort((a, b) => b.score - a.score).slice(0, CHAIN_HEAD);
    for (let i = 0; i < head.length; i += 1) {
      for (let j = i + 1; j < head.length; j += 1) {
        addPair(into, head[i].slug, head[j].slug, "chain");
      }
    }
  }
}

/** The full curated pair list, deduplicated and bounded. */
function buildPairs(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("buildPairs: tokens required");
  const into = new Map();
  pairsByMarketCap(tokens, into);
  pairsByProfile(tokens, into);
  pairsByChain(tokens, into);
  const all = [...into.values()];
  if (all.length === 0) throw new Error("buildPairs: produced nothing");
  all.sort((a, b) => a.slug.localeCompare(b.slug));
  return all.slice(0, MAX_PAIRS);
}

// ---- Size-tier layer ------------------------------------------------------

/**
 * Market-capitalisation bands. Boundaries are the round numbers the market
 * itself talks in, not quantiles of this universe, so a token does not change
 * tier because the set it is measured against changed.
 */
const TIERS = [
  { slug: "mega-cap", name: "Mega cap", min: 1e10, max: Infinity },
  { slug: "large-cap", name: "Large cap", min: 1e9, max: 1e10 },
  { slug: "mid-cap", name: "Mid cap", min: 2.5e8, max: 1e9 },
  { slug: "small-cap", name: "Small cap", min: 5e7, max: 2.5e8 },
  { slug: "micro-cap", name: "Micro cap", min: 0, max: 5e7 },
];

/** Mean of a numeric list, rounded. Null when the list is empty. */
function meanOf(values) {
  if (!Array.isArray(values)) throw new Error("meanOf: array required");
  if (values.length === 0) return null;
  let sum = 0;
  for (let i = 0; i < values.length && i < MAX_TOKENS; i += 1) sum += values[i];
  return round(sum / values.length, 2);
}

/** Median of a numeric list. Null when the list is empty. */
function medianOf(values) {
  if (!Array.isArray(values)) throw new Error("medianOf: array required");
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? round((sorted[mid - 1] + sorted[mid]) / 2, 1) : sorted[mid];
}

/** Per-variable means for a tier, strongest first. */
function tierVariableMeans(members) {
  if (!Array.isArray(members) || members.length === 0) throw new Error("tierVariableMeans: members required");
  const out = [];
  const template = members[0].variables;
  for (let v = 0; v < template.length && v < MAX_VARIABLES; v += 1) {
    const key = template[v].key;
    const values = members
      .map((m) => {
        const found = m.variables.find((x) => x.key === key);
        return found === undefined ? null : found.value;
      })
      .filter((x) => x !== null);
    out.push({ key, label: template[v].label, mean: meanOf(values) });
  }
  out.sort((a, b) => b.mean - a.mean);
  return out;
}

/**
 * One size band, shaped exactly like the verdict and chain groups so the same
 * hub component renders it. Carries the extra figure a size band exists to
 * answer: whether score and size actually move together inside the band.
 */
function buildTier(tier, members) {
  if (!tier || typeof tier.slug !== "string") throw new Error("buildTier: bad tier");
  if (!Array.isArray(members) || members.length === 0) throw new Error("buildTier: empty tier");
  const ordered = [...members].sort((a, b) => b.score - a.score);
  const scores = ordered.map((m) => m.score);
  const varMeans = tierVariableMeans(ordered);

  return {
    kind: "size",
    name: tier.name,
    slug: tier.slug,
    count: ordered.length,
    floor: tier.min,
    ceiling: Number.isFinite(tier.max) ? tier.max : null,
    median_score: medianOf(scores),
    mean_score: meanOf(scores),
    top_score: scores[0],
    bottom_score: scores[scores.length - 1],
    /** Does score track size inside the band, or is the band flat? */
    score_size_rho: spearman(
      ordered.map((m) => m.score),
      ordered.map((m) => m.market.market_cap),
    ),
    strongest_variables: varMeans.slice(0, 3),
    weakest_variables: varMeans.slice(-3).reverse(),
    members: ordered.map((m) => ({
      symbol: m.symbol,
      slug: m.slug,
      name: m.name,
      score: m.score,
      rank_overall: m.rank_overall,
      verdict: m.verdict,
      verdict_color: m.verdict_color,
      one_liner: m.one_liner,
      market_cap: m.market.market_cap,
      dilution_x: m.dilution.dilution_x,
      chain: m.chain,
    })),
  };
}

/** Every size band that has members, largest band first. */
function buildTiers(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("buildTiers: tokens required");
  const priced = tokens.filter(
    (t) => t.market && Number.isFinite(t.market.market_cap) && t.market.market_cap > 0,
  );
  const out = [];
  for (let i = 0; i < TIERS.length; i += 1) {
    const tier = TIERS[i];
    const members = priced.filter(
      (t) => t.market.market_cap >= tier.min && t.market.market_cap < tier.max,
    );
    if (members.length === 0) continue;
    out.push(buildTier(tier, members));
  }
  return out;
}

// ---- Main -----------------------------------------------------------------

function main() {
  const analytics = loadAnalytics();
  const tokens = analytics.tokens.slice(0, MAX_TOKENS);

  const signals = analytics.variables
    .slice(0, MAX_VARIABLES)
    .map((summary) => buildSignal(summary, tokens));
  if (signals.length === 0) throw new Error("no signals built");

  const pairs = buildPairs(tokens);
  const tiers = buildTiers(tokens);

  const stamp = {
    generated_at: new Date().toISOString(),
    source_updated_at: analytics.source_updated_at,
    universe_size: analytics.universe_size,
    max_score: analytics.max_score,
    market_fetched_at: analytics.market_data ? analytics.market_data.fetched_at : null,
  };

  writeFileSync(SIGNALS_OUT, `${JSON.stringify({ ...stamp, signals }, null, 0)}\n`);
  writeFileSync(PAIRS_OUT, `${JSON.stringify({ ...stamp, pairs }, null, 0)}\n`);
  writeFileSync(TIERS_OUT, `${JSON.stringify({ ...stamp, tiers }, null, 0)}\n`);

  const byReason = pairs.reduce((acc, p) => {
    acc[p.reason] = (acc[p.reason] ?? 0) + 1;
    return acc;
  }, Object.create(null));

  process.stdout.write(
    `signals ${signals.length} -> ${SIGNALS_OUT}\n` +
      `pairs ${pairs.length} (${Object.entries(byReason).map(([k, v]) => `${k} ${v}`).join(", ")}) -> ${PAIRS_OUT}\n` +
      `tiers ${tiers.length} (${tiers.map((t) => `${t.slug} ${t.count}`).join(", ")}) -> ${TIERS_OUT}\n`,
  );
}

main();
