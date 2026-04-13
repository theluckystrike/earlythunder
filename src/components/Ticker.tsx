import type { Opportunity } from "@/lib/types";
import { formatScore, getScoreColor } from "@/lib/format";

interface TickerProps {
  readonly opportunities: readonly Opportunity[];
}

const MIN_ITEMS = 1;
const MAX_ITEMS = 50;

/** Horizontal scrolling marquee of opportunity names and scores. */
export default function Ticker({ opportunities }: TickerProps) {
  if (!Array.isArray(opportunities) || opportunities.length < MIN_ITEMS) {
    return null;
  }

  const items = opportunities.slice(0, MAX_ITEMS);

  return (
    <div className="overflow-hidden border-b border-border bg-surface/50">
      <div className="flex animate-ticker whitespace-nowrap py-2">
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

  const scoreColor = getScoreColor(opportunity.composite_score);
  const ticker = opportunity.ticker;

  return (
    <span className="flex items-center gap-2 font-mono text-xs">
      <span className="text-text-primary">{opportunity.name}</span>
      {ticker && (
        <span className="text-text-secondary">{ticker}</span>
      )}
      <span className={`font-semibold ${scoreColor}`}>
        {formatScore(opportunity.composite_score)}
      </span>
      <span className="text-border-light">/</span>
    </span>
  );
}
