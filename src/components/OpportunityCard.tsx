import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import TierBadge from "./TierBadge";

interface OpportunityCardProps {
  readonly opportunity: Opportunity;
}

/** Card component for grid display of opportunities. */
export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  if (!opportunity || typeof opportunity.slug !== "string") {
    return null;
  }

  const tierBorderClass = opportunity.tier === 1 ? "border-t border-t-[#444]" : "";

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className={`block bg-bg-card rounded-2xl border border-border p-6 hover:border-border-hover transition-colors duration-200 cursor-pointer ${tierBorderClass}`}
    >
      <CardHeader opportunity={opportunity} />
      <div className="mt-1">
        {opportunity.ticker && (
          <span className="font-mono text-sm text-text-tertiary">
            {opportunity.ticker}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-2">
        {opportunity.one_liner}
      </p>
      <CardFooter opportunity={opportunity} />
    </Link>
  );
}

function CardHeader({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="flex justify-between items-start">
      <h3 className="text-base font-semibold text-text-primary tracking-tight">
        {opportunity.name}
      </h3>
      <span className={`font-mono text-2xl font-semibold ${getScoreColor(opportunity.composite_score)}`}>
        {Math.round(opportunity.composite_score)}
      </span>
    </div>
  );
}

function CardFooter({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="mt-4 pt-4 border-t border-border flex justify-between">
      <span className="text-xs text-text-tertiary">{opportunity.category}</span>
      <TierBadge tier={opportunity.tier} />
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}
