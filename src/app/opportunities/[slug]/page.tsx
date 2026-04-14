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
import type { Opportunity, AssetClass, OnChainMetrics, InsiderActivity, TeamProfile, Tokenomics, CompetitivePosition } from "@/lib/types";
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
      <div className="mb-8 rounded-xl border border-border bg-bg-card px-4 py-3 text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">Notice.</span>{" "}
        This is research and analysis, not investment advice. Pattern match scores are not investment ratings.{" "}
        <a href="/disclaimer" className="text-text-secondary underline hover:text-text-primary">Full disclaimer</a>
      </div>
      <NameBlock opportunity={opportunity} />
      <div className="mt-4 max-w-3xl text-xl leading-relaxed text-text-secondary">
        {opportunity.one_liner}
      </div>
      <QuickDataStrip opportunity={opportunity} />
      <div className="divider mt-8" />
      <StatsGrid opportunity={opportunity} />
      <CompositeScoreBlock score={opportunity.composite_score} />
      <RadarSection opportunity={opportunity} />
      {opportunity.on_chain && <OnChainSection data={opportunity.on_chain} />}
      {opportunity.insider_activity && <InsiderSection data={opportunity.insider_activity} />}
      {opportunity.team && <TeamSection data={opportunity.team} />}
      {opportunity.tokenomics && <TokenomicsSection data={opportunity.tokenomics} />}
      {opportunity.competitive && <CompetitiveSection data={opportunity.competitive} />}
      <p className="mt-8 text-xs text-text-tertiary">
        Last updated {formatDate(opportunity.updated_at)}
      </p>
      <div className="divider mt-8" />
      <PremiumContent opportunity={opportunity} />
      <div className="divider mt-8" />
      <CitationSection citations={opportunity.citations} />
      {opportunity.verdict && <VerdictSection verdict={opportunity.verdict} />}
      {opportunity.red_flags && opportunity.red_flags.length > 0 && (
        <RedFlagsSection flags={opportunity.red_flags} />
      )}
      {opportunity.conviction_signals && opportunity.conviction_signals.length > 0 && (
        <ConvictionSignalsSection signals={opportunity.conviction_signals} />
      )}
      {opportunity.edge_data && opportunity.edge_data.length > 0 && (
        <EdgeDataSection items={opportunity.edge_data} />
      )}
      {opportunity.thesis_changers && (
        <ThesisChangersSection changers={opportunity.thesis_changers} />
      )}
      <RiskDisclosure
        name={opportunity.name}
        ticker={opportunity.ticker}
        asset_class={opportunity.asset_class}
      />
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

