import type { Metadata } from "next";
import Link from "next/link";
import { getGraveyardOpportunities } from "@/lib/data";
import { formatDate, getAssetClassLabel } from "@/lib/format";
import TierBadge from "@/components/TierBadge";
import ScoreBar from "@/components/ScoreBar";

export const metadata: Metadata = {
  title: "Opportunity Graveyard",
  description:
    "Opportunities that fell below our threshold. Transparent analysis of what went wrong and lessons learned.",
};

export default function GraveyardPage() {
  const graveyard = getGraveyardOpportunities();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader count={graveyard.length} />
        <GraveyardIntro />
        {graveyard.length > 0 ? (
          <GraveyardTable opportunities={graveyard} />
        ) : (
          <EmptyState />
        )}
        <LessonsLearned />
      </div>
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">
        Opportunity Graveyard
      </h1>
      <p className="mt-2 text-text-secondary">
        {count} opportunit{count === 1 ? "y" : "ies"} that fell below threshold.
        Transparent tracking of what failed and why.
      </p>
    </div>
  );
}

function GraveyardIntro() {
  return (
    <div className="mt-8 rounded-xl border border-danger/20 bg-danger/5 p-6">
      <p className="text-sm leading-relaxed text-text-secondary">
        Transparency is core to our methodology. When an opportunity falls below
        our scoring threshold or is abandoned, we move it to the Graveyard
        with a full analysis of what went wrong. This record helps refine our
        signals and provides valuable lessons for the community.
      </p>
    </div>
  );
}

function GraveyardTable({
  opportunities,
}: {
  readonly opportunities: ReturnType<typeof getGraveyardOpportunities>;
}) {
  if (!Array.isArray(opportunities)) return null;

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-wider text-text-secondary">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Class</th>
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="min-w-[140px] px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {opportunities.map((opp) => (
            <GraveyardRow key={opp.slug} opportunity={opp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GraveyardRow({
  opportunity,
}: {
  readonly opportunity: ReturnType<typeof getGraveyardOpportunities>[number];
}) {
  if (!opportunity || typeof opportunity.slug !== "string") return null;

  return (
    <tr className="bg-card/50 transition-colors hover:bg-surface">
      <td className="px-4 py-3">
        <Link
          href={`/opportunities/${opportunity.slug}`}
          className="font-medium text-text-primary/60 hover:text-amber"
        >
          {opportunity.name}
          {opportunity.ticker && (
            <span className="ml-2 font-mono text-xs text-text-secondary/60">
              {opportunity.ticker}
            </span>
          )}
        </Link>
      </td>
      <td className="px-4 py-3 text-text-secondary/60">{opportunity.category}</td>
      <td className="px-4 py-3 text-text-secondary/60">
        {getAssetClassLabel(opportunity.asset_class)}
      </td>
      <td className="px-4 py-3">
        <TierBadge tier={opportunity.tier} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ScoreBar score={opportunity.composite_score} />
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary/60">
        {formatDate(opportunity.updated_at)}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
      <div className="text-4xl">&#9760;</div>
      <h3 className="mt-4 font-display text-xl text-text-primary">
        No Bodies Yet
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        All tracked opportunities are still active. When one falls below our
        threshold, it will appear here with a full postmortem.
      </p>
    </div>
  );
}

function LessonsLearned() {
  return (
    <section className="mt-12 border-t border-border pt-12">
      <h2 className="font-display text-2xl">Lessons From the Graveyard</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <LessonCard
          title="Narrative Without Substance"
          description="Strong narrative scores without matching working code or dev activity signals often indicate hype-driven opportunities that collapse once attention fades."
        />
        <LessonCard
          title="Community Decay"
          description="Rapidly declining community scores are the earliest warning sign. When genuine engagement drops, other signals typically follow within 3-6 months."
        />
        <LessonCard
          title="Single Point of Failure"
          description="Opportunities dependent on a single founder, single exchange listing, or single partnership are fragile. Diversified signal profiles are more resilient."
        />
        <LessonCard
          title="Ignoring the Hard to Buy Signal"
          description="Paradoxically, opportunities that become too easy to access often lose their asymmetric edge. The friction that deters casual investors is also what creates opportunity."
        />
      </div>
    </section>
  );
}

function LessonCard({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
