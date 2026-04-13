import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";

interface TopOpportunitiesProps {
  readonly opportunities: readonly Opportunity[];
}

/** Top scoring opportunities grid. */
export default function TopOpportunities({ opportunities }: TopOpportunitiesProps) {
  if (opportunities.length === 0) return null;

  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Highest scoring
      </h2>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.slug} opportunity={opp} />
        ))}
      </div>
      <Link
        href="/opportunities"
        className="text-text-secondary hover:text-text-primary text-sm transition mt-8 block"
      >
        View all opportunities &rarr;
      </Link>
    </section>
  );
}
