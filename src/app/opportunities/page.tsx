import type { Metadata } from "next";
import { getActiveOpportunities } from "@/lib/data";
import OpportunityTable from "@/components/OpportunityTable";
import JsonLd from "@/components/JsonLd";
import { getItemListSchema, getBreadcrumbListSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Browse and filter all tracked opportunities across digital assets, public equities, and private markets.",
};

const OPPORTUNITIES_BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Opportunities", path: "/opportunities" },
] as const;

export default function OpportunitiesPage() {
  const opportunities = getActiveOpportunities();

  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return <EmptyFallback />;
  }

  const categories = new Set(opportunities.map((o) => o.category));

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={getItemListSchema(opportunities)} />
      <JsonLd data={getBreadcrumbListSchema(OPPORTUNITIES_BREADCRUMBS)} />
      <PageHeader count={opportunities.length} categoryCount={categories.size} />
      <div className="mt-8">
        <OpportunityTable opportunities={opportunities} />
      </div>
      <RelatedToolsSection />
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

function RelatedToolsSection() {
  return (
    <section className="mt-16 border-t border-border pt-8">
      <h3 className="text-sm font-mono uppercase tracking-wider text-text-tertiary mb-4">
        Related Tools
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="/intelligence/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Intelligence Dashboard
          <span className="block mt-1 font-normal text-text-secondary">
            Live market signals and threat detection
          </span>
        </a>
        <a
          href="/earnings/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Earnings Scanner
          <span className="block mt-1 font-normal text-text-secondary">
            Upcoming earnings and catalyst calendar
          </span>
        </a>
        <a
          href="/deadlines/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Deadline Tracker
          <span className="block mt-1 font-normal text-text-secondary">
            Time-sensitive dates and regulatory events
          </span>
        </a>
      </div>
    </section>
  );
}
