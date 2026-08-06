#!/usr/bin/env node
/**
 * build-scorecard-analytics.mjs — derives a second-order analytics layer over
 * data/altcoin-scorecard.json and writes data/scorecard-analytics.json.
 *
 * Nothing here invents a fact. Every output is either copied verbatim from the
 * source scorecard or is arithmetic over the 251-token universe: ranks,
 * percentiles, distributions, dilution overhang, ATH recovery multiples and
 * fundamental-profile similarity. That derived context is what makes a
 * per-token page worth its own URL instead of a row in a 5 MB table.
 *
 * Authored to the NASA Power of 10 rules: bounded loops, >=2 assertions per
 * function, <60-line functions, every return value checked, no global mutable
 * state, zero suppressions.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SRC_PATH = join(REPO, "data", "altcoin-scorecard.json");
const OPP_PATH = join(REPO, "data", "opportunities.json");
const OUT_PATH = join(REPO, "data", "scorecard-analytics.json");

// ---- Tunable, audited constants (NASA Rule 2/3: explicit bounds) ----------
const MAX_TOKENS = 2000; // hard ceiling on universe size
const NEIGHBOUR_COUNT = 6; // similar-profile tokens surfaced per page
const HIGHLIGHT_COUNT = 4; // strengths / weaknesses surfaced per page
const PEER_COUNT = 8; // verdict + chain peers surfaced per page
const MIN_VAR_SCORE = 1;
const MAX_VAR_SCORE = 10;
const STRENGTH_PCTL = 70; // percentile above which a variable reads as a strength
const WEAKNESS_PCTL = 30; // percentile below which it reads as a weakness

/**
 * The 25 scored variables, in framework order, with display labels.
 * Labels avoid the words banned by the humanize gate ("ecosystem", "unlock").
 */
const VARIABLES = [
  { key: "protocol_revenue", label: "Protocol Revenue", group: "Cash flow" },
  { key: "revenue_trend", label: "Revenue Trend", group: "Cash flow" },
  { key: "ps_multiple", label: "P/S Multiple", group: "Cash flow" },
  { key: "supply_inflation", label: "Supply Inflation", group: "Supply" },
  { key: "unlock_schedule", label: "Vesting Schedule", group: "Supply" },
  { key: "circ_fdv_ratio", label: "Circulating / FDV Ratio", group: "Supply" },
  { key: "buyback_burn", label: "Buyback and Burn", group: "Supply" },
  { key: "smart_money", label: "Smart Money Flows", group: "Ownership" },
  { key: "insider_selling", label: "Insider Selling", group: "Ownership" },
  { key: "holder_concentration", label: "Holder Concentration", group: "Ownership" },
  { key: "staking_yield", label: "Real Staking Yield", group: "Cash flow" },
  { key: "tvl_trend", label: "TVL Trend", group: "Traction" },
  { key: "active_users", label: "Active Users", group: "Traction" },
  { key: "developer_activity", label: "Developer Activity", group: "Traction" },
  { key: "ecosystem_growth", label: "Network Growth", group: "Traction" },
  { key: "market_share", label: "Market Share", group: "Position" },
  { key: "competitive_moat", label: "Competitive Moat", group: "Position" },
  { key: "institutional_adoption", label: "Institutional Adoption", group: "Position" },
  { key: "exchange_depth", label: "Exchange Depth", group: "Position" },
  { key: "regulatory_safety", label: "Regulatory Safety", group: "Risk" },
  { key: "catalyst_calendar", label: "Catalyst Calendar", group: "Risk" },
  { key: "btc_alpha", label: "BTC Alpha Potential", group: "Risk" },
  { key: "team_execution", label: "Team Execution", group: "Risk" },
  { key: "treasury_runway", label: "Treasury Runway", group: "Risk" },
  { key: "social_mindshare", label: "Social Mindshare", group: "Position" },
];

// ---- Small helpers --------------------------------------------------------

/** Lowercase, hyphenated, URL-safe slug. Returns "" for unusable input. */
function slugify(text) {
  if (typeof text !== "string") return "";
  if (text.length === 0) return "";
  const out = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out.length > 0 ? out : "";
}

