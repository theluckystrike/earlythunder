import type { Metadata } from "next";
import { getActiveOpportunities } from "@/lib/data";
import OpportunityTable from "@/components/OpportunityTable";

export const metadata: Metadata = {
  title: "Opportunity Explorer",
  description:
    "Browse and filter all tracked opportunities across digital assets, public equities, and private markets.",
};

export default function OpportunitiesPage() {
  const opportunities = getActiveOpportunities();

  if (!Array.isArray(opportunities)) {
    return <EmptyFallback />;
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader count={opportunities.length} />
        <div className="mt-8">
          <OpportunityTable opportunities={opportunities} />
        </div>
      </div>
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">
        Opportunity Explorer
      </h1>
      <p className="mt-2 text-text-secondary">
        {count} active opportunities tracked across all asset classes.
        Filter, sort, and dive deep into each signal profile.
      </p>
    </div>
  );
}

function EmptyFallback() {
  return (
    <div className="px-4 py-24 text-center sm:px-6">
      <p className="text-text-secondary">
        No opportunities available. Check back soon.
      </p>
    </div>
  );
}
