import clarityData from "../../data/clarity-act.json";
import clarityTopics from "../../data/clarity-act-topics.json";
import scorecardData from "../../data/altcoin-scorecard.json";

/* ─── Types ───────────────────────────────────────────────── */

export interface ClaritySource {
  readonly label: string;
  readonly url: string;
}

export interface ClarityTimelineEntry {
  readonly date: string;
  readonly title: string;
  readonly detail: string;
  readonly source: string;
}

export interface ClarityBacker {
  readonly firm: string;
  readonly headline_figure_usd: number;
  readonly headline_label: string;
  readonly what_it_measures: string;
  readonly as_of: string;
  readonly discretionary: boolean;
  readonly note: string;
  readonly quote?: string;
  readonly quote_attribution?: string;
  readonly source: string;
}

export interface ClarityBlocker {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly who: string;
  readonly source: string;
}

export interface ClarityProvision {
  readonly id: string;
  readonly title: string;
  readonly plain_english: string;
  readonly why_it_matters: string;
  readonly source?: string;
}

export interface ClaritySection {
  readonly h2: string;
  readonly body: readonly string[];
}

export interface ClarityFaq {
  readonly question: string;
  readonly answer: string;
}

export interface ClarityTopic {
  readonly slug: string;
  readonly h1: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly question: string;
  readonly tldr: string;
  readonly sections: readonly ClaritySection[];
  readonly faqs: readonly ClarityFaq[];
  readonly related: readonly string[];
  readonly sources: readonly ClaritySource[];
}

export interface ReadinessToken {
  readonly symbol: string;
  readonly name: string;
  readonly regulatory_safety: number;
  readonly holder_concentration: number;
  readonly institutional_adoption: number;
  readonly readiness: number;
  readonly band: ReadinessBand;
  readonly market_cap_usd: number;
}

export type ReadinessBand = "clear" | "probable" | "contested" | "exposed";

export interface ReadinessBandSummary {
  readonly band: ReadinessBand;
  readonly label: string;
  readonly range: string;
  readonly count: number;
  readonly market_cap_usd: number;
}

export interface ClarityReadiness {
  readonly updated_at: string;
  readonly total_tokens: number;
  readonly median: number;
  readonly bands: readonly ReadinessBandSummary[];
  readonly top: readonly ReadinessToken[];
  readonly exposed: readonly ReadinessToken[];
}

/* ─── Loaders ─────────────────────────────────────────────── */

/** Bounded to keep any single render deterministic and small. */
const MAX_TOPICS = 40;
const MAX_TABLE_ROWS = 12;

/** Weights for the readiness composite. Sum to 10 so the result lands on 0-100. */
const WEIGHT_REGULATORY = 5;
const WEIGHT_CONCENTRATION = 3;
const WEIGHT_INSTITUTIONAL = 2;

export function getClarityMeta() {
  return clarityData.meta;
}

export function getClarityBill() {
  return clarityData.bill;
}

export function getClarityTimeline(): readonly ClarityTimelineEntry[] {
  const raw = clarityData.timeline;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function getClarityBackers(): readonly ClarityBacker[] {
  const raw = clarityData.backers;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort(
    (a, b) => b.headline_figure_usd - a.headline_figure_usd,
  ) as ClarityBacker[];
}

export function getClarityBlockers(): readonly ClarityBlocker[] {
  return Array.isArray(clarityData.blockers) ? clarityData.blockers : [];
}

export function getClarityProvisions(): readonly ClarityProvision[] {
  return Array.isArray(clarityData.provisions) ? clarityData.provisions : [];
}

export function getClarityCalendar() {
  return clarityData.calendar_math;
}

export function getClarityMarketContext() {
  return clarityData.market_context;
}

/** Total of every backer's headline figure, and of the discretionary subset only. */
export function getBackerTotals(): {
  readonly headline_usd: number;
  readonly discretionary_usd: number;
} {
  const backers = getClarityBackers();
  const headline = backers.reduce((sum, b) => sum + b.headline_figure_usd, 0);
  const discretionary = backers
    .filter((b) => b.discretionary)
    .reduce((sum, b) => sum + b.headline_figure_usd, 0);
  return { headline_usd: headline, discretionary_usd: discretionary };
}

export function getAllClarityTopics(): readonly ClarityTopic[] {
  const raw: unknown = clarityTopics;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_TOPICS) as ClarityTopic[];
}

