import Link from "next/link";
import type { Opportunity, Signals } from "@/lib/types";
import { SIGNAL_LABELS, SIGNAL_KEYS } from "@/lib/types";

interface FeaturedOpportunityProps {
  readonly opportunity: Opportunity;
}

interface SignalBarProps {
  readonly label: string;
  readonly value: number;
}

interface SignalBarChartProps {
  readonly signals: Signals;
}

/** Returns Tailwind color class based on score threshold. */
function getBarColor(value: number): string {
  if (value >= 75) return "bg-score-high";
  if (value >= 55) return "bg-score-mid";
  return "bg-score-low";
}

/** Returns text color class for composite score display. */
function getScoreTextColor(value: number): string {
  if (value >= 75) return "text-score-high";
  if (value >= 55) return "text-score-mid";
  return "text-score-low";
}

/** Single horizontal bar for one signal dimension. */
function SignalBar({ label, value }: SignalBarProps) {
  const clamped = Math.min(value, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-tertiary w-24 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getBarColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-secondary w-7 text-right">{value}</span>
    </div>
  );
}

/** Vertical list of all 8 signal bars. */
function SignalBarChart({ signals }: SignalBarChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {SIGNAL_KEYS.map((key) => (
        <SignalBar key={key} label={SIGNAL_LABELS[key]} value={signals[key]} />
      ))}
    </div>
  );
}

/** Full-width featured card for the #1 scored opportunity. */
export default function FeaturedOpportunity({ opportunity }: FeaturedOpportunityProps) {
  const { name, ticker, one_liner, composite_score, signals, slug } = opportunity;

  return (
    <section className="bg-bg-card rounded-2xl border border-border p-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-[60%] flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-score-high font-mono">
              Top Signal
            </span>
            <h3 className="text-3xl font-semibold text-text-primary mt-2">{name}</h3>
            {ticker && (
              <p className="text-text-tertiary font-mono mt-1">{ticker}</p>
            )}
            <p className="text-text-secondary text-lg mt-3">{one_liner}</p>
          </div>
          <div className="mt-6 flex items-end gap-6">
            <span className={`text-5xl font-mono font-bold ${getScoreTextColor(composite_score)}`}>
              {composite_score}
            </span>
            <Link
              href={`/opportunities/${slug}`}
              className="text-score-high hover:underline font-medium mb-1"
            >
              View full analysis &rarr;
            </Link>
          </div>
        </div>
        <div className="md:w-[40%]">
          <SignalBarChart signals={signals} />
        </div>
      </div>
    </section>
  );
}