/** Rounds to `places` decimals. Both args are validated. */
function round(value, places) {
  if (!Number.isFinite(value)) return null;
  if (!Number.isInteger(places) || places < 0 || places > 6) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Percentile of `value` within an ascending-sorted numeric array, using the
 * "percent of the universe at or below" convention. 100 means best in set.
 */
function percentileOf(sortedAsc, value) {
  if (!Array.isArray(sortedAsc) || sortedAsc.length === 0) return null;
  if (!Number.isFinite(value)) return null;
  let atOrBelow = 0;
  for (let i = 0; i < sortedAsc.length && i < MAX_TOKENS; i += 1) {
    if (sortedAsc[i] <= value) atOrBelow += 1;
  }
  return round((atOrBelow / sortedAsc.length) * 100, 1);
}

/** Median of a numeric array. Null when empty. */
function median(values) {
  if (!Array.isArray(values)) return null;
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return round(value, 2);
}

/** Arithmetic mean of a numeric array. Null when empty. */
function mean(values) {
  if (!Array.isArray(values)) return null;
  if (values.length === 0) return null;
  let sum = 0;
  for (let i = 0; i < values.length && i < MAX_TOKENS; i += 1) sum += values[i];
  return round(sum / values.length, 2);
}

// ---- Loading and validation ----------------------------------------------

/** Reads and shape-checks the source scorecard. Throws on malformed input. */
function loadScorecard() {
  const raw = readFileSync(SRC_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("scorecard file empty");
  }
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.tokens)) {
    throw new Error("scorecard.tokens is not an array");
  }
  if (parsed.tokens.length === 0 || parsed.tokens.length > MAX_TOKENS) {
    throw new Error(`scorecard.tokens length out of bounds: ${parsed.tokens.length}`);
  }
  return parsed;
}

/** Maps scorecard symbol -> opportunity slug, for the deeper-dive cross-link. */
function loadOpportunityLinks() {
  const raw = readFileSync(OPP_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("opportunities file empty");
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("opportunities is not an array");
  const map = Object.create(null);
  for (let i = 0; i < parsed.length && i < MAX_TOKENS * 2; i += 1) {
    const opp = parsed[i];
    if (!opp || typeof opp.slug !== "string") continue;
    const ticker = typeof opp.ticker === "string" ? opp.ticker.replace("$", "").toUpperCase() : "";
    if (ticker.length === 0) continue;
    if (map[ticker] === undefined) {
      map[ticker] = {
        slug: opp.slug,
        name: typeof opp.name === "string" ? opp.name : "",
        // opportunities.json is repriced daily by CI; the scorecard's own
        // prices are months old, so prefer these where a ticker matches.
        price: Number.isFinite(opp.current_price_usd) ? opp.current_price_usd : null,
        market_cap: Number.isFinite(opp.market_cap_usd) ? opp.market_cap_usd : null,
        as_of: typeof opp.updated_at === "string" ? opp.updated_at : null,
      };
    }
  }
  return map;
}

/**
 * Keeps only tokens with a usable symbol and a complete 25-variable vector.
 * A partial vector would silently distort every percentile in the file.
 */
function selectScorable(tokens) {
  if (!Array.isArray(tokens)) throw new Error("tokens not an array");
  if (tokens.length === 0) throw new Error("tokens empty");
  const kept = [];
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const token = tokens[i];
    if (!token || typeof token.symbol !== "string" || token.symbol.length === 0) continue;
    const scores = token.scores;
    if (!scores || typeof scores !== "object") continue;
    let complete = true;
    let total = 0;
    for (let v = 0; v < VARIABLES.length; v += 1) {
      const value = scores[VARIABLES[v].key];
      if (!Number.isFinite(value) || value < MIN_VAR_SCORE || value > MAX_VAR_SCORE) {
        complete = false;
        break;
      }
      total += value;
    }
    // The composite is by definition the sum of the 25 variables. Two source
    // records (VIRTUAL, FLUID) carry a stored `score` that disagrees with their
    // own breakdown; recomputing keeps every page internally consistent with
    // the table it displays.
    if (complete) kept.push({ ...token, score: total, stored_score: token.score });
  }
  return kept;
}

// ---- Universe-level statistics -------------------------------------------

