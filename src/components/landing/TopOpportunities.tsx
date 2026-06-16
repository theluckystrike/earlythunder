import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";

interface TopOpportunitiesProps {
  readonly opportunities: readonly Opportunity[];
}

const TOOL_LINKS = [
  { label: "Earnings Scanner", href: "/earnings/" },
  { label: "Deadline Tracker", href: "/deadlines/" },
  { label: "Research Library", href: "/research/" },
] as const;

/** Highest conviction opportunities grid with tool cross-links. */
export default function TopOpportunities({ opportunities }: TopOpportunitiesProps) {
  if (opportunities.length === 0) return null;

  return (
    <section className="py-20 max-w-[1280px] mx-auto px-12">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Highest Conviction Opportunities
      </h2>
      <p className="text-text-secondary text-lg mt-3 max-w-2xl">
        Scored by our 8-signal pattern filter. All analysis unlocked.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.slug} opportunity={opp} />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-1 text-sm text-text-tertiary">
        <span>Explore deeper:</span>
        <ToolLinkList />
      </div>
      <Link
        href="/opportunities"
        className="text-text-secondary hover:text-text-primary text-sm transition mt-4 block"
      >
        View all opportunities &rarr;
      </Link>
    </section>
  );
}

/** Inline list of tool cross-links separated by middots. */
function ToolLinkList() {
  return (
    <>
      {TOOL_LINKS.map((tool, i) => (
        <span key={tool.href} className="inline-flex items-center">
          {i > 0 && <span className="mx-1">&middot;</span>}
          <Link
            href={tool.href}
            className="text-text-secondary hover:text-text-primary transition"
          >
            {tool.label} &rarr;
          </Link>
        </span>
      ))}
    </>
  );
}
