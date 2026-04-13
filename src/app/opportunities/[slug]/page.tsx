import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllOpportunities,
  getOpportunityBySlug,
} from "@/lib/data";
import {
  formatDate,
  getAssetClassLabel,
  formatScore,
  formatPrice,
  formatMarketCap,
  formatVolume,
} from "@/lib/format";
import { getTierLabel } from "@/lib/format";
import type { Opportunity } from "@/lib/types";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";
import SignalRadar from "@/components/SignalRadar";
import PaywallBlur from "@/components/PaywallBlur";
import CitationSection from "@/components/CitationSection";

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

  const jsonLd = buildJsonLd(opportunity);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb opportunity={opportunity} />
      <NameBlock opportunity={opportunity} />
      <div className="mt-4 max-w-3xl text-xl leading-relaxed text-text-secondary">
        {opportunity.one_liner}
      </div>
      <div className="divider mt-8" />
      <StatsGrid opportunity={opportunity} />
      <CompositeScoreBlock score={opportunity.composite_score} />
      <RadarSection opportunity={opportunity} />
      <p className="mt-8 text-xs text-text-tertiary">
        Last updated: {formatDate(opportunity.updated_at)}
      </p>
      <div className="divider mt-8" />
      <PremiumContent opportunity={opportunity} />
      <div className="divider mt-8" />
      <CitationSection citations={opportunity.citations} />
    </div>
  );
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Opportunity Not Found
      </h1>
      <p className="mt-2 text-text-secondary">
        This opportunity does not exist or has been removed.
      </p>
      <Link
        href="/opportunities"
        className="mt-4 inline-block text-sm text-text-secondary hover:text-text-primary"
      >
        Browse all opportunities
      </Link>
    </div>
  );
}

function Breadcrumb({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <nav className="font-mono text-xs text-text-tertiary">
      <Link href="/opportunities" className="hover:text-text-secondary">
        Opportunities
      </Link>
      {" / "}
      <span>{opportunity.category}</span>
      {" / "}
      <span className="text-text-secondary">{opportunity.name}</span>
    </nav>
  );
}

function NameBlock({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="mt-8">
      <div className="flex items-baseline gap-3">
        <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
          {opportunity.name}
        </h1>
        {opportunity.ticker && (
          <span className="font-mono text-xl text-text-tertiary">
            {opportunity.ticker}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <span className="font-mono text-xs text-text-secondary">
          {getTierLabel(opportunity.tier)}
        </span>
        <span className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-tertiary">
          {opportunity.category}
        </span>
        <span className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-tertiary">
          {getAssetClassLabel(opportunity.asset_class)}
        </span>
      </div>
    </div>
  );
}

function StatsGrid({ opportunity }: { readonly opportunity: Opportunity }) {
  if (opportunity.current_price_usd === null) return null;

  return (
    <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
      <StatItem label="Price" value={formatPrice(opportunity.current_price_usd)} />
      <StatItem label="Market Cap" value={formatMarketCap(opportunity.market_cap_usd)} />
      <StatItem label="Volume 24h" value={formatVolume(opportunity.volume_24h_usd)} />
      <StatItem label="Updated" value={formatDate(opportunity.updated_at)} />
    </div>
  );
}

function StatItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold text-text-primary">
        {value}
      </div>
    </div>
  );
}

function CompositeScoreBlock({ score }: { readonly score: number }) {
  return (
    <div className="mt-8 text-center">
      <div className={`font-mono text-7xl font-semibold tracking-tight ${getScoreColor(score)}`}>
        {formatScore(score)}
      </div>
      <div className="mt-2 text-xs uppercase tracking-widest text-text-tertiary">
        Pattern match score
      </div>
      <div className="text-sm text-text-tertiary">out of 100</div>
    </div>
  );
}

function RadarSection({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <div className="mt-8">
      <div className="mx-auto max-w-md">
        <SignalRadar signals={opportunity.signals} />
      </div>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
        {SIGNAL_KEYS.map((key) => (
          <div key={key}>
            <div className="text-xs text-text-tertiary">{SIGNAL_LABELS[key]}</div>
            <div className="font-mono text-sm text-text-secondary">
              {opportunity.signals[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumContent({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <PaywallBlur>
      <PremiumThesis thesis={opportunity.thesis} />
      <PremiumCatalysts catalysts={opportunity.catalysts} />
      <PremiumRisks risks={opportunity.risks} />
    </PaywallBlur>
  );
}

function PremiumThesis({ thesis }: { readonly thesis: string }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Thesis</h2>
      <p className="mt-3 leading-relaxed text-text-secondary">{thesis}</p>
    </section>
  );
}

function PremiumCatalysts({ catalysts }: { readonly catalysts: readonly string[] }) {
  if (!Array.isArray(catalysts) || catalysts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Catalysts</h2>
      <ul className="mt-3 space-y-2">
        {catalysts.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 text-text-tertiary">+</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PremiumRisks({ risks }: { readonly risks: readonly string[] }) {
  if (!Array.isArray(risks) || risks.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Risks</h2>
      <ul className="mt-3 space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}

function buildJsonLd(opp: Opportunity): Record<string, unknown> {
  const citations = opp.citations
    .filter((c) => c.url && c.url.length > 0)
    .slice(0, 20)
    .map((c) => ({
      "@type": "CreativeWork",
      name: c.source,
      description: c.claim,
      url: c.url,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: `${opp.name} — Opportunity Analysis`,
    description: opp.one_liner,
    url: `https://earlythunder.com/opportunities/${opp.slug}`,
    dateModified: opp.updated_at,
    publisher: {
      "@type": "Organization",
      name: "Early Thunder",
      url: "https://earlythunder.com",
    },
    about: {
      "@type": "Thing",
      name: opp.name,
      description: opp.one_liner,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: opp.composite_score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 8,
    },
    citation: citations,
  };
}
