import type { Opportunity } from "@/lib/types";
import { formatScore } from "@/lib/format";

interface TickerProps {
  readonly opportunities: readonly Opportunity[];
}

const MIN_ITEMS = 1;
const MAX_ITEMS = 50;

function getTickerScoreColor(score: number): string {
  if (typeof score !== "number" || isNaN(score)) return "text-text-tertiary";
  if (score >= 70) return "text-score-high/50";
  if (score >= 40) return "text-score-mid/50";
  return "text-score-low/50";
}

/** Horizontal scrolling marquee of opportunity names and scores. */
export default function Ticker({ opportunities }: TickerProps) {
  if (!Array.isArray(opportunities) || opportunities.length < MIN_ITEMS) {
    return null;
  }

  const items = opportunities.slice(0, MAX_ITEMS);

  return (
    <div className="h-7 overflow-hidden border-b border-bg-card bg-black">
      <div className="flex h-full animate-ticker items-center whitespace-nowrap">
        <TickerItems items={items} />
        <TickerItems items={items} />
      </div>
    </div>
  );
}

function TickerItems({
  items,
}: {
  readonly items: readonly Opportunity[];
}) {
  return (
    <div className="flex items-center gap-8 px-4" aria-hidden="true">
      {items.map((opp) => (
        <TickerItem key={opp.slug} opportunity={opp} />
      ))}
    </div>
  );
}

function TickerItem({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  if (!opportunity.name || typeof opportunity.composite_score !== "number") {
    return null;
  }

  const scoreColor = getTickerScoreColor(opportunity.composite_score);
  const ticker = opportunity.ticker;

  return (
    <span className="flex items-center gap-2 font-mono text-[11px]">
      <span className="text-text-tertiary">{opportunity.name}</span>
      {ticker && (
        <span className="text-text-tertiary">{ticker}</span>
      )}
      <span className={`font-semibold ${scoreColor}`}>
        {formatScore(opportunity.composite_score)}
      </span>
      <span className="text-text-tertiary">/</span>
    </span>
  );
}
