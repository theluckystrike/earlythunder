import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { SIGNAL_KEYS } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";

interface TopOpportunitiesProps {
  readonly opportunities: readonly Opportunity[];
}

/** Get score color class for a composite score. */
function getScoreColor(score: number): string {
  console.assert(typeof score === "number", "getScoreColor: score must be a number");
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}

/** Compute the signal bar strength as a 0-8 level for the visual rail. */
function signalToLevel(value: number): number {
  console.assert(typeof value === "number", "signalToLevel: value must be a number");
  const clamped = Math.max(0, Math.min(100, value));
  return Math.round(clamped / 12.5);
}

/** Signal rail: 8 small bars showing signal strengths. */
function SignalRail({ signals }: { readonly signals: Opportunity["signals"] }) {
  console.assert(signals != null, "SignalRail: signals must not be null");
  console.assert(typeof signals === "object", "SignalRail: signals must be an object");

  return (
    <div className="flex gap-[3px] items-end h-5">
      {SIGNAL_KEYS.map((key) => {
        const level = signalToLevel(signals[key]);
        const heightPx = Math.max(3, level * 2.5);
        const opacity = level >= 6 ? "bg-bolt" : level >= 3 ? "bg-bolt/50" : "bg-bolt/20";
        return (
          <div
            key={key}
            className={`w-[5px] rounded-sm ${opacity}`}
            style={{ height: `${heightPx}px` }}
          />
        );
      })}
    </div>
  );
}

/** Editorial opportunity grid: top scoring, live. */
export default function TopOpportunities({ opportunities }: TopOpportunitiesProps) {
  console.assert(Array.isArray(opportunities), "TopOpportunities: opportunities must be an array");
  console.assert(
    opportunities.every((o) => typeof o.slug === "string"),
    "TopOpportunities: all opportunities must have slug",
  );

  if (opportunities.length === 0) return null;

  return (
    <section className="py-24 mx-auto max-w-[1280px] px-6 lg:px-12">
      {/* Section label */}
      <div className="section-label">
        <span className="num">— 01</span>
        <span>Highest scoring · live</span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.03em] max-w-[700px]">
        Where the <em className="italic text-bolt">asymmetry</em> is strongest.
      </h2>

      {/* 2-column grid */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.slug} opportunity={opp} />
        ))}
      </div>

      {/* View all link */}
      <Link
        href="/opportunities"
        className="inline-block mt-10 font-mono text-[11px] uppercase tracking-widest text-text-secondary hover:text-text-primary transition"
      >
        View all opportunities →
      </Link>
    </section>
  );
}