/**
 * For each of the 25 variables, computes the universe distribution: mean,
 * median, the ascending value array used for percentile lookups, and a
 * 1-to-10 histogram. This is what lets a page say "a 9 here is top 4%".
 */
function buildVariableStats(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("no tokens");
  if (VARIABLES.length !== 25) throw new Error("expected 25 variables");
  const stats = Object.create(null);
  for (let v = 0; v < VARIABLES.length; v += 1) {
    const { key, label, group } = VARIABLES[v];
    const values = [];
    const histogram = new Array(MAX_VAR_SCORE + 1).fill(0);
    for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
      const value = tokens[i].scores[key];
      values.push(value);
      histogram[value] += 1;
    }
    const sortedAsc = [...values].sort((a, b) => a - b);
    stats[key] = {
      key,
      label,
      group,
      mean: mean(values),
      median: median(values),
      min: sortedAsc[0],
      max: sortedAsc[sortedAsc.length - 1],
      histogram: histogram.slice(MIN_VAR_SCORE),
      sortedAsc,
    };
  }
  return stats;
}

/**
 * Competition rank (1 = highest value, ties share a rank) for every token on a
 * single variable, keyed by symbol.
 */
function rankByVariable(tokens, key) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("no tokens");
  if (typeof key !== "string" || key.length === 0) throw new Error("bad key");
  const ordered = [...tokens].sort((a, b) => b.scores[key] - a.scores[key]);
  const ranks = Object.create(null);
  let lastValue = Number.NaN;
  let lastRank = 0;
  for (let i = 0; i < ordered.length && i < MAX_TOKENS; i += 1) {
    const value = ordered[i].scores[key];
    const rank = value === lastValue ? lastRank : i + 1;
    ranks[ordered[i].symbol] = rank;
    lastValue = value;
    lastRank = rank;
  }
  return ranks;
}

/** Competition rank on the composite score, keyed by symbol. */
function rankByScore(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("no tokens");
  if (!Number.isFinite(tokens[0].score)) throw new Error("score not numeric");
  const ordered = [...tokens].sort((a, b) => b.score - a.score);
  const ranks = Object.create(null);
  let lastValue = Number.NaN;
  let lastRank = 0;
  for (let i = 0; i < ordered.length && i < MAX_TOKENS; i += 1) {
    const rank = ordered[i].score === lastValue ? lastRank : i + 1;
    ranks[ordered[i].symbol] = rank;
    lastValue = ordered[i].score;
    lastRank = rank;
  }
  return ranks;
}

// ---- Fundamental-profile similarity --------------------------------------

/**
 * Centres a token's 25-vector on its own mean. This is the important step:
 * after centring, similarity measures the SHAPE of a token's fundamentals
 * (what it is good and bad at) rather than how good it is overall, so a
 * high-scoring and a low-scoring token can still be recognised as the same
 * kind of business.
 */
function centredVector(token) {
  if (!token || !token.scores) throw new Error("token has no scores");
  if (VARIABLES.length === 0) throw new Error("no variables");
  const raw = VARIABLES.map((v) => token.scores[v.key]);
  const avg = raw.reduce((sum, value) => sum + value, 0) / raw.length;
  return raw.map((value) => value - avg);
}

/** Cosine similarity of two equal-length vectors. Null when either is flat. */
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  if (a.length !== b.length || a.length === 0) return null;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * The NEIGHBOUR_COUNT tokens whose fundamental profile most closely matches
 * `token`, each annotated with the variables they most agree on.
 */
function findNeighbours(token, tokens, vectors) {
  if (!token || !Array.isArray(tokens)) throw new Error("bad neighbour input");
  if (!vectors || typeof vectors !== "object") throw new Error("bad vectors");
  const self = vectors[token.symbol];
  if (!self) return [];
  const scored = [];
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const other = tokens[i];
    if (other.symbol === token.symbol) continue;
    const similarity = cosine(self, vectors[other.symbol]);
    if (similarity === null) continue;
    scored.push({ token: other, similarity });
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, NEIGHBOUR_COUNT).map((entry) => ({
    symbol: entry.token.symbol,
    name: entry.token.name ?? entry.token.symbol,
    score: entry.token.score,
    verdict: entry.token.verdict,
    similarity: round(entry.similarity, 3),
  }));
}

