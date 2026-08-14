import signalsData from "../../data/scorecard-signals.json";
import type { ScorecardToken, ScoredVariable } from "./scorecard-analytics";
import { ordinal } from "./scorecard-insight";

/**
 * Typed access to data/scorecard-signals.json, written by
 * scripts/build-longtail-layer.mjs.
 *
 * A signal record is one scored variable seen across the whole rated universe:
 * its distribution, its full leaderboard, and three correlations that no
 * single-token page can show. Those correlations are the reason these pages
 * exist. They say whether a variable carries information of its own, and
 * whether the market prices it.
 */

const MAX_SIGNALS = 60;
const MAX_LEADERS = 2000;

/** Above this the two variables are close to restating each other. */
const TWIN_R = 0.8;
/** Below this the market shows no consistent preference for the variable. */
const IGNORED_RHO = 0.15;
/** At or above this the market clearly pays up for the variable. */
const PRICED_RHO = 0.45;
/** Below this a leader on a variable is small enough for the gap to matter. */
const SMALL_CAP_USD = 5e8;

export interface SignalLeader {
  readonly symbol: string;
  readonly slug: string;
  readonly name: string;
  readonly value: number | null;
  readonly rank: number | null;
  readonly percentile: number | null;
  readonly score: number;
  readonly verdict: string;
  readonly verdict_color: string;
  readonly chain: string | null;
  readonly market_cap: number | null;
  readonly one_liner: string | null;
}

export interface SignalPeer {
  readonly key: string;
  readonly label: string;
  readonly r: number;
}

export interface SignalRecord {
  readonly key: string;
  readonly label: string;
  readonly group: string;
  readonly mean: number | null;
  readonly median: number | null;
  readonly min: number;
  readonly max: number;
  readonly histogram: readonly number[];
  readonly extremes: { readonly at_nine_or_ten: number; readonly at_two_or_below: number };
  /** Pearson correlation between this variable and the composite score. */
  readonly score_r: number | null;
  /** Spearman correlation between this variable and market capitalisation. */
  readonly mcap_rho: number | null;
  readonly mcap_n: number;
  readonly peers: readonly SignalPeer[];
  readonly leaders: readonly SignalLeader[];
}

interface SignalsFile {
  readonly generated_at: string;
  readonly source_updated_at: string | null;
  readonly universe_size: number;
  readonly max_score: number;
  readonly market_fetched_at: string | null;
  readonly signals: readonly SignalRecord[];
}

const FILE = signalsData as unknown as SignalsFile;

/**
 * Two source keys carry wording the site does not publish, and the slug has to
 * match the heading a reader sees rather than the key an internal file uses.
 */
const SLUG_OVERRIDES: Readonly<Record<string, string>> = {
  unlock_schedule: "vesting-schedule",
  ecosystem_growth: "network-growth",
};

/** URL slug for a variable key. "protocol_revenue" becomes "protocol-revenue". */
export function signalSlug(key: string): string {
  if (typeof key !== "string" || key.length === 0) return "";
  const override = SLUG_OVERRIDES[key];
  if (typeof override === "string" && override.length > 0) return override;
  return key.replace(/_/g, "-");
}

/** Inverse of signalSlug, honouring the overrides. */
function slugToKey(slug: string): string {
  if (typeof slug !== "string" || slug.length === 0) return "";
  const keys = Object.keys(SLUG_OVERRIDES);
  for (let i = 0; i < keys.length && i < 10; i += 1) {
    if (SLUG_OVERRIDES[keys[i]] === slug) return keys[i];
  }
  return slug.replace(/-/g, "_");
}

/** File-level metadata: universe size, generation stamps, score ceiling. */
export function getSignalsMeta() {
  if (!FILE || typeof FILE !== "object") throw new Error("signals file missing");
  if (!Array.isArray(FILE.signals) || FILE.signals.length === 0) {
    throw new Error("signals file carries no signals");
  }
  return {
    generated_at: FILE.generated_at,
    source_updated_at: FILE.source_updated_at,
    universe_size: FILE.universe_size,
    max_score: FILE.max_score,
    market_fetched_at: FILE.market_fetched_at,
    count: FILE.signals.length,
  };
}

/** Every signal record, in framework order. */
export function getAllSignals(): readonly SignalRecord[] {
  if (!Array.isArray(FILE.signals)) return [];
  return FILE.signals.length > MAX_SIGNALS ? FILE.signals.slice(0, MAX_SIGNALS) : FILE.signals;
}

