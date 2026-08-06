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

export interface Finding {
  readonly label: string;
  readonly text: string;
}

/**
 * The ranked findings for a token. Order is deliberate: standing first, then
 * what the score is built on, then what is dragging it, then the balance-sheet
 * facts that a score cannot express.
 */
export function buildFindings(token: ScorecardToken): readonly Finding[] {
  if (!token || typeof token.symbol !== "string") return [];
  if (!Array.isArray(token.variables) || token.variables.length === 0) return [];

  const findings: Finding[] = [];
  const universe = token.universe_size;
  const pct = token.percentile_overall;

  findings.push({
    label: "Standing",
    text:
      `${token.symbol} scores ${token.score} of ${token.max_score} across the 25-variable framework, ` +
      `which places it ${ordinal(token.rank_overall)} of ${universe} rated tokens and inside the ` +
      `${band(pct)} of the set. The framework verdict is ${token.verdict}.`,
  });

  if (token.strengths.length > 0) {
    const cited = token.strengths.map((v) => citeVariable(v, universe));
    const leader = token.strengths.filter((v) => v.rank <= TOP_RANK);
    const lead =
      leader.length > 0
        ? `${token.symbol} is a top-${TOP_RANK} name in the set on ${leader.length === 1 ? "one variable" : `${leader.length} variables`}. `
        : "";
    findings.push({
      label: "Carrying the score",
      text: `${lead}The score rests on ${joinProse(cited)}.`,
    });
  }

  if (token.weaknesses.length > 0) {
    const cited = token.weaknesses.map((v) => citeVariable(v, universe));
    findings.push({
      label: "Dragging the score",
      text:
        `Against the same universe, ${token.symbol} sits in the bottom third on ` +
        `${joinProse(cited)}. These are the variables that would have to move for the verdict to change.`,
    });
  }

  const { overhang_pct: overhang, dilution_x: dilutionX, circ_pct: circPct, basis } = token.dilution;
  if (overhang !== null && dilutionX !== null && overhang >= MATERIAL_OVERHANG_PCT) {
    const supplyWord = basis === "max_supply" ? "maximum supply" : "total supply";
    const severity =
      overhang >= HEAVY_OVERHANG_PCT
        ? "That is a heavy overhang: most of the eventual supply has not reached the market yet"
        : "That is a real but manageable overhang";
    findings.push({
      label: "Supply still to come",
      text:
        `Only ${circPct}% of ${token.symbol}'s ${supplyWord} is in circulation, so ${dilutionX}x the current ` +
        `float is still scheduled to arrive. Holding price per token flat while the rest enters circulation ` +
        `implies ${overhang}% of the fully diluted value sitting ahead of today's holders. ${severity}.`,
    });
  } else if (overhang !== null && overhang < MATERIAL_OVERHANG_PCT && circPct !== null) {
    findings.push({
      label: "Supply still to come",
      text:
        `${circPct}% of eventual supply is already circulating, so vesting is not a live risk for ${token.symbol}. ` +
        `Price has to be justified by demand rather than absorbed against a cliff.`,
    });
  }

  const { distance_pct: distance, recovery_x: recovery, ath } = token.drawdown;
  if (distance !== null && recovery !== null && distance <= DEEP_DRAWDOWN_PCT) {
    findings.push({
      label: "Distance from the high",
      text:
        `${token.symbol} trades ${Math.abs(distance)}% below its all-time high of ${formatPrice(ath)}. ` +
        `Recovering that level is a ${recovery}x move, not a ${Math.abs(distance)}% one, which is the ` +
        `arithmetic most drawdown charts hide.`,
    });
  } else if (distance !== null && recovery !== null) {
    findings.push({
      label: "Distance from the high",
      text:
        `${token.symbol} is ${Math.abs(distance)}% off its all-time high of ${formatPrice(ath)}, ` +
        `a ${recovery}x round trip from here.`,
    });
  }

  const delta = token.score_delta;
  if (delta !== null && Math.abs(delta) >= MATERIAL_SCORE_MOVE) {
    const direction = delta > 0 ? "gained" : "lost";
    findings.push({
      label: "Score revision",
      text:
        `The framework score ${direction} ${Math.abs(delta)} points against the previous pass ` +
        `(${token.prev_score} to ${token.score}). Revisions of this size follow a change in the underlying ` +
        `variables, not a change in price.`,
    });
  }

  const { mcap_per_tvl: perTvl, tvl } = token.tvl;
  if (perTvl !== null && tvl !== null && tvl > 0) {
    const reading =
      perTvl < 1
        ? `The token is capitalised below the value locked in the protocol`
        : `Each dollar of value locked carries ${perTvl.toFixed(2)} dollars of token market cap`;
    findings.push({
      label: "Capital backing",
      text: `${formatUsd(tvl)} sits in the protocol. ${reading}.`,
    });
  }

  return findings.slice(0, MAX_FINDINGS);
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
export function buildFaqs(token: ScorecardToken): readonly Faq[] {
  if (!token || typeof token.symbol !== "string") return [];
  if (!Array.isArray(token.variables) || token.variables.length === 0) return [];

  const universe = token.universe_size;
  const faqs: Faq[] = [
    {
      question: `What is the Early Thunder score for ${token.name} (${token.symbol})?`,
      answer:
        `${token.symbol} scores ${token.score} out of ${token.max_score} on the 25-variable framework, ` +
        `ranking ${ordinal(token.rank_overall)} of ${universe} rated tokens (${band(token.percentile_overall)}). ` +
        `The framework verdict is ${token.verdict}.`,
    },
  ];

  if (token.strengths.length > 0) {
    faqs.push({
      question: `What are ${token.symbol}'s strongest fundamentals?`,
      answer:
        `${token.symbol} ranks highest on ${joinProse(token.strengths.map((v) => citeVariable(v, universe)))}. ` +
        `Ranks are measured against all ${universe} tokens in the same scoring pass.`,
    });
  }

  if (token.weaknesses.length > 0) {
    faqs.push({
      question: `What are the weakest parts of the ${token.symbol} thesis?`,
      answer:
        `${token.symbol} scores in the bottom third of the universe on ` +
        `${joinProse(token.weaknesses.map((v) => citeVariable(v, universe)))}.` +
        (token.key_risk ? ` The single risk carried on the scorecard is: ${token.key_risk}` : ""),
    });
  }

  const { circ_pct: circPct, overhang_pct: overhang, dilution_x: dilutionX } = token.dilution;
  if (circPct !== null && overhang !== null && dilutionX !== null) {
    faqs.push({
      question: `How much ${token.symbol} supply is still to enter circulation?`,
      answer:
        `${circPct}% of eventual ${token.symbol} supply is circulating today, leaving ${dilutionX}x the ` +
        `current float still to arrive. At a flat price per token that is ${overhang}% of fully diluted ` +
        `value ahead of current holders.`,
    });
  }

  const { distance_pct: distance, recovery_x: recovery, ath } = token.drawdown;
  if (distance !== null && recovery !== null) {
    faqs.push({
      question: `How far is ${token.symbol} from its all-time high?`,
      answer:
        `${token.symbol} trades ${Math.abs(distance)}% below its all-time high of ${formatPrice(ath)}. ` +
        `Returning to that high requires a ${recovery}x move from the level used in this scoring pass.`,
    });
  }

  if (token.neighbours.length > 0) {
    faqs.push({
      question: `Which tokens have a similar profile to ${token.symbol}?`,
      answer:
        `Measured on the shape of all 25 scored variables rather than on price, the closest matches to ` +
        `${token.symbol} are ${joinProse(token.neighbours.slice(0, 4).map((n) => `${n.symbol} (${n.score})`))}. ` +
        `Similarity here means the same pattern of strengths and weaknesses, not a similar market cap.`,
    });
  }

  if (token.key_catalyst) {
    const expired = token.catalyst_expired_dates.length > 0;
    faqs.push({
      question: expired
        ? `What catalyst was ${token.symbol} scored against?`
        : `What is the next catalyst for ${token.symbol}?`,
      answer: expired
        ? `${token.key_catalyst} This was written as forward-looking when the scoring pass ran. The ${token.catalyst_expired_dates.join(" and ")} item has since passed, so read that part as history. Anything else listed may still be ahead.`
        : `${token.key_catalyst}`,
    });
  }

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
