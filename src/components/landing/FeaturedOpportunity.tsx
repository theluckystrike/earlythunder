import Link from "next/link";
import type { Signals } from "@/lib/types";
import { SIGNAL_LABELS, SIGNAL_KEYS } from "@/lib/types";

/* ─── Types ─── */

interface TopSignalProps {
  readonly opportunity: {
    readonly name: string;
    readonly ticker: string | null;
    readonly category: string;
    readonly composite_score: number;
    readonly thesis: string;
    readonly signals: {
      readonly working_code: number;
      readonly dev_activity: number;
      readonly smart_money: number;
      readonly community: number;
      readonly catalyst: number;
      readonly narrative: number;
      readonly valuation_gap: number;
      readonly obscurity: number;
    };
    readonly slug: string;
  };
  readonly totalOpportunities: number;
}

/** Signal dimension source labels for the right panel. */
const SIGNAL_SOURCES: Record<keyof Signals, string> = {
  working_code: "GH \u00B7 Mainnet \u00B7 TVL",
  dev_activity: "GH commits 30d",
  smart_money: "Nansen \u00B7 Arkham",
  community: "X velocity \u00B7 Discord",
  catalyst: "Token unlock timing",
  narrative: "Mindshare delta",
  valuation_gap: "Fees/FDV ratio",
  obscurity: "DAU penetration",
} as const;

/* ─── Helpers ─── */

/** Returns CSS custom property color for a given score tier. */
function getTierColor(score: number): string {
  if (score >= 85) return "var(--color-score-elite, #3B82F6)";
  if (score >= 70) return "var(--color-score-high, #34C759)";
  if (score >= 50) return "var(--color-score-mid, #FF9F0A)";
  return "var(--color-score-low, #6B7280)";
}

/* ─── DimBar ─── */

interface DimBarProps {
  readonly label: string;
  readonly value: number;
  readonly source: string;
  readonly index: number;
}

/** Single dimension bar with label, fill track, and source. */
function DimBar({ label, value, source, index }: DimBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const color = getTierColor(clamped);

  return (
    <div className="dim">
      <div className="dim__head">
        <span className="dim__label">
          {label}<sup className="cite">[{index + 1}]</sup>
        </span>
        <span className="dim__val" style={{ color }}>{value}</span>
      </div>
      <div className="dim__track">
        <div
          className="dim__fill"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <span className="dim__src">{source}</span>
    </div>
  );
}

/* ─── MetricsRow ─── */

interface MetricItem {
  readonly label: string;
  readonly value: string;
}

interface MetricsRowProps {
  readonly metrics: readonly MetricItem[];
}

/** Row of 5 metric columns below the thesis. */
function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="signal-card__metrics">
      {metrics.map((m) => (
        <div key={m.label} className="metric">
          <span className="metric__label">{m.label}</span>
          <span className="metric__value">{m.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── SignalCardRight ─── */

interface SignalCardRightProps {
  readonly signals: TopSignalProps["opportunity"]["signals"];
}

/** Right panel with 8 signal dimension bars. */
function SignalCardRight({ signals }: SignalCardRightProps) {
  return (
    <div className="signal-card__right">
      <div className="signal-card__right-head">
        <span>8 SIGNAL DIMENSIONS</span>
      </div>
      <div className="dims">
        {SIGNAL_KEYS.map((key, idx) => (
          <DimBar
            key={key}
            label={SIGNAL_LABELS[key]}
            value={signals[key]}
            source={SIGNAL_SOURCES[key]}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── SignalCardLeft ─── */

interface SignalCardLeftProps {
  readonly opportunity: TopSignalProps["opportunity"];
}

/** Left panel with name, score, thesis, pills, metrics, and CTAs. */
function SignalCardLeft({ opportunity }: SignalCardLeftProps) {
  const { name, ticker, category, composite_score, thesis, signals, slug } =
    opportunity;
  const color = getTierColor(composite_score);
  const fillWidth = Math.min(composite_score, 100);

  /* Build signal pills from keys that score >= 60 */
  const activePills = SIGNAL_KEYS.filter((k) => signals[k] >= 60);

  /* Placeholder metrics derived from opportunity data */
  const metrics: readonly MetricItem[] = [
    { label: "TVL", value: "\u2014" },
    { label: "Annualized rev", value: "\u2014" },
    { label: "Perps share", value: "\u2014" },
    { label: "Sources", value: "8" },
    { label: "Updated", value: "today" },
  ];

  return (
    <div className="signal-card__left">
      <div className="signal-card__top">
        <h3 className="signal-card__name">{name}</h3>
        <div className="signal-card__meta">
          {ticker && <span className="ticker">{ticker}</span>}
          <span>{category}</span>
          <span className="badge badge--tier">T1</span>
          <span className="badge badge--confirmed">CONFIRMED</span>
        </div>
      </div>

      <div className="signal-card__score-block">
        <span className="signal-card__score" style={{ color }}>
          {composite_score}
        </span>
        <span className="signal-card__score-label">CONVICTION / 100</span>
        <div className="signal-card__score-bar">
          <div
            className="signal-card__score-fill"
            style={{ width: `${fillWidth}%`, background: color }}
          />
        </div>
      </div>

      <p className="signal-card__thesis">{thesis}</p>

      <div className="signal-card__pills">
        {activePills.map((key) => (
          <span key={key} className="pill">{SIGNAL_LABELS[key]}</span>
        ))}
      </div>

      <MetricsRow metrics={metrics} />

      <div className="signal-card__cta">
        <Link href={`/opportunities/${slug}`} className="primary-btn">
          View full analysis &rarr;
        </Link>
        <a href="/intelligence/" className="ghost-btn">
          Methodology
        </a>
      </div>
    </div>
  );
}

/* ─── SignalCard ─── */

interface SignalCardProps {
  readonly opportunity: TopSignalProps["opportunity"];
}

/** Two-column signal card layout. */
function SignalCard({ opportunity }: SignalCardProps) {
  return (
    <div className="signal-card">
      <SignalCardLeft opportunity={opportunity} />
      <SignalCardRight signals={opportunity.signals} />
    </div>
  );
}

/* ─── TopSignal (default export, section wrapper) ─── */

/**
 * Section 02 — Top Signal. Displays the highest-conviction opportunity
 * with full signal dimension breakdown.
 */
export default function FeaturedOpportunity({
  opportunity,
  totalOpportunities,
}: TopSignalProps) {
  const score = opportunity.composite_score;

  return (
    <section className="top-signal">
      <div className="top-signal__header">
        <span className="top-signal__eyebrow">
          02 &mdash; TOP SIGNAL &middot; CONVICTION {score}
        </span>
        <h2 className="top-signal__title">Highest conviction this week</h2>
        <p className="top-signal__sub">
          Combined score across all 8 dimensions. Sourced and timestamped.
        </p>
        <a href="/intelligence/" className="ghost-link">
          View all {totalOpportunities} opportunities &rarr;
        </a>
      </div>
      <SignalCard opportunity={opportunity} />
    </section>
  );
}
