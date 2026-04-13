import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllOpportunities,
  getOpportunityBySlug,
  getRelatedOpportunities,
} from "@/lib/data";
import {
  formatDate,
  getAssetClassLabel,
  formatScore,
  formatPrice,
  formatMarketCap,
  formatVolume,
} from "@/lib/format";
import type { Opportunity } from "@/lib/types";
import TierBadge from "@/components/TierBadge";
import OpportunityCard from "@/components/OpportunityCard";
import { PremiumSection } from "@/components/OpportunityDetail";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  const opportunities = getAllOpportunities();
  return opportunities.map((opp) => ({ slug: opp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const opp = getOpportunityBySlug(slug);
  if (!opp) return { title: "Not Found" };
  return {
    title: `${opp.name} Analysis`,
    description: opp.one_liner,
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const opportunity = getOpportunityBySlug(slug);

  if (!opportunity) {
    return <NotFoundFallback />;
  }

  const related = getRelatedOpportunities(opportunity);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <DetailHeader opportunity={opportunity} />
        <FreeTierSection opportunity={opportunity} />
        <MarketDataSection opportunity={opportunity} />
        <PremiumSection opportunity={opportunity} />
        {related.length > 0 && <RelatedSection related={related} />}
      </div>
    </div>
  );
}

function NotFoundFallback() {
  return (
    <div className="px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl">Opportunity Not Found</h1>
      <p className="mt-2 text-text-secondary">
        This opportunity does not exist or has been removed.
      </p>
      <Link
        href="/opportunities"
        className="mt-4 inline-block text-sm text-amber hover:underline"
      >
        Browse all opportunities
      </Link>
    </div>
  );
}

function DetailHeader({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Link href="/opportunities" className="text-sm text-text-tertiary hover:text-text-secondary">
          &larr; All Opportunities
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary tracking-tight sm:text-4xl">
          {opportunity.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {opportunity.ticker && (
            <span className="font-mono text-sm text-text-tertiary">{opportunity.ticker}</span>
          )}
          <TierBadge tier={opportunity.tier} />
          <span className="text-xs text-text-tertiary">
            {getAssetClassLabel(opportunity.asset_class)}
          </span>
          <span className="text-xs text-text-tertiary">
            {opportunity.category}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-4xl font-semibold ${getDetailScoreColor(opportunity.composite_score)}`}>
          {formatScore(opportunity.composite_score)}
        </div>
        <div className="text-xs text-text-tertiary uppercase tracking-widest font-mono mt-1">
          Composite Score
        </div>
        <div className="mt-1 text-xs text-text-tertiary">
          Updated {formatDate(opportunity.updated_at)}
        </div>
      </div>
    </div>
  );
}

function getDetailScoreColor(score: number): string {
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}

function FreeTierSection({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="mt-8 bg-bg-card border border-border rounded-2xl p-6">
      <p className="text-lg leading-relaxed text-text-primary">
        {opportunity.one_liner}
      </p>
    </div>
  );
}

function MarketDataSection({ opportunity }: { readonly opportunity: Opportunity }) {
  if (opportunity.current_price_usd === null) return null;

  return (
    <div className="mt-8 bg-bg-card border border-border rounded-2xl p-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <MarketDataItem label="Current Price" value={formatPrice(opportunity.current_price_usd)} />
        <MarketDataItem label="Market Cap" value={formatMarketCap(opportunity.market_cap_usd)} />
        <MarketDataItem label="24h Volume" value={formatVolume(opportunity.volume_24h_usd)} />
        <MarketDataItem label="Last Updated" value={formatDate(opportunity.updated_at)} />
      </div>
    </div>
  );
}

function MarketDataItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <div className="text-xs text-text-tertiary uppercase tracking-widest font-mono">{label}</div>
      <div className="mt-1 text-2xl font-mono font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function RelatedSection({
  related,
}: {
  readonly related: readonly Opportunity[];
}) {
  return (
    <div className="mt-12">
      <h2 className="font-display text-2xl">Related Opportunities</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((opp) => (
          <OpportunityCard key={opp.slug} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
