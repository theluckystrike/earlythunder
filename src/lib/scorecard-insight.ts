import type { ScorecardToken, ScoredVariable } from "./scorecard-analytics";

/**
 * Turns a token's derived analytics into the readable findings shown on
 * /scorecard/[symbol].
 *
 * Every sentence is assembled from computed values, and which sentences appear
 * at all depends on what the data actually says: a token with no meaningful
 * vesting overhang gets no supply paragraph, a token trading near its high gets
 * no recovery paragraph. Two tokens therefore produce structurally different
 * readings rather than the same template with different nouns.
 */

/** Thresholds that decide whether a finding is worth stating at all. */
const MATERIAL_OVERHANG_PCT = 15; // below this, vesting is not the story
const HEAVY_OVERHANG_PCT = 50;
const DEEP_DRAWDOWN_PCT = -80;
const MATERIAL_SCORE_MOVE = 5;
const TOP_RANK = 10;
const MAX_FINDINGS = 8;

/** Ordinal suffix for a positive integer. "1st", "2nd", "23rd". */
export function ordinal(value: number): string {
  if (!Number.isFinite(value) || value < 1) return String(value);
  const n = Math.floor(value);
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const rem10 = n % 10;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** Compact USD magnitude. "$1.2B", "$430M", "$12.4K". */
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "not published";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/** Price with a sensible number of decimals for its magnitude. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "not published";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

/** Recovery multiple with a thousands separator. "1.9x", "25,000x". */
export function formatMultiple(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  if (value >= 1000) return `${Math.round(value).toLocaleString("en-US")}x`;
  return `${value}x`;
}

/** ISO date rendered as "27 Jul 2026". Empty string when unparseable. */
export function formatDate(iso: string | null | undefined): string {
  if (typeof iso !== "string" || iso.length < 10) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Describes where a percentile sits, in words rather than a bare number. */
function band(percentile: number | null): string {
  if (percentile === null) return "unranked";
  if (percentile >= 95) return "top 5%";
  if (percentile >= 90) return "top 10%";
  if (percentile >= 75) return "top quartile";
  if (percentile >= 50) return "upper half";
  if (percentile >= 25) return "lower half";
  if (percentile >= 10) return "bottom quartile";
  return "bottom 10%";
}

/** Renders a variable as "Protocol Revenue 9/10, 3rd of 251". */
function citeVariable(variable: ScoredVariable, universe: number): string {
  if (!variable) return "";
  return `${variable.label} ${variable.value}/10, ${ordinal(variable.rank)} of ${universe}`;
}

/** Joins a list into readable prose: "a, b and c". */
function joinProse(parts: readonly string[]): string {
  if (!Array.isArray(parts) || parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** A lead longer than this reads as a wall under a 48px heading. */
const MAX_LEAD_CHARS = 165;

export interface SplitLead {
  /** The opening sentences, short enough to sit under the title. */
  readonly lead: string;
  /** Everything after them, or empty when the whole string fits. */
  readonly rest: string;
}

/**
 * Splits a scorecard one-liner at a sentence boundary so a long one does not
 * render as a wall of fragments under the page title. Nothing is dropped: the
 * remainder is returned for the caller to render underneath.
 */
export function splitLead(text: string | null | undefined): SplitLead {
  if (typeof text !== "string" || text.length === 0) return { lead: "", rest: "" };
  if (text.length <= MAX_LEAD_CHARS) return { lead: text, rest: "" };

  const parts = text.split(/(?<=[.!?])\s+/);
  if (parts.length < 2) return { lead: text, rest: "" };

  let lead = "";
  let i = 0;
  for (; i < parts.length && i < 20; i += 1) {
    const next = lead.length === 0 ? parts[i] : `${lead} ${parts[i]}`;
    if (lead.length > 0 && next.length > MAX_LEAD_CHARS) break;
    lead = next;
  }
  if (lead.length === 0) return { lead: text, rest: "" };
  return { lead, rest: parts.slice(i).join(" ") };
}

export interface Finding {
  readonly label: string;
  readonly text: string;
}

/** Where the token sits against the whole rated set. */
function standingFinding(token: ScorecardToken): Finding {
  return {
    label: "Standing",
    text:
      `${token.symbol} scores ${token.score} of ${token.max_score} across the 25-variable framework, ` +
      `which places it ${ordinal(token.rank_overall)} of ${token.universe_size} rated tokens and inside the ` +
      `${band(token.percentile_overall)} of the set. The framework verdict is ${token.verdict}.`,
  };
}

/** The variables holding the score up, if any clear the strength threshold. */
function strengthsFinding(token: ScorecardToken): Finding | null {
  if (token.strengths.length === 0) return null;
  const cited = token.strengths.map((v) => citeVariable(v, token.universe_size));
  const leader = token.strengths.filter((v) => v.rank <= TOP_RANK);
  const lead =
    leader.length > 0
      ? `${token.symbol} is a top-${TOP_RANK} name in the set on ${leader.length === 1 ? "one variable" : `${leader.length} variables`}. `
      : "";
  return { label: "Carrying the score", text: `${lead}The score rests on ${joinProse(cited)}.` };
}

/** The variables dragging it down, if any fall below the weakness threshold. */
function weaknessesFinding(token: ScorecardToken): Finding | null {
  if (token.weaknesses.length === 0) return null;
  const cited = token.weaknesses.map((v) => citeVariable(v, token.universe_size));
  return {
    label: "Dragging the score",
    text:
      `Against the same universe, ${token.symbol} sits in the bottom third on ` +
      `${joinProse(cited)}. These are the variables that would have to move for the verdict to change.`,
  };
}

/** Vesting arithmetic, phrased by whether the overhang is material. */
function supplyFinding(token: ScorecardToken): Finding | null {
  const { overhang_pct: overhang, dilution_x: dilutionX, circ_pct: circPct, basis } = token.dilution;
  if (overhang !== null && dilutionX !== null && overhang >= MATERIAL_OVERHANG_PCT) {
    const supplyWord = basis === "max_supply" ? "maximum supply" : "total supply";
    const severity =
      overhang >= HEAVY_OVERHANG_PCT
        ? "That is a heavy overhang: most of the eventual supply has not reached the market yet"
        : "That is a real but manageable overhang";
    return {
      label: "Supply still to come",
      text:
        `Only ${circPct}% of ${token.symbol}'s ${supplyWord} is in circulation, so ${dilutionX}x the current ` +
        `float is still scheduled to arrive. Holding price per token flat while the rest enters circulation ` +
        `implies ${overhang}% of the fully diluted value sitting ahead of today's holders. ${severity}.`,
    };
  }
  if (overhang !== null && overhang < MATERIAL_OVERHANG_PCT && circPct !== null) {
    return {
      label: "Supply still to come",
      text:
        `${circPct}% of eventual supply is already circulating, so vesting is not a live risk for ${token.symbol}. ` +
        `Price has to be justified by demand rather than absorbed against a cliff.`,
    };
  }
  return null;
}

/** Distance from the high, stated as the move needed rather than the fall taken. */
function drawdownFinding(token: ScorecardToken): Finding | null {
  const { distance_pct: distance, recovery_x: recovery, ath } = token.drawdown;
  if (distance === null || recovery === null) return null;
  if (distance <= DEEP_DRAWDOWN_PCT) {
    return {
      label: "Distance from the high",
      text:
        `${token.symbol} trades ${Math.abs(distance)}% below its all-time high of ${formatPrice(ath)}. ` +
        `Recovering that level is a ${formatMultiple(recovery)} move, not a ${Math.abs(distance)}% one, which is the ` +
        `arithmetic most drawdown charts hide.`,
    };
  }
  return {
    label: "Distance from the high",
    text:
      `${token.symbol} is ${Math.abs(distance)}% off its all-time high of ${formatPrice(ath)}, ` +
      `a ${formatMultiple(recovery)} round trip from here.`,
  };
}

/** Only rendered when the score moved materially against the previous pass. */
function revisionFinding(token: ScorecardToken): Finding | null {
  const delta = token.score_delta;
  if (delta === null || Math.abs(delta) < MATERIAL_SCORE_MOVE) return null;
  const direction = delta > 0 ? "gained" : "lost";
  return {
    label: "Score revision",
    text:
      `The framework score ${direction} ${Math.abs(delta)} points against the previous pass ` +
      `(${token.prev_score} to ${token.score}). Revisions of this size follow a change in the underlying ` +
      `variables, not a change in price.`,
  };
}

/** Market cap against value locked, where the protocol reports any. */
function capitalFinding(token: ScorecardToken): Finding | null {
  const { mcap_per_tvl: perTvl, tvl } = token.tvl;
  if (perTvl === null || tvl === null || tvl <= 0) return null;
  const reading =
    perTvl < 1
      ? `The token is capitalised below the value locked in the protocol`
      : `Each dollar of value locked carries ${perTvl.toFixed(2)} dollars of token market cap`;
  return { label: "Capital backing", text: `${formatUsd(tvl)} sits in the protocol. ${reading}.` };
}

/**
 * The ranked findings for a token. Order is deliberate: standing first, then
 * what the score is built on, then what is dragging it, then the balance-sheet
 * facts that a score cannot express.
 */
export function buildFindings(token: ScorecardToken): readonly Finding[] {
  if (!token || typeof token.symbol !== "string") return [];
  if (!Array.isArray(token.variables) || token.variables.length === 0) return [];

  return [
    standingFinding(token),
    strengthsFinding(token),
    weaknessesFinding(token),
    supplyFinding(token),
    drawdownFinding(token),
    revisionFinding(token),
    capitalFinding(token),
  ]
    .filter((finding): finding is Finding => finding !== null)
    .slice(0, MAX_FINDINGS);
}

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Question and answer pairs matching how people actually search for a token's
 * fundamentals. Answers are assembled from the same computed values as the
 * findings, so the visible page and the structured data cannot drift apart.
 */
/** Supply, drawdown and neighbour questions, each rendered only when the data supports it. */
function factualFaqs(token: ScorecardToken): Faq[] {
  const out: Faq[] = [];
  const { circ_pct: circPct, overhang_pct: overhang, dilution_x: dilutionX } = token.dilution;
  if (circPct !== null && overhang !== null && dilutionX !== null) {
    out.push({
      question: `How much ${token.symbol} supply is still to enter circulation?`,
      answer:
        `${circPct}% of eventual ${token.symbol} supply is circulating today, leaving ${dilutionX}x the ` +
        `current float still to arrive. At a flat price per token that is ${overhang}% of fully diluted ` +
        `value ahead of current holders.`,
    });
  }
  const { distance_pct: distance, recovery_x: recovery, ath } = token.drawdown;
  if (distance !== null && recovery !== null) {
    out.push({
      question: `How far is ${token.symbol} from its all-time high?`,
      answer:
        `${token.symbol} trades ${Math.abs(distance)}% below its all-time high of ${formatPrice(ath)}. ` +
        `Returning to that high requires a ${formatMultiple(recovery)} move from the level used in this scoring pass.`,
    });
  }
  if (token.neighbours.length > 0) {
    out.push({
      question: `Which tokens have a similar profile to ${token.symbol}?`,
      answer:
        `Measured on the shape of all 25 scored variables rather than on price, the closest matches to ` +
        `${token.symbol} are ${joinProse(token.neighbours.slice(0, 4).map((n) => `${n.symbol} (${n.score})`))}. ` +
        `Similarity here means the same pattern of strengths and weaknesses, not a similar market cap.`,
    });
  }
  return out;
}

/** Strength and weakness questions, which depend on the highlight thresholds. */
function highlightFaqs(token: ScorecardToken): Faq[] {
  const universe = token.universe_size;
  const out: Faq[] = [];
  if (token.strengths.length > 0) {
    out.push({
      question: `What are ${token.symbol}'s strongest fundamentals?`,
      answer:
        `${token.symbol} ranks highest on ${joinProse(token.strengths.map((v) => citeVariable(v, universe)))}. ` +
        `Ranks are measured against all ${universe} tokens in the same scoring pass.`,
    });
  }
  if (token.weaknesses.length > 0) {
    out.push({
      question: `What are the weakest parts of the ${token.symbol} thesis?`,
      answer:
        `${token.symbol} scores in the bottom third of the universe on ` +
        `${joinProse(token.weaknesses.map((v) => citeVariable(v, universe)))}.` +
        (token.key_risk ? ` The single risk carried on the scorecard is: ${token.key_risk}` : ""),
    });
  }
  return out;
}

/** The catalyst question, whose wording changes once a dated item has passed. */
function catalystFaq(token: ScorecardToken): Faq | null {
  if (!token.key_catalyst) return null;
  const expired = token.catalyst_expired_dates.length > 0;
  return {
    question: expired
      ? `What catalyst was ${token.symbol} scored against?`
      : `What is the next catalyst for ${token.symbol}?`,
    answer: expired
      ? `${token.key_catalyst} This was written as forward-looking when the scoring pass ran. The ${token.catalyst_expired_dates.join(" and ")} item has since passed, so read that part as history. Anything else listed may still be ahead.`
      : `${token.key_catalyst}`,
  };
}

export function buildFaqs(token: ScorecardToken): readonly Faq[] {
  if (!token || typeof token.symbol !== "string") return [];
  if (!Array.isArray(token.variables) || token.variables.length === 0) return [];

  const catalyst = catalystFaq(token);
  const faqs: Faq[] = [
    {
      question: `What is the Early Thunder score for ${token.name} (${token.symbol})?`,
      answer:
        `${token.symbol} scores ${token.score} out of ${token.max_score} on the 25-variable framework, ` +
        `ranking ${ordinal(token.rank_overall)} of ${token.universe_size} rated tokens (${band(token.percentile_overall)}). ` +
        `The framework verdict is ${token.verdict}.`,
    },
    ...highlightFaqs(token),
    ...factualFaqs(token),
    ...(catalyst === null ? [] : [catalyst]),
  ];
  return faqs;
}

/**
 * One-sentence summary used for the meta description and the page lead. Built
 * from rank, verdict and the single best-ranked variable so that no two tokens
 * produce the same sentence.
 */
export function buildSummary(token: ScorecardToken): string {
  if (!token || typeof token.symbol !== "string") return "";
  if (!Number.isFinite(token.score)) return "";
  const lead = token.strengths[0];
  const drag = token.weaknesses[0];
  const parts = [
    `${token.symbol} ranks ${ordinal(token.rank_overall)} of ${token.universe_size} on the 25-variable framework with ${token.score}/${token.max_score} and a ${token.verdict} verdict`,
  ];
  if (lead) parts.push(`strongest on ${lead.label} (${lead.value}/10, ${ordinal(lead.rank)})`);
  if (drag) parts.push(`weakest on ${drag.label} (${drag.value}/10)`);
  return `${parts.join(", ")}.`;
}