export function getClarityTopicBySlug(slug: string): ClarityTopic | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  return getAllClarityTopics().find((t) => t.slug === slug) ?? null;
}

/* ─── Readiness composite, derived live from the scorecard ── */

interface ScorecardToken {
  readonly symbol?: string;
  readonly name?: string;
  readonly market_cap?: unknown;
  readonly scores?: unknown;
}

/**
 * Scorecard `scores` ships as either an object or a Python-style dict string.
 * Returns a numeric map, or null when the entry is unusable.
 */
function parseScores(value: unknown): Record<string, number> | null {
  if (value && typeof value === "object") {
    return value as Record<string, number>;
  }
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const jsonish = value.replace(/'/g, '"').replace(/\bNone\b/g, "null");
    const parsed: unknown = JSON.parse(jsonish);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, number>;
    }
    return null;
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toBand(readiness: number): ReadinessBand {
  if (readiness >= 70) return "clear";
  if (readiness >= 50) return "probable";
  if (readiness >= 35) return "contested";
  return "exposed";
}

const BAND_LABELS: Readonly<Record<ReadinessBand, { label: string; range: string }>> = {
  clear: { label: "Clear path", range: "70 and above" },
  probable: { label: "Probable commodity", range: "50 to 69" },
  contested: { label: "Contested", range: "35 to 49" },
  exposed: { label: "Most exposed", range: "below 35" },
};

/** Every scorecard token scored against the three CLARITY-relevant variables. */
export function getReadinessTokens(): readonly ReadinessToken[] {
  const raw: unknown = (scorecardData as { tokens?: unknown }).tokens;
  if (!Array.isArray(raw)) return [];

  const rows: ReadinessToken[] = [];
  for (const entry of raw as ScorecardToken[]) {
    if (!entry || typeof entry.symbol !== "string") continue;
    const scores = parseScores(entry.scores);
    if (!scores) continue;

    const reg = toNumber(scores.regulatory_safety);
    const conc = toNumber(scores.holder_concentration);
    const inst = toNumber(scores.institutional_adoption);
    if (reg <= 0 || conc <= 0 || inst <= 0) continue;

    const readiness = Math.round(
      reg * WEIGHT_REGULATORY +
        conc * WEIGHT_CONCENTRATION +
        inst * WEIGHT_INSTITUTIONAL,
    );

    rows.push({
      symbol: entry.symbol,
      name: typeof entry.name === "string" ? entry.name : entry.symbol,
      regulatory_safety: reg,
      holder_concentration: conc,
      institutional_adoption: inst,
      readiness,
      band: toBand(readiness),
      market_cap_usd: toNumber(entry.market_cap),
    });
  }

  rows.sort((a, b) => b.readiness - a.readiness);
  return rows;
}

/** Aggregate view used by the hub and the classification-risk page. */
export function getClarityReadiness(): ClarityReadiness {
  const tokens = getReadinessTokens();
  const bandOrder: readonly ReadinessBand[] = ["clear", "probable", "contested", "exposed"];

  const bands: ReadinessBandSummary[] = bandOrder.map((band) => {
    const members = tokens.filter((t) => t.band === band);
    return {
      band,
      label: BAND_LABELS[band].label,
      range: BAND_LABELS[band].range,
      count: members.length,
      market_cap_usd: members.reduce((sum, t) => sum + t.market_cap_usd, 0),
    };
  });

  const sortedScores = tokens.map((t) => t.readiness).sort((a, b) => a - b);
  const mid = Math.floor(sortedScores.length / 2);
  const median =
    sortedScores.length === 0
      ? 0
      : sortedScores.length % 2 === 0
        ? Math.round((sortedScores[mid - 1] + sortedScores[mid]) / 2)
        : sortedScores[mid];

  const exposed = tokens
    .filter((t) => t.band === "exposed")
    .sort((a, b) => b.market_cap_usd - a.market_cap_usd)
    .slice(0, MAX_TABLE_ROWS);

  return {
    updated_at: (scorecardData as { updated_at?: string }).updated_at ?? "",
    total_tokens: tokens.length,
    median,
    bands,
    top: tokens.slice(0, MAX_TABLE_ROWS),
    exposed,
  };
}
