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
const SCREENS_OUT = join(REPO, "data", "scorecard-screens.json");
const EXCLUSIONS_PATH = join(REPO, "data", "screen-exclusions.json");

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
/** Hard ceilings on the group walks, so a malformed universe cannot run away. */
const MAX_CHAINS = 500;
const MAX_TIERS = 20;

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
  let guard = 0;
  while (i < indexed.length && guard < MAX_TOKENS) {
    guard += 1;
    let j = i;
    while (j + 1 < indexed.length && j < MAX_TOKENS && indexed[j + 1].value === indexed[i].value) j += 1;
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

/**
 * Symbols held out because an event after the scoring pass invalidated the
 * scores the screens filter on. The text guard cannot catch these, because the
 * data predates the event. Each carries evidence in the file.
 */
function loadExclusions() {
  const raw = readFileSync(EXCLUSIONS_PATH, "utf8");
  if (raw.length === 0) throw new Error("exclusions file is empty");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${EXCLUSIONS_PATH} is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed.exclusions)) throw new Error("exclusions must be an array");
  return new Set(parsed.exclusions.map((e) => e.symbol));
}

/** Reads and validates the analytics file this layer derives from. */
function loadAnalytics() {
  const raw = readFileSync(ANALYTICS_PATH, "utf8");
  if (raw.length === 0) throw new Error("analytics file is empty");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${ANALYTICS_PATH} is not valid JSON: ${error.message}`);
  }
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
  for (let i = 0; i < head.length && i < MCAP_HEAD; i += 1) {
    for (let j = i + 1; j < head.length && j < MCAP_HEAD && j <= i + MCAP_SPAN; j += 1) {
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
  let chains = 0;
  for (const members of buckets.values()) {
    if (chains >= MAX_CHAINS) break;
    chains += 1;
    const head = [...members].sort((a, b) => b.score - a.score).slice(0, CHAIN_HEAD);
    for (let i = 0; i < head.length && i < CHAIN_HEAD; i += 1) {
      for (let j = i + 1; j < head.length && j < CHAIN_HEAD; j += 1) {
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
  for (let i = 0; i < TIERS.length && i < MAX_TIERS; i += 1) {
    const tier = TIERS[i];
    const members = priced.filter(
      (t) => t.market.market_cap >= tier.min && t.market.market_cap < tier.max,
    );
    if (members.length === 0) continue;
    out.push(buildTier(tier, members));
  }
  return out;
}

// ---- Screen layer ---------------------------------------------------------

/**
 * A score is a snapshot of the scoring pass. When a later event impairs a
 * protocol the score does not know, so any page that reads a high score as a
 * buy signal has to exclude it. DRIFT is the live example: it scores 142 and
 * ranks 24th, and it has been offline since a $286M exploit on 1 April 2026.
 */
const IMPAIRED = [
  /\boffline\b/i,
  /\bexploited for\b/i,
  /\bwound down\b/i,
  /\binsolvent\b/i,
  /\bwithdrawals suspended\b/i,
  /\bceased operations\b/i,
];

/**
 * Every DeFi token carries "smart contract exploit risk" and many carry an
 * "exploit history (fully recovered)". Neither invalidates a score. Only a
 * current impaired state does, so the patterns match the state and not the
 * hazard. Matching the bare noun wrongly excluded CETUS, INV and FARM.
 */
function isImpaired(token) {
  if (!token) throw new Error("isImpaired: token required");
  const text = `${token.one_liner ?? ""} ${token.key_risk ?? ""}`;
  if (text.length === 0) return false;
  for (let i = 0; i < IMPAIRED.length && i < 20; i += 1) {
    if (IMPAIRED[i].test(text)) return true;
  }
  return false;
}

/** Share of the 25 variables sitting on 4 or 5, the no-information band. */
function midBandFraction(token) {
  if (!token || !Array.isArray(token.variables)) throw new Error("midBandFraction: bad token");
  if (token.variables.length === 0) return 1;
  let mid = 0;
  for (let i = 0; i < token.variables.length && i < 60; i += 1) {
    const v = token.variables[i].value;
    if (v === 4 || v === 5) mid += 1;
  }
  return mid / token.variables.length;
}

/** True when the vector carries too little signal to rank against researched peers. */
function isLowConfidence(token) {
  if (!token) throw new Error("isLowConfidence: token required");
  return midBandFraction(token) >= LOW_CONFIDENCE_FRACTION;
}

/** Score for one variable key, or 0 when the token is not scored on it. */
function scoreOf(token, key) {
  if (!token || !Array.isArray(token.variables)) throw new Error("scoreOf: bad token");
  const found = token.variables.find((v) => v.key === key);
  return found === undefined ? 0 : found.value;
}

/**
 * The published screens. Each is a filter a reader could state as a question,
 * with thresholds chosen so the result is a real shortlist rather than a list
 * of everything or a list of nothing.
 */
const SCREENS = [
  { slug: "real-revenue-cheap", name: "Real revenue, low price to sales band",
    test: (t) => scoreOf(t, "protocol_revenue") >= 6 && scoreOf(t, "ps_multiple") >= 6 },
  // The scores alone let three tokens through whose own supply counts disagree,
  // CBETH at 44% circulating carrying a 10. The derived share is the reliable
  // figure, so the page's promise is enforced from supply, not from the band.
  { slug: "no-vesting-overhang", name: "No vesting overhang left",
    test: (t) => scoreOf(t, "circ_fdv_ratio") >= 9 && scoreOf(t, "unlock_schedule") >= 8 &&
      t.dilution.circ_pct !== null && t.dilution.circ_pct >= 90 },
  { slug: "buyback-and-burn", name: "Returns cash to holders",
    test: (t) => scoreOf(t, "buyback_burn") >= 7 },
  { slug: "real-staking-yield", name: "Staking yield that is not issuance",
    test: (t) => scoreOf(t, "staking_yield") >= 7 },
  { slug: "builder-momentum", name: "Builders are still arriving",
    test: (t) => scoreOf(t, "developer_activity") >= 7 && scoreOf(t, "ecosystem_growth") >= 7 },
  { slug: "cash-generating", name: "Revenue that is still growing",
    test: (t) => scoreOf(t, "protocol_revenue") >= 7 && scoreOf(t, "revenue_trend") >= 6 },
  { slug: "moat-and-share", name: "Leads its category and can defend it",
    test: (t) => scoreOf(t, "competitive_moat") >= 7 && scoreOf(t, "market_share") >= 7 },
  { slug: "regulatory-safe-harbour", name: "Least exposed to regulation",
    test: (t) => scoreOf(t, "regulatory_safety") >= 8 },
  { slug: "survivors-deep-drawdown", name: "Down hard, still scoring well",
    test: (t) => t.drawdown.distance_pct !== null && t.drawdown.distance_pct <= -85 && t.score >= 110 },
  { slug: "small-cap-quality", name: "Small caps that clear the framework",
    test: (t) => t.market && Number.isFinite(t.market.market_cap) &&
      t.market.market_cap > 0 && t.market.market_cap < 5e8 && t.score >= 120 },
];

const MIN_SCREEN_MEMBERS = 8;
const MAX_SCREENS = 40;

/** One row on a screen page. Narrow on purpose, these files ship to the browser. */
function screenRow(token) {
  return {
    symbol: token.symbol, slug: token.slug, name: token.name,
    score: token.score, rank_overall: token.rank_overall,
    verdict: token.verdict, verdict_color: token.verdict_color,
    one_liner: token.one_liner, chain: token.chain,
    market_cap: token.market ? token.market.market_cap : null,
    market_cap_rank: token.market ? token.market.market_cap_rank : null,
    dilution_x: token.dilution.dilution_x,
    drawdown_pct: token.drawdown.distance_pct,
    impaired: isImpaired(token),
  };
}

/** Builds every screen that clears the minimum member count. */
function buildScreens(tokens, eligible) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("buildScreens: tokens required");
  if (!Array.isArray(eligible)) throw new Error("buildScreens: eligible required");
  const out = [];
  for (let i = 0; i < SCREENS.length && i < MAX_SCREENS; i += 1) {
    const spec = SCREENS[i];
    const members = eligible.filter(spec.test).sort((a, b) => b.score - a.score).map(screenRow);
    if (members.length < MIN_SCREEN_MEMBERS) continue;
    const scores = members.map((m) => m.score);
    out.push({
      slug: spec.slug, name: spec.name, count: members.length,
      universe: tokens.length,
      median_score: medianOf(scores), top_score: scores[0],
      bottom_score: scores[scores.length - 1],
      impaired_count: 0,
      members,
    });
  }
  return out;
}

/**
 * A raw rank gap is not comparable across bands, because a 109-member band
 * allows a gap of 108 and a 28-member band allows 27. The gap is therefore
 * expressed in percentile points of its own band, and this is the threshold in
 * those points.
 */
const MISPRICE_MIN_GAP = 25;
const MISPRICE_LIST = 30;
/** Below this a band has too few members for a rank gap to mean anything. */
const MIN_BAND_SIZE = 12;
/**
 * A vector sitting mostly on 4 and 5 is what an analyst produces with no
 * information, not a measurement. WOO scores 4 or 5 on all 25 variables and
 * still reaches 118 and rank 75. Ranking those against researched tokens turns
 * missing research into a buy signal, so they are held out of the mispricing
 * ranking and the count is disclosed on the page.
 */
const LOW_CONFIDENCE_FRACTION = 0.7;

/**
 * Ranks tokens on fundamentals and on market capitalisation INSIDE each size
 * band, then reports the gap.
 *
 * Ranking across the whole universe does not work and the numbers say why. A
 * composite runs 0 to 250 while market capitalisation spans five orders of
 * magnitude, so a small token that scores decently always ranks far higher on
 * fundamentals than on size. Measured globally the "underpriced" list came out
 * entirely below $100M with a median of $14.7M, and the "overpriced" list had a
 * median of $211.7M. That is a restatement of size, not a mispricing.
 *
 * Inside a band it works, because score and capitalisation are uncorrelated
 * there (rho -0.11 to 0.03). Comparing like with like is what makes the gap
 * mean anything.
 */
function buildMispricing(tokens, tiers) {
  if (!Array.isArray(tokens)) throw new Error("buildMispricing: tokens required");
  if (!Array.isArray(tiers) || tiers.length === 0) throw new Error("buildMispricing: tiers required");

  const ranked = tokens.filter((t) => !isLowConfidence(t));
  const bySymbol = new Map(ranked.map((t) => [t.symbol, t]));
  const under = [];
  const over = [];
  const excluded = [];
  const lowConfidence = tokens.filter(isLowConfidence).map((t) => t.symbol);
  let covered = 0;

  for (let i = 0; i < tiers.length && i < MAX_TIERS; i += 1) {
    const tier = tiers[i];
    const members = tier.members
      .map((m) => bySymbol.get(m.symbol))
      .filter((t) => t && t.market && Number.isFinite(t.market.market_cap) && t.market.market_cap > 0);
    if (members.length < MIN_BAND_SIZE) continue;
    covered += members.length;

    const byScore = [...members].sort((a, b) => b.score - a.score);
    const scoreRank = new Map(byScore.map((t, n) => [t.symbol, n + 1]));
    const byCap = [...members].sort((a, b) => b.market.market_cap - a.market.market_cap);
    const capRank = new Map(byCap.map((t, n) => [t.symbol, n + 1]));

    for (let k = 0; k < members.length && k < MAX_TOKENS; k += 1) {
      const t = members[k];
      const row = {
        ...screenRow(t),
        band: tier.name,
        band_slug: tier.slug,
        band_size: members.length,
        fundamental_rank: scoreRank.get(t.symbol),
        cap_rank: capRank.get(t.symbol),
        rank_gap: capRank.get(t.symbol) - scoreRank.get(t.symbol),
        gap: Math.round(
          ((capRank.get(t.symbol) - scoreRank.get(t.symbol)) / members.length) * 100,
        ),
      };
      if (row.gap >= MISPRICE_MIN_GAP) {
        if (row.impaired) excluded.push(t.symbol);
        else under.push(row);
      } else if (row.gap <= -MISPRICE_MIN_GAP) {
        over.push(row);
      }
    }
  }

  under.sort((a, b) => b.gap - a.gap || b.score - a.score);
  over.sort((a, b) => a.gap - b.gap || a.score - b.score);

  return {
    method: "within size band",
    universe: covered,
    bands: tiers.length,
    min_gap: MISPRICE_MIN_GAP,
    excluded_impaired: excluded,
    excluded_low_confidence: lowConfidence.length,
    underpriced_total: under.length,
    overpriced_total: over.length,
    underpriced: under.slice(0, MISPRICE_LIST),
    overpriced: over.slice(0, MISPRICE_LIST),
  };
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
  // A screen is a shortlist, so a row has to be a live, distinct, tradeable
  // asset. Three filters, each of which the audit proved necessary:
  //   impaired   DRIFT passed five screens while offline with no revenue.
  //   no market  MKR and FTM are retired tickers with no live capitalisation.
  //   duplicate  POL and MATIC resolve to one CoinGecko id and were counted twice.
  const excluded = loadExclusions();
  const seenIds = new Set();
  const eligible = [];
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const t = tokens[i];
    if (isImpaired(t)) continue;
    if (excluded.has(t.symbol)) continue;
    if (!t.market || !Number.isFinite(t.market.market_cap) || t.market.market_cap <= 0) continue;
    const id = t.market.coingecko_id;
    if (typeof id === "string" && id.length > 0) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }
    eligible.push(t);
  }
  const screens = buildScreens(tokens, eligible);
  const mispricing = buildMispricing(eligible, tiers);

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
  writeFileSync(SCREENS_OUT, `${JSON.stringify({ ...stamp, screens, mispricing }, null, 0)}\n`);

  const byReason = pairs.reduce((acc, p) => {
    acc[p.reason] = (acc[p.reason] ?? 0) + 1;
    return acc;
  }, Object.create(null));

  process.stdout.write(
    `signals ${signals.length} -> ${SIGNALS_OUT}\n` +
      `pairs ${pairs.length} (${Object.entries(byReason).map(([k, v]) => `${k} ${v}`).join(", ")}) -> ${PAIRS_OUT}\n` +
      `tiers ${tiers.length} (${tiers.map((t) => `${t.slug} ${t.count}`).join(", ")}) -> ${TIERS_OUT}\n` +
      `eligible ${eligible.length} of ${tokens.length} after impaired, excluded, no-market and duplicate filters\n` +
      `screens ${screens.length}, mispricing ${mispricing ? `${mispricing.underpriced_total} under / ${mispricing.overpriced_total} over, excluded ${mispricing.excluded_impaired.join(",") || "none"}` : "n/a"} -> ${SCREENS_OUT}\n`,
  );
}

main();