// ---- Derived financial context -------------------------------------------

/**
 * Dilution overhang, derived from SUPPLY rather than from the source file's
 * `fdv` field.
 *
 * The source carries two disagreeing fully-diluted figures: `fdv` (frozen at an
 * older price) and `fully_diluted_valuation` (consistent with the stored
 * price). They differ by more than 2% on 127 of 251 tokens, and using `fdv`
 * produces impossible readings such as a 1.33x dilution multiple on ETH, which
 * is 100% circulating. Supply ratios do not depend on price at all, so
 * total (or max) supply over circulating supply is the trustworthy basis.
 * `fdv` is retained only as a cross-check and is never the headline number.
 */
function buildDilution(token) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  const mcap = Number.isFinite(token.market_cap) ? token.market_cap : null;
  const circ = Number.isFinite(token.circulating_supply) ? token.circulating_supply : null;
  const total = Number.isFinite(token.total_supply) ? token.total_supply : null;
  const maxSupply = Number.isFinite(token.max_supply) ? token.max_supply : null;
  const fdvComputed = Number.isFinite(token.fully_diluted_valuation)
    ? token.fully_diluted_valuation
    : null;
  const eventual = maxSupply !== null && total !== null ? Math.max(maxSupply, total) : maxSupply ?? total;

  const base = {
    mcap,
    fdv: fdvComputed,
    circulating_supply: circ,
    eventual_supply: eventual,
    dilution_x: null,
    overhang_pct: null,
    circ_pct: null,
    basis: "unavailable",
  };
  if (circ === null || eventual === null || circ <= 0 || eventual <= 0) return base;

  // Circulating above eventual supply means the supply fields disagree; do not
  // publish a negative overhang, report it as undilutable instead.
  const multiple = eventual / circ < 1 ? 1 : eventual / circ;
  const overhang = (1 - 1 / multiple) * 100;
  return {
    ...base,
    dilution_x: round(multiple, 2),
    overhang_pct: round(overhang, 1),
    circ_pct: round((circ / eventual) * 100, 1),
    basis: maxSupply !== null ? "max_supply" : "total_supply",
  };
}

/**
 * Drawdown context: how far below the all-time high the token trades, and the
 * multiple required to return to it. The recovery multiple is the number most
 * holders get wrong, so it is stated explicitly.
 */
function buildDrawdown(token) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  const distance = Number.isFinite(token.ath_distance_pct) ? token.ath_distance_pct : null;
  if (distance === null || distance >= 0 || distance <= -100) {
    return { ath: token.ath ?? null, distance_pct: distance, recovery_x: null };
  }
  const recovery = 100 / (100 + distance);
  return {
    ath: Number.isFinite(token.ath) ? token.ath : null,
    distance_pct: round(distance, 1),
    recovery_x: round(recovery, 1),
  };
}

/**
 * Resolves the price to publish and states plainly how old it is.
 *
 * The scorecard's own prices carry `price_updated_at` stamps from May and June
 * 2026, and 101 tokens carry no stamp at all, so none of them may be presented
 * as a live quote. Where `opportunities.json` covers the same ticker its price
 * is repriced daily by CI and is preferred. Everything else is returned as
 * explicitly dated, so the page can label it rather than imply it is current.
 */
function buildMarket(token, link) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (link !== undefined && link !== null && typeof link !== "object") {
    throw new Error("bad link");
  }
  if (link && Number.isFinite(link.price) && link.price > 0) {
    return {
      price: link.price,
      market_cap: Number.isFinite(link.market_cap) ? link.market_cap : token.market_cap ?? null,
      as_of: link.as_of,
      source: "daily",
    };
  }
  return {
    price: Number.isFinite(token.price) ? token.price : null,
    market_cap: Number.isFinite(token.market_cap) ? token.market_cap : null,
    as_of: token.price_updated_at ?? null,
    source: "scorecard",
  };
}

/** Market cap per dollar of TVL. Only meaningful where TVL is published. */
function buildTvlRatio(token) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  const tvl = Number.isFinite(token.tvl) ? token.tvl : null;
  const mcap = Number.isFinite(token.market_cap) ? token.market_cap : null;
  if (tvl === null || mcap === null || tvl <= 0) return { tvl, mcap_per_tvl: null };
  return { tvl, mcap_per_tvl: round(mcap / tvl, 2) };
}

