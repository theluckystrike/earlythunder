import type { Metadata } from "next";
import Link from "next/link";
import distData from "../../../data/revenue-distribution.json";
import { getBreadcrumbListSchema } from "@/lib/structured-data";

/* ─── Types ─── */

interface Row {
  readonly ticker: string;
  readonly name: string;
  readonly slug: string | null;
  readonly category: "continuous" | "buyback" | "non_continuous";
  readonly distribution: string;
  readonly multiple: string;
  readonly mechanism: string;
  readonly status: "verified" | "corrected" | "unverifiable";
  readonly equity_structure: "single_token" | "dual_token_equity" | "unclear";
  readonly claim: string;
  readonly note: string;
  readonly source: string;
}

interface DistData {
  readonly updated_at: string;
  readonly rows: readonly Row[];
}

const DATA = distData as DistData;

export const metadata: Metadata = {
  title: "Crypto Revenue Distribution, How Much Revenue Reaches the Token",
  description:
    "A cheap revenue multiple only matters if the revenue reaches the token. This tracks the share of protocol revenue that actually flows to holders via buyback, burn, or lock for 15+ tokens, with sources.",
  keywords: [
    "crypto revenue distribution",
    "how much revenue reaches the token",
    "buyback and burn crypto",
    "token value accrual",
    "revenue multiple crypto",
    "fee switch",
    "price to revenue DeFi",
  ],
  alternates: { canonical: "/revenue-distribution" },
  openGraph: {
    type: "website",
    title: "Crypto Revenue Distribution, How Much Revenue Reaches the Token",
    description:
      "The share of protocol revenue that actually reaches the token, for 15+ names, with sources.",
    url: "/revenue-distribution",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Revenue Distribution",
    description: "How much protocol revenue actually reaches each token.",
  },
};

const GROUPS: { key: Row["category"]; title: string; blurb: string }[] = [
  { key: "continuous", title: "Continuous, revenue-linked", blurb: "Revenue flows to the token on an ongoing, trackable basis." },
  { key: "buyback", title: "Active buyback programs", blurb: "Treasury-funded buybacks that run in bursts, not continuously." },
  { key: "non_continuous", title: "Thin or no distribution", blurb: "Little or none of the revenue reaches the token today." },
];

function statusChip(status: Row["status"]) {
  const map: Record<Row["status"], string> = {
    verified: "border-positive/40 bg-positive-bg text-positive",
    corrected: "border-warning/40 bg-warning-bg text-warning",
    unverifiable: "border-border bg-bg-card text-text-tertiary",
  };
  const label: Record<Row["status"], string> = {
    verified: "verified",
    corrected: "corrected",
    unverifiable: "unverified",
  };
  return (
    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function equityChip(structure: Row["equity_structure"]) {
  const map: Record<Row["equity_structure"], string> = {
    single_token: "border-positive/40 bg-positive-bg text-positive",
    dual_token_equity: "border-negative/40 bg-negative-bg text-negative",
    unclear: "border-border bg-bg-card text-text-tertiary",
  };
  const label: Record<Row["equity_structure"], string> = {
    single_token: "single token",
    dual_token_equity: "token + equity",
    unclear: "structure unclear",
  };
  return (
    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${map[structure]}`}>
      {label[structure]}
    </span>
  );
}

function TokenName({ r }: { readonly r: Row }) {
  const label = `${r.name} (${r.ticker})`;
  if (r.slug) {
    return (
      <Link href={`/opportunities/${r.slug}`} className="font-semibold text-text-primary hover:underline">
        {label}
      </Link>
    );
  }
  return <span className="font-semibold text-text-primary">{label}</span>;
}

export default function RevenueDistributionPage() {
  const breadcrumb = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Revenue Distribution", path: "/revenue-distribution" },
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <nav className="font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        {" / "}
        <span className="text-text-secondary">Revenue Distribution</span>
      </nav>

      <h1 className="mt-6 text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        How much revenue reaches the token
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-secondary">
        A revenue multiple tells you how cheap a protocol looks against its revenue. It doesn&apos;t
        tell you how much of that revenue actually reaches the token. A 2x protocol that sends
        nothing to holders can be worse than a 20x protocol that sends everything. So each name below
        carries two numbers, the share of revenue that flows to the token and the revenue multiple,
        checked against real sources.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-tertiary">
        Distribution reaches the token through buyback, burn, or a fee-earning lock. Revenue that
        goes to a DAO treasury, to liquidity providers, or to node operators does not reach it.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-tertiary">
        There is a second axis, marked on each row. A single-token protocol has no private company
        holding equity above the token. A token-plus-equity protocol has a company that raised
        venture equity, so equity holders are a separate, senior claim, and the token can be diluted
        or emitted while enterprise value flows to equity. Both axes are checked against real sources,
        verified as of {DATA.updated_at}.
      </p>

      {GROUPS.map((g) => {
        const rows = DATA.rows.filter((r) => r.category === g.key);
        if (rows.length === 0) return null;
        return (
          <section key={g.key} className="mt-12">
            <h2 className="text-lg font-semibold text-text-primary">{g.title}</h2>
            <p className="mt-1 text-sm text-text-tertiary">{g.blurb}</p>
            <div className="mt-4 space-y-3">
              {rows.map((r) => (
                <div key={r.ticker} className="rounded-xl border border-border bg-bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TokenName r={r} />
                        {statusChip(r.status)}
                        {equityChip(r.equity_structure)}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{r.mechanism}</p>
                      {r.note && (
                        <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{r.note}</p>
                      )}
                      {r.source && (
                        <a href={r.source} target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-block font-mono text-xs text-text-secondary underline hover:text-text-primary">
                          Source
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-6 text-right">
                      <div>
                        <div className="font-mono text-2xl font-semibold text-text-primary">{r.distribution}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary">to token</div>
                      </div>
                      <div>
                        <div className="font-mono text-2xl font-semibold text-text-primary">{r.multiple}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary">revenue mult</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-12 text-xs leading-relaxed text-text-tertiary">
        Method. Revenue multiples are price to trailing 30-day protocol revenue, annualized, from
        DefiLlama, cross-checked on {DATA.updated_at}. These are run-rate figures, so they move with
        volume and can differ from a trailing-year multiple. Distribution share is holders revenue
        over protocol revenue. For L1s, the value-to-token mechanism is fee burn versus issuance, not
        a buyback.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
        Distribution share and multiples move with price and governance. A &quot;corrected&quot; tag
        means the popular figure did not match the sourced reality. Research, not investment
        advice. {" "}
        <Link href="/disclaimer" className="underline hover:text-text-secondary">Full disclaimer</Link>.
      </p>
    </div>
  );
}