function QuickDataStrip({ opportunity }: { readonly opportunity: Opportunity }) {
  const metrics: { label: string; value: string | null | undefined; warn?: boolean }[] = [
    { label: "FDV", value: opportunity.fdv },
    { label: "Circulating", value: opportunity.circulating_pct, warn: isLowFloat(opportunity.circulating_pct) },
    { label: "TVL", value: opportunity.tvl },
    { label: "Fees 30d", value: opportunity.fees_30d },
    { label: "Holders", value: opportunity.holders },
    { label: "GitHub", value: opportunity.github_stars ? `${opportunity.github_stars} stars` : null },
    { label: "Last Commit", value: opportunity.last_github_commit, warn: isStale(opportunity.last_github_commit) },
  ];

  const visible = metrics.filter((m) => m.value != null && m.value.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
      {visible.map((m) => (
        <div key={m.label} className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary">{m.label}</span>
          <span className={`font-mono text-xs ${m.warn ? "text-score-low" : "text-text-secondary"}`}>
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function isLowFloat(pct: string | null | undefined): boolean {
  if (!pct) return false;
  const num = parseFloat(pct);
  return !isNaN(num) && num < 20;
}

function isStale(commit: string | null | undefined): boolean {
  if (!commit) return false;
  return commit.includes("stale");
}

function OnChainSection({ data }: { readonly data: OnChainMetrics }) {
  const metrics: { label: string; value?: string; change?: string }[] = [
    { label: "TVL", value: data.tvl, change: data.tvl_change_30d },
    { label: "Daily Active Addresses", value: data.daily_active_addresses, change: data.daa_change_30d },
    { label: "Daily Transactions", value: data.daily_transactions, change: data.tx_change_30d },
    { label: "Protocol Fees 30d", value: data.fees_30d },
    { label: "Revenue 30d", value: data.revenue_30d },
    { label: "Holder Count", value: data.holder_count },
    { label: "Top 10 Holders", value: data.top_10_holders_pct },
    { label: "Whale Activity", value: data.whale_accumulation },
  ];

  const visible = metrics.filter((m) => m.value != null);
  if (visible.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">On-Chain Data</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        {visible.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary">{m.label}</div>
            <div className="mt-1 font-mono text-lg font-semibold text-text-primary">{m.value}</div>
            {m.change && (
              <div className={`mt-0.5 font-mono text-xs ${m.change.startsWith("-") ? "text-score-low" : "text-score-high"}`}>
                {m.change}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function InsiderSection({ data }: { readonly data: InsiderActivity }) {
  const hasBuys = data.recent_buys && data.recent_buys.length > 0;
  const hasSells = data.recent_sells && data.recent_sells.length > 0;
  const hasContent = hasBuys || hasSells || data.insider_sentiment || data.token_unlocks_next_90d;
  if (!hasContent) return null;

  const sentimentColor: Record<string, string> = {
    accumulating: "text-score-high",
    neutral: "text-text-secondary",
    distributing: "text-score-low",
  };

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Insider Activity</h2>
      {data.insider_sentiment && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${sentimentColor[data.insider_sentiment]?.replace("text-", "bg-") ?? "bg-text-secondary"}`} />
          <span className={`font-mono text-sm capitalize ${sentimentColor[data.insider_sentiment] ?? "text-text-secondary"}`}>
            {data.insider_sentiment}
          </span>
        </div>
      )}
      {data.token_unlocks_next_90d && (
        <div className="mt-3 rounded-xl border border-border bg-bg-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Token Unlocks (90d)</div>
          <div className="mt-1 font-mono text-sm text-score-mid">{data.token_unlocks_next_90d}</div>
        </div>
      )}
      {hasBuys && <InsiderTable label="Recent Buys" rows={data.recent_buys!} />}
      {hasSells && <InsiderTable label="Recent Sells" rows={data.recent_sells!} />}
    </section>
  );
}

function InsiderTable({
  label,
  rows,
}: {
  readonly label: string;
  readonly rows: readonly { readonly who: string; readonly amount: string; readonly date: string }[];
}) {
  return (
    <div className="mt-4">
      <div className="text-xs font-medium text-text-secondary">{label}</div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text-tertiary">
              <th className="pb-2 pr-4 font-normal">Who</th>
              <th className="pb-2 pr-4 font-normal">Amount</th>
              <th className="pb-2 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-text-primary">{r.who}</td>
                <td className="py-2 pr-4 font-mono text-text-secondary">{r.amount}</td>
                <td className="py-2 font-mono text-text-tertiary">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamSection({ data }: { readonly data: TeamProfile }) {
  const hasMembers = data.key_members && data.key_members.length > 0;
  const hasContent = hasMembers || data.anon_team || data.team_track_record || data.team_size;
  if (!hasContent) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Team</h2>
      {data.anon_team && (
        <div className="mt-3 font-mono text-xs text-score-mid">Anonymous team</div>
      )}
      {data.team_size && (
        <div className="mt-2 text-xs text-text-tertiary">
          <span className="font-mono text-text-secondary">{data.team_size}</span> team members
        </div>
      )}
      {data.team_track_record && (
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{data.team_track_record}</p>
      )}
      {hasMembers && (
        <div className="mt-4 space-y-3">
          {data.key_members!.map((m) => (
            <div key={m.name} className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm font-semibold text-text-primary">{m.name}</span>
                <span className="text-xs text-text-tertiary">{m.role}</span>
              </div>
              <div className="mt-1 text-xs text-text-secondary">{m.background}</div>
              {m.notable && (
                <div className="mt-1 text-xs text-text-tertiary">{m.notable}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.advisors && data.advisors.length > 0 && (
        <div className="mt-4 text-xs text-text-tertiary">
          Advisors{" "}
          <span className="font-mono text-text-secondary">{data.advisors.join(", ")}</span>
        </div>
      )}
    </section>
  );
}

function TokenomicsSection({ data }: { readonly data: Tokenomics }) {
  const gridMetrics: { label: string; value?: string; warn?: boolean }[] = [
    { label: "Total Supply", value: data.total_supply },
    { label: "Circulating Supply", value: data.circulating_supply },
    { label: "Circulating %", value: data.circulating_pct, warn: isLowCirculating(data.circulating_pct) },
    { label: "FDV", value: data.fdv },
    { label: "MCap / FDV", value: data.mcap_to_fdv_ratio },
    { label: "Inflation Rate", value: data.inflation_rate },
    { label: "Staking Yield", value: data.staking_yield },
    { label: "Burn Mechanism", value: data.burn_mechanism },
    { label: "Treasury Size", value: data.treasury_size },
    { label: "Treasury Runway", value: data.treasury_runway },
    { label: "Next Unlock", value: data.next_unlock_date },
    { label: "Unlock Amount", value: data.next_unlock_amount },
  ];

  const visible = gridMetrics.filter((m) => m.value != null);
  if (visible.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Tokenomics</h2>
      {data.circulating_supply && data.total_supply && (
        <p className="mt-3 text-sm text-text-secondary">
          {data.circulating_pct ?? "?"} of {data.total_supply} tokens in circulation
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        {visible.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary">{m.label}</div>
            <div className={`mt-1 font-mono text-sm font-semibold ${m.warn ? "text-score-mid" : "text-text-primary"}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function isLowCirculating(pct: string | null | undefined): boolean {
  if (!pct) return false;
  const num = parseFloat(pct);
  return !isNaN(num) && num < 30;
}

function CompetitiveSection({ data }: { readonly data: CompetitivePosition }) {
  const hasCompetitors = data.competitors && data.competitors.length > 0;
  const hasContent = hasCompetitors || data.moat || data.market_size || data.current_penetration;
  if (!hasContent) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Competitive Position</h2>
      {(data.moat || data.market_size || data.current_penetration) && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.moat && (
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Moat</div>
              <div className="mt-1 text-sm text-text-secondary">{data.moat}</div>
            </div>
          )}
          {data.market_size && (
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Market Size</div>
              <div className="mt-1 font-mono text-sm font-semibold text-text-primary">{data.market_size}</div>
            </div>
          )}
          {data.current_penetration && (
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Penetration</div>
              <div className="mt-1 font-mono text-sm font-semibold text-text-primary">{data.current_penetration}</div>
            </div>
          )}
        </div>
      )}
      {hasCompetitors && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-tertiary">
                <th className="pb-2 pr-4 font-normal">Name</th>
                <th className="pb-2 pr-4 font-normal">MCap</th>
                <th className="pb-2 font-normal">Comparison</th>
              </tr>
            </thead>
            <tbody>
              {data.competitors!.map((c) => (
                <tr key={c.name} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-text-primary">
                    {c.name}{c.ticker ? ` (${c.ticker})` : ""}
                  </td>
                  <td className="py-2 pr-4 font-mono text-text-secondary">{c.mcap ?? "-"}</td>
                  <td className="py-2 text-text-secondary">{c.comparison}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PremiumContent({ opportunity }: { readonly opportunity: Opportunity }) {
  return (
    <PaywallBlur bypass={opportunity.free_access === true}>
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

const RISK_TEXT: Readonly<Record<AssetClass, string>> = {
  digital_assets:
    "Digital assets are highly volatile and can lose 100% of their value.",
  public_equities:
    "Stock prices can decline significantly, including to zero.",
  private_markets:
    "Private market investments are illiquid and carry extreme risk.",
};

function RiskDisclosure({
  name,
  ticker,
  asset_class,
}: {
  readonly name: string;
  readonly ticker: string | null;
  readonly asset_class: AssetClass;
}) {
  const label = ticker ? `${name} (${ticker})` : name;

  return (
    <div className="mt-12 max-w-2xl border-t border-border pt-8 text-xs text-text-tertiary">
      <h3 className="mb-2 font-medium text-text-secondary">
        Risk Disclosure
      </h3>
      <p>
        <strong>{label}.</strong> {RISK_TEXT[asset_class]} Past patterns do
        not predict future results. Always do your own research and consult a
        qualified advisor before investing.
      </p>
    </div>
  );
}

function VerdictSection({ verdict }: { readonly verdict: string }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Verdict</h2>
      <div className="mt-4 rounded-xl border border-border bg-bg-card p-6">
        <p className="leading-relaxed text-text-secondary">{verdict}</p>
      </div>
    </section>
  );
}

function RedFlagsSection({ flags }: { readonly flags: readonly string[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Red Flags</h2>
      <div className="mt-4 space-y-3">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-score-low/20 bg-score-low/5 p-4">
            <span className="mt-0.5 font-mono text-sm font-semibold text-score-low">{String(i + 1).padStart(2, "0")}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{flag}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConvictionSignalsSection({ signals }: { readonly signals: readonly string[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Conviction Signals</h2>
      <div className="mt-4 space-y-3">
        {signals.map((signal, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-score-high/20 bg-score-high/5 p-4">
            <span className="mt-0.5 font-mono text-sm font-semibold text-score-high">{String(i + 1).padStart(2, "0")}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{signal}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EdgeDataSection({ items }: { readonly items: readonly string[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">Edge Data</h2>
      <p className="mt-1 text-xs text-text-tertiary">Information most analysts miss</p>
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-4">
            <p className="text-sm leading-relaxed text-text-secondary">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThesisChangersSection({ changers }: { readonly changers: { readonly bull_breaks_if: string; readonly bear_breaks_if: string } }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-text-primary">What Would Change the Thesis</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-score-low/20 bg-score-low/5 p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-score-low">Bull case breaks if</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{changers.bull_breaks_if}</p>
        </div>
        <div className="rounded-xl border border-score-high/20 bg-score-high/5 p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-score-high">Bear case breaks if</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{changers.bear_breaks_if}</p>
        </div>
      </div>
    </section>
  );
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
    headline: `${opp.name} Opportunity Analysis`,
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