/** One signal by URL slug. Null when absent. */
export function getSignal(slug: string): SignalRecord | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const key = slugToKey(slug.toLowerCase());
  const all = getAllSignals();
  if (all.length === 0) return null;
  for (let i = 0; i < all.length && i < MAX_SIGNALS; i += 1) {
    if (all[i].key === key) return all[i];
  }
  return null;
}

/** The leaderboard, bounded. Already ordered best first by the builder. */
export function getSignalLeaders(signal: SignalRecord): readonly SignalLeader[] {
  if (!signal || !Array.isArray(signal.leaders)) return [];
  return signal.leaders.length > MAX_LEADERS ? signal.leaders.slice(0, MAX_LEADERS) : signal.leaders;
}

/** Signals ranked by how much the market pays for them, strongest first. */
export function getSignalsByMarketPricing(): readonly SignalRecord[] {
  const all = [...getAllSignals()].filter((s) => s.mcap_rho !== null);
  all.sort((a, b) => (b.mcap_rho ?? 0) - (a.mcap_rho ?? 0));
  return all;
}

/** Plain-language reading of a correlation coefficient. */
function strengthWord(r: number): string {
  const magnitude = Math.abs(r);
  if (magnitude >= 0.8) return "almost the same measurement as";
  if (magnitude >= 0.6) return "strongly tied to";
  if (magnitude >= 0.4) return "moderately tied to";
  if (magnitude >= 0.2) return "loosely tied to";
  return "close to independent of";
}

export interface SignalFinding {
  readonly label: string;
  readonly text: string;
}

/** Where the universe sits on this variable, and who leads it. */
function distributionFinding(signal: SignalRecord): SignalFinding | null {
  if (!signal || !Array.isArray(signal.leaders) || signal.leaders.length === 0) return null;
  const rated = signal.leaders.length;
  const top = signal.leaders[0];
  const high = signal.extremes.at_nine_or_ten;
  const low = signal.extremes.at_two_or_below;
  return {
    label: "Distribution",
    text:
      `Across ${rated} rated tokens the median score on ${signal.label} is ${signal.median} of 10 and ` +
      `the mean is ${signal.mean}. ` +
      `${high === 0 ? "No token scores 9 or 10" : `${high} ${high === 1 ? "token scores" : "tokens score"} 9 or 10`}, ` +
      `and ${low} ${low === 1 ? "scores" : "score"} 2 or below. ` +
      `${top.name} leads at ${top.value} of 10.`,
  };
}

/** How much of a token's overall standing this one variable explains. */
function compositeFinding(signal: SignalRecord): SignalFinding | null {
  if (signal.score_r === null) return null;
  const r = signal.score_r;
  const closing =
    r >= 0.75
      ? "Tokens that win here tend to win everywhere, so a high score is confirmation rather than an edge."
      : r <= 0.4
        ? "That is low enough that the variable is finding something the rest of the framework misses, which is where a screen on it alone is worth running."
        : "It moves with quality without being a proxy for it.";
  return {
    label: "Weight in the composite",
    text:
      `${signal.label} correlates ${r} with the composite score across the universe, ` +
      `which makes it ${strengthWord(r)} overall standing. ${closing}`,
  };
}

/** Whether the market currently charges anything for the variable. */
function pricingFinding(signal: SignalRecord): SignalFinding | null {
  if (signal.mcap_rho === null) return null;
  const rho = signal.mcap_rho;
  const closing =
    rho >= PRICED_RHO
      ? "The market already pays up for this. A high score is priced in, and the interesting cases are the tokens that score well and are still small."
      : rho <= IGNORED_RHO
        ? "That is effectively no relationship. Whatever this variable measures, the market is not currently charging for it, which is the definition of an unpriced edge if you believe the variable matters."
        : "The market leans this way but does not price it consistently, so the ranking below still contains disagreement worth using.";
  return {
    label: "Does the market pay for it",
    text:
      `Against live market capitalisation for the ${signal.mcap_n} tokens with a matched market row, ` +
      `${signal.label} carries a rank correlation of ${rho}. ${closing}`,
  };
}

/** Whether another variable is close to restating this one. */
function overlapFinding(signal: SignalRecord): SignalFinding | null {
  const twin = signal.peers.find((p) => Math.abs(p.r) >= TWIN_R);
  if (twin !== undefined) {
    return {
      label: "Overlap",
      text:
        `${signal.label} and ${twin.label} correlate ${twin.r}, so reading both is close to reading one twice. ` +
        `Treat them as a single position on the same question rather than two independent confirmations.`,
    };
  }
  if (signal.peers.length === 0) return null;
  const nearest = signal.peers[0];
  return {
    label: "Overlap",
    text:
      `The closest variable to ${signal.label} is ${nearest.label} at ${nearest.r}, which is ` +
      `${strengthWord(nearest.r)} it. Nothing else in the framework restates this one, so it earns its slot.`,
  };
}

