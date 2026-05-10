import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Free During Open Alpha | Early Thunder",
  description:
    "All Early Thunder features are free during the open alpha. Full thesis access, 8-signal radar charts, catalyst tracking, and research reports -- no credit card required.",
  openGraph: {
    title: "Pricing — Free During Open Alpha | Early Thunder",
    description:
      "All features free during open alpha. Full intelligence pipeline, radar charts, and research reports at no cost.",
  },
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALPHA_FEATURES = [
  "Full thesis and deep analysis",
  "Real-time alpha signals",
  "Full pipeline access: 300+ devs, 31 orgs, VC wallet tracking",
  "AI-evaluated deep briefs with catalyst timelines",
  "INVESTIGATE + HIGH_CONVICTION alerts",
  "EkuboProtocol liquidity tracker",
  "Full 8-Signal radar breakdowns",
  "Weekly intelligence reports",
  "Pre-token discovery alerts",
  "Market overview dashboard",
  "Graveyard access",
  "Blog articles and methodology docs",
] as const;

const COMPARISON_ROWS = [
  { feature: "Blog articles", included: true },
  { feature: "Market overview", included: true },
  { feature: "1000x Discovery scores (full breakdown)", included: true },
  { feature: "Real-time signal delivery", included: true },
  { feature: "Pipeline access (300+ devs, 31 orgs)", included: true },
  { feature: "AI-evaluated deep briefs", included: true },
  { feature: "INVESTIGATE alerts", included: true },
  { feature: "HIGH_CONVICTION alerts", included: true },
  { feature: "VC wallet tracking", included: true },
  { feature: "EkuboProtocol tracker", included: true },
  { feature: "8-Signal radar charts", included: true },
  { feature: "Weekly intelligence reports", included: true },
  { feature: "Pre-token discovery alerts", included: true },
] as const;

const FAQ_ITEMS = [
  {
    question: "Is everything really free right now?",
    answer:
      "Yes. During the open alpha, every feature on Early Thunder is completely free. No credit card, no trial limits, no paywalls. We are building in public and want early users to experience the full intelligence pipeline. Premium tiers will be introduced later, but alpha users get everything at no cost.",
  },
  {
    question: "What is the 1000x Discovery System?",
    answer:
      "The 1000x Discovery System is our proprietary intelligence pipeline that systematically identifies asymmetric opportunities in crypto and emerging markets before they reach mainstream awareness. It combines on-chain data, developer activity, VC tracking, and DEX liquidity analysis to surface opportunities with outsized upside potential.",
  },
  {
    question: "How does the scoring system work?",
    answer:
      "Every opportunity is evaluated through our 8-Signal Pattern Filter: six quality signals (team, technology, traction, tokenomics, community, narrative) and two asymmetry signals (market cap headroom, information asymmetry). Each signal is weighted and combined into a composite score from 0 to 100. Scores above 75 receive an INVESTIGATE rating. Scores above 85 with strong catalyst alignment receive HIGH_CONVICTION status.",
  },
  {
    question: "Will there be paid plans later?",
    answer:
      "Yes. We plan to introduce premium tiers once the platform matures. Early alpha users will be the first to know about pricing changes and may receive preferential rates. For now, enjoy full access at no cost.",
  },
  {
    question: "What kind of signal quality can I expect?",
    answer:
      "You receive curated, research-backed signals -- not social media noise. Every signal includes the full thesis, risk factors, catalyst timeline, and radar chart breakdown. We prioritize quality over quantity: typically 3-5 actionable signals per week, each backed by our systematic methodology.",
  },
  {
    question: "What asset classes do you cover?",
    answer:
      "Early Thunder covers three asset classes. Digital assets (crypto, tokens, protocols), public equities (stocks, ETFs), and private markets (pre-IPO, venture-backed companies).",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
      <PageHeader />
      <AlphaCard />
      <FeatureTable />
      <FAQSection />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Header                                                        */
/* ------------------------------------------------------------------ */

function PageHeader() {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-semibold tracking-tighter text-text-primary md:text-6xl">
        Everything is free.
        <br />
        <span className="text-text-secondary">Open alpha access.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
        All features are currently free while we build in public. Full
        intelligence pipeline, 8-signal radar charts, deep briefs, and
        research reports -- no credit card, no limits. Premium tiers
        coming later.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alpha Access Card                                                  */
/* ------------------------------------------------------------------ */

function AlphaCard() {
  return (
    <div className="mx-auto mt-16 max-w-xl">
      <div className="relative flex flex-col rounded-2xl border border-amber/40 bg-bg-card p-8">
        <AlphaBadge />
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Open Alpha
        </h2>
        <AlphaPrice />
        <p className="mt-2 text-sm text-text-secondary">
          Full intelligence pipeline -- every feature, no restrictions
        </p>
        <FeatureList features={ALPHA_FEATURES} />
        <div className="mt-auto pt-8">
          <Link
            href="/opportunities"
            className="block rounded-full bg-amber py-3.5 text-center text-sm font-bold text-black transition-colors hover:bg-amber-hover"
          >
            Start Exploring
          </Link>
        </div>
      </div>
    </div>
  );
}

function AlphaBadge() {
  return (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber px-4 py-1 text-xs font-bold uppercase tracking-wider text-black">
      Early Access
    </span>
  );
}

function AlphaPrice() {
  return (
    <div className="mt-4 flex items-baseline gap-2">
      <span className="font-mono text-5xl font-semibold text-text-primary">
        $0
      </span>
      <span className="text-sm text-text-secondary">
        / free during alpha
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature List                                                       */
/* ------------------------------------------------------------------ */

function FeatureList({
  features,
}: {
  readonly features: readonly string[];
}) {
  return (
    <ul className="mt-8 space-y-3">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-3 text-sm text-text-secondary"
        >
          <CheckIcon />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 shrink-0 text-score-high"
      aria-hidden="true"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Table                                                      */
/* ------------------------------------------------------------------ */

function FeatureTable() {
  return (
    <section className="mt-24">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-text-primary">
        All features included
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm text-text-secondary">
        Everything listed below is available right now at no cost during the
        open alpha period.
      </p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-4 pr-4 text-left font-medium text-text-secondary">
                Feature
              </th>
              <th className="py-4 pl-4 text-center font-medium text-amber">
                Open Alpha
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <FeatureRow key={row.feature} feature={row.feature} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FeatureRow({ feature }: { readonly feature: string }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-4 pr-4 text-text-primary">{feature}</td>
      <td className="py-4 pl-4 text-center">
        <IncludedIcon />
      </td>
    </tr>
  );
}

function IncludedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mx-auto text-score-high"
      aria-label="Included"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                        */
/* ------------------------------------------------------------------ */

function FAQSection() {
  return (
    <section className="mt-24">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-text-primary">
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-border/50">
        {FAQ_ITEMS.map((item) => (
          <FAQItem key={item.question} item={item} />
        ))}
      </div>
    </section>
  );
}

function FAQItem({
  item,
}: {
  readonly item: { readonly question: string; readonly answer: string };
}) {
  return (
    <div className="py-6">
      <h3 className="text-base font-medium text-text-primary">
        {item.question}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {item.answer}
      </p>
    </div>
  );
}
