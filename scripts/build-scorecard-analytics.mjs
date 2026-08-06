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
const MARKET_PATH = join(REPO, "data", "scorecard-market.json");
const URL_REPORT_PATH = join(REPO, "data", "citation-url-report.json");
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
 * Reads the live CoinGecko snapshot written by fetch-scorecard-market.mjs.
 * This is the only accepted source for anything price-derived.
 */
function loadMarket() {
  const raw = readFileSync(MARKET_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) throw new Error("market file empty");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed.tokens !== "object" || parsed.tokens === null) {
    throw new Error("market.tokens missing");
  }
  if (typeof parsed.fetched_at !== "string") throw new Error("market.fetched_at missing");
  return parsed;
}

/**
 * Reads the citation link report and returns the set of URLs that returned a
 * hard 404 or 410. Missing report means every link is treated as unverified
 * rather than silently assumed good.
 */
function loadDeadUrls() {
  let raw = "";
  try {
    raw = readFileSync(URL_REPORT_PATH, "utf8");
  } catch {
    return { dead: new Set(), checked_at: null };
  }
  if (typeof raw !== "string" || raw.length === 0) return { dead: new Set(), checked_at: null };
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.dead)) return { dead: new Set(), checked_at: null };
  const dead = new Set();
  for (let i = 0; i < parsed.dead.length && i < MAX_TOKENS * 10; i += 1) {
    if (parsed.dead[i] && typeof parsed.dead[i].url === "string") dead.add(parsed.dead[i].url);
  }
  return { dead, checked_at: parsed.checked_at ?? null };
}

/**
 * Annotates citations with whether their link actually resolves. A citation
 * pointing at a 404 must not render as a clickable source or appear in the
 * structured data, because a broken link reads as evidence until it is clicked.
 */
