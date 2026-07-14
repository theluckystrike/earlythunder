import type { Metadata } from "next";
import Link from "next/link";
import portfolio from "../../../data/portfolio.json";
import { getBreadcrumbListSchema } from "@/lib/structured-data";

interface Holding {
  readonly ticker: string;
  readonly name: string;
  readonly slug: string | null;
  readonly tier: "anchor" | "defi" | "cash";
  readonly allocation_usd: number;
  readonly allocation_pct: number;
  readonly price: number;
  readonly score: number | null;
  readonly verdict: string;
  readonly value_accrual: string;
  readonly rationale: string;
}

interface Portfolio {
  readonly name: string;
  readonly updated_at: string;
  readonly total_usd: number;
  readonly rule: string;
  readonly data_advantage: string;
  readonly rating: number;
  readonly rating_max: number;
  readonly rating_reason: string;
  readonly holdings: readonly Holding[];
}

const P = portfolio as Portfolio;

export const metadata: Metadata = {
  title: "The $10,000 Starter Crypto Portfolio, Scored and Honest",
  description:
    "A $10,000 beginner crypto portfolio built only from tokens rating 120+ on our 250-point scorecard, weighted toward names that actually return revenue to the token. Rated honestly, with sources. Not financial advice.",
  keywords: [
    "best crypto portfolio for beginners",
    "$10000 crypto portfolio",
    "how to build a crypto portfolio",
    "crypto portfolio allocation",
    "data-driven crypto portfolio",
    "crypto starter portfolio 2026",
  ],
  alternates: { canonical: "/portfolio" },
  openGraph: {
    type: "website",
    title: "The $10,000 Starter Crypto Portfolio, Scored and Honest",
    description:
      "A beginner crypto portfolio built from the scorecard, weighted toward tokens that actually pay the holder. Rated honestly. Not financial advice.",
    url: "/portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "The $10,000 Starter Crypto Portfolio",
    description: "Built from the scorecard, weighted toward real value accrual. Not financial advice.",
  },
};

const TIERS: { key: Holding["tier"]; title: string; blurb: string }[] = [
  { key: "anchor", title: "Anchors", blurb: "The liquid core an amateur should hold first and largest." },
  { key: "defi", title: "Value-accrual DeFi", blurb: "High-scoring tokens that return real revenue to the holder." },
  { key: "cash", title: "Cash buffer", blurb: "Dry powder for dips, not a bet." },
];

function usd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function ratingTone(r: number): string {
  if (r >= 7.5) return "text-score-high";
  if (r >= 5.5) return "text-score-mid";
  return "text-score-low";
}

export default function PortfolioPage() {
  const breadcrumb = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Portfolio", path: "/portfolio" },
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <nav className="font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        {" / "}
        <span className="text-text-secondary">Portfolio</span>
      </nav>

      <div className="mt-6 rounded-xl border border-border bg-bg-card px-4 py-3 text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">Not financial advice.</span>{" "}
        An educational, data-driven example built from public research. Crypto is high risk and can
        lose most of its value. Do your own research and never invest money you cannot afford to lose.
      </div>

      <h1 className="mt-8 text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        The {usd(P.total_usd)} starter portfolio
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
        A beginner-friendly crypto mix built straight from the scorecard, with one hard rule and one edge.
        The rule, only tokens rating 120 or higher qualify. The edge, the picks are weighted toward names
        that actually return revenue to the token, not just ones that score well.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Honest rating</div>
          <div className={`mt-1 font-mono text-3xl font-semibold ${ratingTone(P.rating)}`}>
            {P.rating}<span className="text-lg text-text-tertiary">/{P.rating_max}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Positions</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-text-primary">{P.holdings.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">Qualifying rule</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-text-primary">120+</div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">The data advantage</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{P.data_advantage}</p>
      </section>

      {TIERS.map((t) => {
        const rows = P.holdings.filter((h) => h.tier === t.key);
        if (rows.length === 0) return null;
        return (
          <section key={t.key} className="mt-10">
            <h2 className="text-lg font-semibold text-text-primary">{t.title}</h2>
            <p className="mt-1 text-sm text-text-tertiary">{t.blurb}</p>
            <div className="mt-4 space-y-3">
              {rows.map((h) => (
                <div key={h.ticker} className="rounded-xl border border-border bg-bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {h.slug ? (
                          <Link href={`/opportunities/${h.slug}`} className="font-semibold text-text-primary hover:underline">
                            {h.name} ({h.ticker})
                          </Link>
                        ) : (
                          <span className="font-semibold text-text-primary">{h.name} ({h.ticker})</span>
                        )}
                        {h.score != null && (
                          <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                            score {h.score}
                          </span>
                        )}
                        <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
                          {h.verdict}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{h.rationale}</p>
                      <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
                        <span className="uppercase tracking-widest">Value accrual</span> {h.value_accrual}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-2xl font-semibold text-text-primary">{usd(h.allocation_usd)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary">{h.allocation_pct}% of the pot</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
                    <div className="h-full rounded-full bg-text-tertiary" style={{ width: `${h.allocation_pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">Why this rating and not higher</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{P.rating_reason}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">How it was built</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Scores come from the 250-point {""}
          <Link href="/scorecard" className="underline hover:text-text-primary">scorecard</Link>, and only
          names at 120 or above were eligible. Among those, the value-accrual read from the {""}
          <Link href="/revenue-distribution" className="underline hover:text-text-primary">revenue distribution tracker</Link> {""}
          decided the tilt, favoring tokens that pay the holder over ones that route revenue to a treasury or
          nowhere. Prices are live as of {P.updated_at}. Weights lean on liquidity and conviction, with the
          anchors largest and the higher-risk DeFi sleeve sized small.
        </p>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-text-tertiary">
        Educational example, not a recommendation and not financial advice. Allocations are illustrative and
        will drift with price. {""}
        <Link href="/disclaimer" className="underline hover:text-text-secondary">Full disclaimer</Link>.
      </p>
    </div>
  );
}
