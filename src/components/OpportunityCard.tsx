import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { SIGNAL_KEYS } from "@/lib/types";
import TierBadge from "./TierBadge";

interface OpportunityCardProps {
  readonly opportunity: Opportunity;
}

/** Editorial grid-row card with signal rail for opportunity display. */
export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  console.assert(opportunity != null, "OpportunityCard: opportunity required");
  console.assert(typeof opportunity.slug === "string", "OpportunityCard: slug must be string");

  const citationCount = Array.isArray(opportunity.citations) ? opportunity.citations.length : 0;

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="block border-b border-line-2 py-6 pr-6 transition-colors hover:bg-bolt/[0.04] cursor-pointer"
    >
      <div className="flex justify-between items-start gap-5">
        <CardBody
          opportunity={opportunity}
          citationCount={citationCount}
        />
        <ScoreColumn score={opportunity.composite_score} />
      </div>
    </Link>
  );
}

/** Left column: name, meta row, one-liner, signal rail. */
function CardBody({
  opportunity,
  citationCount,
}: {
  readonly opportunity: Opportunity;
  readonly citationCount: number;
}) {
  console.assert(typeof opportunity.name === "string", "CardBody: name must be string");
  console.assert(typeof citationCount === "number", "CardBody: citationCount must be number");

  const sourceLabel = citationCount === 1 ? "source" : "sources";

  return (
    <div className="flex-1 min-w-0">
      <NameRow name={opportunity.name} ticker={opportunity.ticker} />
      <MetaRow
        category={opportunity.category}
        citationCount={citationCount}
        sourceLabel={sourceLabel}
        tier={opportunity.tier}
      />
      <p className="mt-3 text-sm leading-relaxed text-text-primary/75 max-w-[460px] tracking-tight line-clamp-2">
        {opportunity.one_liner}
      </p>
      <SignalRail signals={opportunity.signals} />
    </div>
  );
}

/** Name + ticker badge inline. */
function NameRow({
  name,
  ticker,
}: {
  readonly name: string;
  readonly ticker: string | null;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <h3
        className="font-serif font-normal text-[26px] leading-none tracking-tight text-text-primary"
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        {name}
      </h3>
      {ticker && (
        <span className="font-mono text-[11px] font-medium text-bolt px-1.5 py-0.5 border border-bolt/40 rounded">
          {ticker}
        </span>
      )}
    </div>
  );
}

/** Category, citation count, tier badge row. */
function MetaRow({
  category,
  citationCount,
  sourceLabel,
  tier,
}: {
  readonly category: string;
  readonly citationCount: number;
  readonly sourceLabel: string;
  readonly tier: 1 | 2 | 3;
}) {
  return (
    <div className="mt-2 flex items-center gap-2.5 font-mono text-[10px] font-medium text-text-secondary uppercase tracking-wider flex-wrap">
      <span>{category}</span>
      <span aria-hidden="true">&middot;</span>
      <span>{citationCount} {sourceLabel}</span>
      <TierBadge tier={tier} />
    </div>
  );
}

/** Right column: large composite score. */
function ScoreColumn({ score }: { readonly score: number }) {
  console.assert(typeof score === "number", "ScoreColumn: score must be number");
  console.assert(!isNaN(score), "ScoreColumn: score must not be NaN");

  return (
    <div className="text-right flex-shrink-0">
      <div
        className="font-serif font-normal text-[64px] leading-none tracking-[-0.05em] text-bolt"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {Math.round(score)}
      </div>
      <div className="font-mono text-[10px] font-medium text-text-secondary uppercase tracking-wider mt-1">
        / 100
      </div>
    </div>
  );
}

/** Horizontal mini-bars showing each of the 8 signal strengths. */
function SignalRail({ signals }: { readonly signals: Opportunity["signals"] }) {
  if (!signals) return null;

  return (
    <div className="flex gap-0.5 mt-3.5" title="8 signal scores">
      {SIGNAL_KEYS.map((key) => {
        const value = typeof signals[key] === "number" ? signals[key] : 0;
        const width = Math.min(100, Math.max(0, value));
        return (
          <div key={key} className="flex-1 h-1 bg-line-2 rounded-sm overflow-hidden">
            <div
              className="h-full bg-bolt rounded-sm"
              style={{ width: `${width}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
