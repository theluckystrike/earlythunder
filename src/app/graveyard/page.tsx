import type { Metadata } from "next";
import Link from "next/link";
import { getGraveyardOpportunities } from "@/lib/data";
import { formatDate, getAssetClassLabel } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Graveyard",
  description:
    "Opportunities that fell below threshold. Transparent tracking of what failed and why.",
};

export default function GraveyardPage() {
  const graveyard = getGraveyardOpportunities();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader count={graveyard.length} />
      <TransparencyCallout />
      {graveyard.length > 0 ? (
        <GraveyardTable opportunities={graveyard} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary">
        Graveyard
      </h1>
      <p className="mt-3 text-text-secondary">
        {count} opportunit{count === 1 ? "y" : "ies"} moved below threshold.
      </p>
    </div>
  );
}

function TransparencyCallout() {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-bg-card p-6">
      <p className="text-sm leading-relaxed text-text-secondary">
        Transparency is core to the methodology. When an opportunity falls
        below the scoring threshold, it moves here with full context on
        what went wrong. This record helps refine the signals.
      </p>
    </div>
  );
}

function GraveyardTable({
  opportunities,
}: {
  readonly opportunities: readonly Opportunity[];
}) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <GraveyardTableHead />
        <tbody className="divide-y divide-border">
          {opportunities.map((opp) => (
            <GraveyardRow key={opp.slug} opportunity={opp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GraveyardTableHead() {
  return (
    <thead>
      <tr className="border-b border-border">
        <th className="py-3 text-xs font-normal uppercase tracking-widest text-text-tertiary">
          Name
        </th>
        <th className="py-3 text-xs font-normal uppercase tracking-widest text-text-tertiary">
          Category
        </th>
        <th className="py-3 text-xs font-normal uppercase tracking-widest text-text-tertiary">
          Class
        </th>
        <th className="py-3 text-xs font-normal uppercase tracking-widest text-text-tertiary">
          Score
        </th>
        <th className="py-3 text-xs font-normal uppercase tracking-widest text-text-tertiary">
          Updated
        </th>
      </tr>
    </thead>
  );
}

function GraveyardRow({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  if (typeof opportunity.slug !== "string") return null;

  return (
    <tr className="opacity-60 transition-colors hover:opacity-80">
      <td className="py-3 pr-4">
        <Link
          href={`/opportunities/${opportunity.slug}`}
          className="font-medium text-text-primary hover:opacity-80"
        >
          {opportunity.name}
          {opportunity.ticker && (
            <span className="ml-2 font-mono text-xs text-text-tertiary">
              {opportunity.ticker}
            </span>
          )}
        </Link>
      </td>
      <td className="py-3 pr-4 text-text-secondary">
        {opportunity.category}
      </td>
      <td className="py-3 pr-4 text-text-secondary">
        {getAssetClassLabel(opportunity.asset_class)}
      </td>
      <td className="py-3 pr-4 font-mono font-semibold text-score-low">
        {Math.round(opportunity.composite_score)}
      </td>
      <td className="py-3 text-text-tertiary">
        {formatDate(opportunity.updated_at)}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-bg-card p-12 text-center">
      <h3 className="text-xl font-semibold tracking-tight text-text-primary">
        No Bodies Yet
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        All tracked opportunities are still active. When one falls below
        threshold, it will appear here.
      </p>
    </div>
  );
}