/** A token ranking high on the variable while priced as if it does not. */
function sizeDisagreementFinding(signal: SignalRecord): SignalFinding | null {
  const found = signal.leaders.find(
    (l) => l.value !== null && l.value >= 8 && l.market_cap !== null && l.market_cap < SMALL_CAP_USD,
  );
  if (found === undefined) return null;
  return {
    label: "Where the ranking disagrees with size",
    text:
      `${found.name} (${found.symbol}) scores ${found.value} of 10 on ${signal.label}, ` +
      `${ordinal(found.rank ?? 0)} of ${signal.leaders.length}, on a market capitalisation under $500M. ` +
      `That gap between rank on this variable and rank by size is the whole reason to read the table rather than the top ten.`,
  };
}

/**
 * The findings shown on a signal page. Which paragraphs appear depends on what
 * the arithmetic supports: a variable with no near-twin renders no overlap
 * paragraph, one with no small-cap leader renders no disagreement paragraph.
 */
export function buildSignalFindings(signal: SignalRecord): readonly SignalFinding[] {
  if (!signal || typeof signal.key !== "string") return [];
  if (!Array.isArray(signal.leaders) || signal.leaders.length === 0) return [];
  return [
    distributionFinding(signal),
    compositeFinding(signal),
    pricingFinding(signal),
    overlapFinding(signal),
    sizeDisagreementFinding(signal),
  ].filter((finding): finding is SignalFinding => finding !== null);
}

export interface SignalFaq {
  readonly question: string;
  readonly answer: string;
}

/** FAQ entries built from the same arithmetic, for the page and its schema. */
export function buildSignalFaqs(signal: SignalRecord, universe: number): readonly SignalFaq[] {
  if (!signal || !Array.isArray(signal.leaders) || signal.leaders.length === 0) return [];
  const out: SignalFaq[] = [];
  const top = signal.leaders.slice(0, 5);

  out.push({
    question: `Which crypto tokens score highest on ${signal.label.toLowerCase()}?`,
    answer:
      `${top.map((t) => `${t.name} (${t.symbol}) at ${t.value}`).join(", ")} lead the ${signal.leaders.length} ` +
      `rated tokens on ${signal.label}, each scored 1 to 10 against the same definition.`,
  });

  out.push({
    question: `What is a good ${signal.label.toLowerCase()} score?`,
    answer:
      `The median across the universe is ${signal.median} of 10 and the mean is ${signal.mean}, so anything at ` +
      `7 or above sits well inside the top of the distribution. Only ${signal.extremes.at_nine_or_ten} of ` +
      `${universe} tokens reach 9 or 10.`,
  });

  if (signal.mcap_rho !== null) {
    out.push({
      question: `Does ${signal.label.toLowerCase()} affect a token's market cap?`,
      answer:
        `Rank correlation between ${signal.label} and market capitalisation is ${signal.mcap_rho} across ` +
        `${signal.mcap_n} tokens with live market data. ` +
        (signal.mcap_rho <= IGNORED_RHO
          ? "That is close to none, so the market is not pricing this variable today."
          : signal.mcap_rho >= PRICED_RHO
            ? "That is a clear relationship, so most of a high score is already in the price."
            : "That is a weak relationship, so the market prices it only partly."),
    });
  }

  return out;
}

// ---- Per-token reading of the pricing layer -------------------------------

/** A token scores well on a variable at or above this. */
const TOKEN_STRENGTH = 7;
/** And badly at or below this. */
const TOKEN_WEAKNESS = 3;
const MAX_LISTED = 4;

/** Rank correlation with market cap, per variable key. */
function pricingByKey(): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  const all = getAllSignals();
  for (let i = 0; i < all.length && i < MAX_SIGNALS; i += 1) {
    if (all[i].mcap_rho === null) continue;
    out.set(all[i].key, all[i].mcap_rho as number);
  }
  return out;
}

/** Variable labels as readable prose, truncated with a remainder count. */
function labelList(items: readonly ScoredVariable[]): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const labels = items.map((v) => v.label);
  if (labels.length === 1) return labels[0];
  // Truncating to save one item reads worse than just listing it.
  if (labels.length <= MAX_LISTED + 1) {
    return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  }
  return `${labels.slice(0, MAX_LISTED).join(", ")} and ${labels.length - MAX_LISTED} more`;
}

