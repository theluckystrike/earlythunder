import type { Metadata } from "next";
import { getActiveOpportunities } from "@/lib/data";
import OpportunityTable from "@/components/OpportunityTable";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Browse and filter all tracked opportunities across digital assets, public equities, and private markets.",
};

export default function OpportunitiesPage() {
  const opportunities = getActiveOpportunities();

  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return <EmptyFallback />;
  }

  const categories = new Set(opportunities.map((o) => o.category));

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader count={opportunities.length} categoryCount={categories.size} />
      <div className="mt-8">
        <OpportunityTable opportunities={opportunities} />
      </div>
    </div>
  );
}

function PageHeader({
  count,
  categoryCount,
}: {
  readonly count: number;
  readonly categoryCount: number;
}) {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Opportunities
      </h1>
      <p className="mt-3 text-lg text-text-secondary">
        {count} opportunities across {categoryCount} categories.
      </p>
    </div>
  );
}

function EmptyFallback() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20 text-center">
      <p className="text-text-secondary">
        No opportunities available. Check back soon.
      </p>
    </div>
  );
}
