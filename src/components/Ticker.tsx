import type { Opportunity } from "@/lib/types";
import { formatScore } from "@/lib/format";

interface TickerProps {
  readonly opportunities: readonly Opportunity[];
}

const MIN_ITEMS = 1;
const MAX_ITEMS = 50;

/** Horizontal scrolling marquee of opportunity names and scores. Editorial style. */
export default function Ticker({ opportunities }: TickerProps) {
  console.assert(Array.isArray(opportunities), "Ticker: opportunities must be array");
  console.assert(opportunities.length >= 0, "Ticker: opportunities length must be non-negative");

  if (!Array.isArray(opportunities) || opportunities.length < MIN_ITEMS) {
    return null;
  }

  const items = opportunities.slice(0, MAX_ITEMS);

  return (
    <div className="h-9 overflow-hidden border-t border-b border-line-2 bg-bg-card/60">
      <div className="flex h-full animate-ticker items-center whitespace-nowrap">
        <TickerStrip items={items} />
        <TickerStrip items={items} />
      </div>
    </div>
  );
}

/** Single copy of the ticker strip (doubled for seamless loop). */
function TickerStrip({
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

/** Individual ticker entry: name, optional ticker symbol, score. */
function TickerItem({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  if (!opportunity.name || typeof opportunity.composite_score !== "number") {
    return null;
  }

  return (
    <span className="flex items-center gap-2.5 font-mono text-[11px]">
      <span className="text-text-primary font-medium">{opportunity.name}</span>
      {opportunity.ticker && (
        <span className="text-text-secondary">{opportunity.ticker}</span>
      )}
      <span className="font-semibold text-bolt">
        {formatScore(opportunity.composite_score)}
      </span>
    </span>
  );
}