/** Splits a token's variables into what the market pays for and what it ignores. */
function splitByPricing(token: ScorecardToken, floor: number, isStrength: boolean) {
  const pricing = pricingByKey();
  const picked = token.variables.filter((v) =>
    isStrength ? v.value >= floor : v.value <= floor,
  );
  return {
    priced: picked.filter((v) => (pricing.get(v.key) ?? 0) >= PRICED_RHO),
    ignored: picked.filter((v) => (pricing.get(v.key) ?? 1) <= IGNORED_RHO),
    all: picked,
  };
}

/** Highest-scoring variables a token has, best first. */
function topVariables(token: ScorecardToken, count: number): readonly ScoredVariable[] {
  const sorted = [...token.variables].sort((a, b) => b.value - a.value || a.rank - b.rank);
  return sorted.slice(0, count);
}

/**
 * For the 113 tokens that clear 7 on nothing at all. Saying "no strengths" and
 * stopping is true but useless, so this reads their best three against the same
 * pricing question the stronger tokens get.
 */
function bestOfABadHandSentence(token: ScorecardToken): string {
  const pricing = pricingByKey();
  const best = topVariables(token, 3);
  const rendered = best.map((v) => `${v.label} at ${v.value}`).join(", ");
  const ignored = best.filter((v) => (pricing.get(v.key) ?? 1) <= IGNORED_RHO);
  const priced = best.filter((v) => (pricing.get(v.key) ?? 0) >= PRICED_RHO);
  const opener =
    `${token.symbol} clears ${TOKEN_STRENGTH} of 10 on none of the 25 variables. Its best three are ` +
    `${rendered}.`;
  if (priced.length > 0 && ignored.length === 0) {
    return `${opener} The market does pay for ${labelList(priced)}, so even the little that works here is already in the price.`;
  }
  if (ignored.length > 0 && priced.length === 0) {
    return `${opener} The market prices none of those, so there is nothing here it is failing to notice either. This is a low score on things nobody is bidding for.`;
  }
  return `${opener} That is a thin hand whichever way the market prices it, and the ranking is the honest reading.`;
}

/** The sentence about strengths, which differs by how the split falls. */
function strengthSentence(token: ScorecardToken): string {
  const s = splitByPricing(token, TOKEN_STRENGTH, true);
  if (s.all.length === 0) return bestOfABadHandSentence(token);
  if (s.ignored.length > 0 && s.priced.length === 0) {
    return (
      `Every variable ${token.symbol} scores ${TOKEN_STRENGTH} or better on is one the market does ` +
      `not currently charge for: ${labelList(s.ignored)}. On the evidence, none of what this token ` +
      `is good at is reflected in what it costs, which is the entire case for owning it and the ` +
      `entire reason it may stay cheap.`
    );
  }
  if (s.priced.length > 0 && s.ignored.length === 0) {
    return (
      `${token.symbol} is strong on ${labelList(s.priced)}, and those are variables the market ` +
      `demonstrably pays for across the rated universe. Most of that quality is already in the price.`
    );
  }
  if (s.priced.length > 0 && s.ignored.length > 0) {
    return (
      `${token.symbol}'s strengths split in two. ${labelList(s.priced)} are variables the market ` +
      `already pays up for, so that part of the score is priced. ${labelList(s.ignored)} are ` +
      `variables it does not price at all, and that is where holding this token is a disagreement ` +
      `with the market rather than an agreement with it.`
    );
  }
  return (
    `${token.symbol} is strong on ${labelList(s.all)}. The market prices those variables only ` +
    `partly, so the score is neither fully reflected in the price nor fully ignored by it.`
  );
}

/** The sentence about weaknesses, only where there is something to say. */
function weaknessSentence(token: ScorecardToken): string {
  const w = splitByPricing(token, TOKEN_WEAKNESS, false);
  if (w.all.length === 0) return "";
  if (w.priced.length > 0) {
    return (
      ` It is weak on ${labelList(w.priced)}, which the market does price, so that damage is ` +
      `already done and visible in the valuation.`
    );
  }
  if (w.ignored.length > 0) {
    return (
      ` Its weaknesses sit in ${labelList(w.ignored)}, none of which the market is currently ` +
      `punishing. A risk nobody is charging for is still a risk.`
    );
  }
  return "";
}

/**
 * How a token's own scores line up against what the market pays for. This is
 * the one reading a single-token page cannot produce on its own: it needs the
 * correlation of every variable against market capitalisation across the whole
 * rated universe, which is what the signal layer computes.
 */
export function buildTokenPricingFinding(token: ScorecardToken): SignalFinding | null {
  if (!token || !Array.isArray(token.variables) || token.variables.length === 0) return null;
  if (getAllSignals().length === 0) return null;
  return {
    label: "Priced or unpriced",
    text: `${strengthSentence(token)}${weaknessSentence(token)}`,
  };
}
