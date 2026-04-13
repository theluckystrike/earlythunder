import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { getAssetClassLabel } from "@/lib/format";
import TierBadge from "./TierBadge";
import ScoreBar from "./ScoreBar";

interface OpportunityCardProps {
  readonly opportunity: Opportunity;
}

/** Card component for grid display of opportunities. */
export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  if (!opportunity || typeof opportunity.slug !== "string") {
    return null;
  }

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-amber/30 hover:shadow-lg hover:shadow-amber/5"
    >
      <CardHeader opportunity={opportunity} />
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
        {opportunity.one_liner}
      </p>
      <div className="mt-4">
        <ScoreBar score={opportunity.composite_score} />
      </div>
      <CardFooter opportunity={opportunity} />
    </Link>
  );
}

function CardHeader({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-lg text-text-primary group-hover:text-amber">
          {opportunity.name}
        </h3>
        {opportunity.ticker && (
          <span className="font-mono text-xs text-text-secondary">
            {opportunity.ticker}
          </span>
        )}
      </div>
      <TierBadge tier={opportunity.tier} />
    </div>
  );
}

function CardFooter({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  if (!opportunity.category && !opportunity.asset_class) return null;

  return (
    <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
      <span className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary">
        {getAssetClassLabel(opportunity.asset_class)}
      </span>
      <span className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary">
        {opportunity.category}
      </span>
    </div>
  );
}