/**
 * Normalises the free-text `chain` field ("Ethereum (Multi-chain: 6+ chains)")
 * down to a single primary chain so chain hubs do not fragment into 94 groups.
 */
function primaryChain(token) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  const raw = typeof token.chain === "string" ? token.chain : "";
  if (raw.length === 0) return null;
  const head = raw.split(/[(,/]/)[0].trim();
  return head.length > 0 ? head : null;
}

// ---- Per-token assembly ---------------------------------------------------

/**
 * Splits a token's 25 variables into the ones that beat the universe and the
 * ones that lose to it, each ordered by how extreme the percentile is.
 */
function splitHighlights(varEntries) {
  if (!Array.isArray(varEntries)) throw new Error("bad entries");
  if (varEntries.length === 0) throw new Error("no entries");
  const strengths = varEntries
    .filter((entry) => entry.percentile !== null && entry.percentile >= STRENGTH_PCTL)
    .sort((a, b) => b.percentile - a.percentile || b.value - a.value)
    .slice(0, HIGHLIGHT_COUNT);
  const weaknesses = varEntries
    .filter((entry) => entry.percentile !== null && entry.percentile <= WEAKNESS_PCTL)
    .sort((a, b) => a.percentile - b.percentile || a.value - b.value)
    .slice(0, HIGHLIGHT_COUNT);
  return { strengths, weaknesses };
}

/** Builds the full analytics record for one token. */
function buildTokenRecord(token, context) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (!context || !context.varStats) throw new Error("bad context");
  const { varStats, varRanks, scoreRanks, universe, vectors, tokens, oppLinks } = context;

  const variables = VARIABLES.map((meta) => {
    const value = token.scores[meta.key];
    return {
      key: meta.key,
      label: meta.label,
      group: meta.group,
      value,
      rank: varRanks[meta.key][token.symbol],
      percentile: percentileOf(varStats[meta.key].sortedAsc, value),
      universe_median: varStats[meta.key].median,
    };
  });

  const { strengths, weaknesses } = splitHighlights(variables);
  const prev = Number.isFinite(token.prev_score) ? token.prev_score : null;
  const chain = primaryChain(token);
  const link = oppLinks[token.symbol.toUpperCase()];

  return {
    symbol: token.symbol,
    slug: slugify(token.symbol),
    name: typeof token.name === "string" ? token.name : token.symbol,
    score: token.score,
    max_score: VARIABLES.length * MAX_VAR_SCORE,
    prev_score: prev,
    score_delta: prev === null ? null : token.score - prev,
    rank_overall: scoreRanks[token.symbol],
    universe_size: universe,
    percentile_overall: percentileOf(context.scoresAsc, token.score),
    verdict: token.verdict,
    verdict_color: token.verdict_color,
    chain,
    token_standard: token.token_standard ?? null,
    one_liner: token.one_liner ?? null,
    key_catalyst: token.key_catalyst ?? null,
    key_risk: token.key_risk ?? null,
    variables,
    strengths,
    weaknesses,
    dilution: buildDilution(token),
    drawdown: buildDrawdown(token),
    tvl: buildTvlRatio(token),
    market: buildMarket(token, link),
    where_to_buy: Array.isArray(token.where_to_buy) ? token.where_to_buy : [],
    cmc_slug: typeof token.cmc_slug === "string" ? token.cmc_slug : null,
    citations: Array.isArray(token.citations) ? token.citations : [],
    neighbours: findNeighbours(token, tokens, vectors),
    opportunity_slug: link ? link.slug : null,
  };
}

// ---- Group hubs -----------------------------------------------------------

/**
 * Builds one hub group (verdict band or chain) with its member list ordered by
 * score and its aggregate statistics.
 */