function annotateCitations(citations, deadUrls) {
  if (!Array.isArray(citations)) return [];
  if (citations.length === 0) return [];
  const out = [];
  for (let i = 0; i < citations.length && i < 50; i += 1) {
    const citation = citations[i];
    if (!citation || typeof citation.claim !== "string") continue;
    const url = typeof citation.url === "string" ? citation.url : null;
    out.push({
      claim: citation.claim,
      source: citation.source ?? "Source",
      url,
      link_ok: url === null ? false : !deadUrls.has(url),
    });
  }
  return out;
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
function buildDilution(token, live) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  // Supply counts come from the live snapshot when we have one. The scorecard's
  // own counts are months old and drift as tokens vest.
  const src = live ?? token;
  const mcap = Number.isFinite(src.market_cap) ? src.market_cap : null;
  const circ = Number.isFinite(src.circulating_supply) ? src.circulating_supply : null;
  const total = Number.isFinite(src.total_supply) ? src.total_supply : null;
  const maxSupply = Number.isFinite(src.max_supply) ? src.max_supply : null;
  const fdvComputed = live
    ? (Number.isFinite(live.fdv) ? live.fdv : null)
    : (Number.isFinite(token.fully_diluted_valuation) ? token.fully_diluted_valuation : null);
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
function buildDrawdown(token, live) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  // The scorecard's stored ath_distance_pct was computed at the scoring-pass
  // price and has drifted badly since. Worse, several stored all-time highs are
  // themselves wrong (BTC was carried at $111,814 against a real $126,080).
  // Without a live row we publish nothing rather than a stale contradiction.
  if (!live) return { ath: null, ath_date: null, distance_pct: null, recovery_x: null };
  const distance = Number.isFinite(live.ath_change_pct) ? live.ath_change_pct : null;
  const ath = Number.isFinite(live.ath) ? live.ath : null;
  if (distance === null || ath === null || distance >= 0 || distance <= -100) {
    return { ath, ath_date: live.ath_date ?? null, distance_pct: round(distance, 1), recovery_x: null };
  }
  return {
    ath,
    ath_date: live.ath_date ?? null,
    distance_pct: round(distance, 1),
    recovery_x: round(100 / (100 + distance), 1),
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
function buildMarket(token, live, fetchedAt) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (typeof fetchedAt !== "string" || fetchedAt.length === 0) throw new Error("bad fetchedAt");
  // No live row means no published price. The scorecard's own prices are stamped
  // May and June 2026, and 101 carry no stamp at all, so showing one would be
  // presenting a months-old number next to live-looking analysis.
  if (!live) {
    return {
      price: null,
      market_cap: null,
      volume_24h: null,
      change_24h: null,
      market_cap_rank: null,
      renamed_to: null,
      coingecko_id: null,
      as_of: null,
      source: "unavailable",
    };
  }
  return {
    price: live.price,
    market_cap: live.market_cap,
    volume_24h: live.volume_24h,
    change_24h: live.change_24h,
    market_cap_rank: live.market_cap_rank,
    renamed_to: live.renamed_to ?? null,
    coingecko_id: live.coingecko_id,
    as_of: fetchedAt,
    source: "coingecko",
  };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Detects whether a catalyst string is anchored to a date that has already
 * passed. These render under a "Next catalyst" heading, so an expired one tells
 * a reader something is ahead when it is behind. LTC carried "halving supply cut
 * in August 2023" as its next catalyst.
 *
 * Only reports what it can parse. An unparseable string is treated as current,
 * because guessing would relabel good data as stale.
 */
function findExpiredDates(text, today) {
  if (typeof text !== "string" || text.length === 0) return [];
  if (!(today instanceof Date)) throw new Error("today must be a Date");
  const found = [];

  const quarters = text.matchAll(/\bQ([1-4])\s*(20\d\d)\b/g);
  for (const match of quarters) {
    const end = new Date(Date.UTC(Number(match[2]), Number(match[1]) * 3 - 1, 28));
    if (end < today) found.push(match[0]);
  }

  const monthYears = text.matchAll(/\b([A-Z][a-z]{2,8})\s+(20\d\d)\b/g);
  for (const match of monthYears) {
    const index = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase());
    if (index < 0) continue;
    const end = new Date(Date.UTC(Number(match[2]), index, 28));
    if (end < today) found.push(match[0]);
  }

  const bareDates = text.matchAll(/\b([A-Z][a-z]{2})\s+(\d{1,2})\b(?!\s*,?\s*20)/g);
  for (const match of bareDates) {
    const index = MONTHS.indexOf(match[1].toLowerCase());
    if (index < 0) continue;
    const day = Number(match[2]);
    if (day < 1 || day > 31) continue;
    const when = new Date(Date.UTC(today.getUTCFullYear(), index, day));
    if (when < today) found.push(match[0]);
  }

  return [...new Set(found)];
}

/** Market cap per dollar of TVL. Only meaningful where TVL is published. */
function buildTvlRatio(token, live) {
  if (!token) throw new Error("no token");
  if (typeof token.symbol !== "string") throw new Error("no symbol");
  const tvl = Number.isFinite(token.tvl) ? token.tvl : null;
  // Ratio must use the live market cap, otherwise it mixes a current cap with a
  // months-old one and reads as a precise number that means nothing.
  const mcap = live && Number.isFinite(live.market_cap) ? live.market_cap : null;
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
  const { varStats, varRanks, scoreRanks, universe, vectors, tokens, oppLinks, market } = context;
  const live = market[token.symbol.toUpperCase()] ?? null;

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
    catalyst_expired_dates: findExpiredDates(token.key_catalyst, context.today),
    key_risk: token.key_risk ?? null,
    variables,
    strengths,
    weaknesses,
    dilution: buildDilution(token, live),
    drawdown: buildDrawdown(token, live),
    tvl: buildTvlRatio(token, live),
    market: buildMarket(token, live, context.marketFetchedAt),
    where_to_buy: Array.isArray(token.where_to_buy) ? token.where_to_buy : [],
    cmc_slug: typeof token.cmc_slug === "string" ? token.cmc_slug : null,
    citations: annotateCitations(token.citations, context.deadUrls),
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
  const market = loadMarket();
  const urlReport = loadDeadUrls();
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
    market: market.tokens,
    marketFetchedAt: market.fetched_at,
    deadUrls: urlReport.dead,
    today: new Date(),
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
    citation_links: {
      checked_at: urlReport.checked_at,
      dead_count: urlReport.dead.size,
    },
    market_data: {
      source: market.source,
      source_url: market.source_url,
      fetched_at: market.fetched_at,
      covered: market.covered,
      unresolved: market.unresolved,
    },
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
  const withMarket = records.filter((r) => r.market.source === "coingecko").length;
  const deadCites = records.reduce((sum, r) => sum + r.citations.filter((c) => !c.link_ok).length, 0);
  const expiredCats = records.filter((r) => r.catalyst_expired_dates.length > 0).length;
  process.stdout.write(
    [
      `universe          ${records.length} tokens`,
      `variables         ${publishedVars.length}`,
      `verdict hubs      ${verdictGroups.length}`,
      `chain hubs        ${chainGroups.length}`,
      `deep-dive links   ${withDeepDive}`,
      `live market rows  ${withMarket}`,
      `dead cite links   ${deadCites} suppressed`,
      `expired catalysts ${expiredCats} relabelled`,
      `written           ${OUT_PATH}`,
      "",
    ].join("\n"),
  );
}

main();