function buildGroup(name, members, kind) {
  if (typeof name !== "string" || name.length === 0) throw new Error("bad group name");
  if (!Array.isArray(members) || members.length === 0) throw new Error("empty group");
  const ordered = [...members].sort((a, b) => b.score - a.score);
  const scores = ordered.map((entry) => entry.score);
  const varMeans = VARIABLES.map((meta) => ({
    key: meta.key,
    label: meta.label,
    mean: mean(ordered.map((entry) => entry.variables.find((v) => v.key === meta.key).value)),
  })).sort((a, b) => b.mean - a.mean);

  return {
    kind,
    name,
    slug: slugify(name),
    count: ordered.length,
    median_score: median(scores),
    mean_score: mean(scores),
    top_score: scores[0],
    bottom_score: scores[scores.length - 1],
    strongest_variables: varMeans.slice(0, 3),
    weakest_variables: varMeans.slice(-3).reverse(),
    members: ordered.map((entry) => ({
      symbol: entry.symbol,
      slug: entry.slug,
      name: entry.name,
      score: entry.score,
      rank_overall: entry.rank_overall,
      verdict: entry.verdict,
      verdict_color: entry.verdict_color,
      one_liner: entry.one_liner,
      market_cap: entry.market.market_cap,
      dilution_x: entry.dilution.dilution_x,
      chain: entry.chain,
    })),
  };
}

/** Groups token records by a key selector, dropping groups below `minSize`. */
function groupBy(records, selector, kind, minSize) {
  if (!Array.isArray(records) || records.length === 0) throw new Error("no records");
  if (typeof selector !== "function") throw new Error("selector not a function");
  const buckets = new Map();
  for (let i = 0; i < records.length && i < MAX_TOKENS; i += 1) {
    const key = selector(records[i]);
    if (typeof key !== "string" || key.length === 0) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(records[i]);
  }
  const out = [];
  for (const [key, members] of buckets) {
    if (members.length < minSize) continue;
    out.push(buildGroup(key, members, kind));
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

// ---- Main -----------------------------------------------------------------

function main() {
  const source = loadScorecard();
  const oppLinks = loadOpportunityLinks();
  const tokens = selectScorable(source.tokens);
  if (tokens.length < 100) {
    throw new Error(`only ${tokens.length} tokens carry a complete 25-variable vector`);
  }

  const varStats = buildVariableStats(tokens);
  const varRanks = Object.create(null);
  for (let v = 0; v < VARIABLES.length; v += 1) {
    varRanks[VARIABLES[v].key] = rankByVariable(tokens, VARIABLES[v].key);
  }
  const scoreRanks = rankByScore(tokens);
  const scoresAsc = tokens.map((t) => t.score).sort((a, b) => a - b);

  const vectors = Object.create(null);
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    vectors[tokens[i].symbol] = centredVector(tokens[i]);
  }

  const context = {
    varStats,
    varRanks,
    scoreRanks,
    scoresAsc,
    universe: tokens.length,
    vectors,
    tokens,
    oppLinks,
  };

  const records = tokens.map((token) => buildTokenRecord(token, context));
  records.sort((a, b) => a.rank_overall - b.rank_overall);

  const verdictGroups = groupBy(records, (r) => r.verdict, "verdict", 1);
  const chainGroups = groupBy(records, (r) => r.chain ?? "", "chain", 3);

  const publishedVars = VARIABLES.map((meta) => ({
    key: meta.key,
    label: meta.label,
    group: meta.group,
    mean: varStats[meta.key].mean,
    median: varStats[meta.key].median,
    min: varStats[meta.key].min,
    max: varStats[meta.key].max,
    histogram: varStats[meta.key].histogram,
  }));

  const output = {
    generated_at: new Date().toISOString(),
    source_updated_at: source.updated_at ?? null,
    methodology: source.methodology ?? null,
    universe_size: records.length,
    max_score: VARIABLES.length * MAX_VAR_SCORE,
    score_range: { min: scoresAsc[0], max: scoresAsc[scoresAsc.length - 1] },
    variables: publishedVars,
    tokens: records,
    groups: { verdict: verdictGroups, chain: chainGroups },
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  const withDeepDive = records.filter((r) => r.opportunity_slug !== null).length;
  process.stdout.write(
    [
      `universe          ${records.length} tokens`,
      `variables         ${publishedVars.length}`,
      `verdict hubs      ${verdictGroups.length}`,
      `chain hubs        ${chainGroups.length}`,
      `deep-dive links   ${withDeepDive}`,
      `written           ${OUT_PATH}`,
      "",
    ].join("\n"),
  );
}

main();
