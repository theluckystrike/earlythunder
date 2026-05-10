import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Early Thunder pricing. Free market intelligence or Pro-tier alpha signals for $999/month.",
  openGraph: {
    title: "Pricing | Early Thunder",
    description:
      "Free market intelligence or Pro-tier alpha signals for $999/month.",
  },
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/**
 * Stripe payment link for EarlyThunder Pro ($999/mo).
 * To generate: stripe payment_links create \
 *   --line_items[0][price]=PRICE_ID --line_items[0][quantity]=1
 * Then replace this URL with the real payment link.
 */
const STRIPE_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ??
  "https://buy.stripe.com/PLACEHOLDER";

const FREE_FEATURES = [
  "Public blog articles",
  "Market overview dashboard",
  "1000x Discovery scores (summary)",
  "Graveyard access",
  "Methodology documentation",
] as const;

const PRO_FEATURES = [
  "Everything in Free",
  "Real-time alpha signals (not delayed)",
  "Full pipeline access: 300+ devs, 31 orgs, VC wallet tracking",
  "AI-evaluated deep briefs with catalyst timelines",
  "INVESTIGATE + HIGH_CONVICTION alerts",
  "EkuboProtocol liquidity tracker",
  "Full 8-Signal radar breakdowns",
  "Discord Pro channel access",
  "Weekly intelligence reports",
  "First-mover alerts on pre-token discoveries",
  "Direct research team access",
] as const;

const COMPARISON_ROWS = [
  { feature: "Blog articles", free: true, pro: true },
  { feature: "Market overview", free: true, pro: true },
  { feature: "1000x Discovery scores", free: "Summary", pro: "Full breakdown" },
  { feature: "Signal delivery", free: "Delayed", pro: "Real-time" },
  { feature: "Pipeline access (300+ devs, 31 orgs)", free: false, pro: true },
  { feature: "AI-evaluated deep briefs", free: false, pro: true },
  { feature: "INVESTIGATE alerts", free: false, pro: true },
  { feature: "HIGH_CONVICTION alerts", free: false, pro: true },
  { feature: "VC wallet tracking", free: false, pro: true },
  { feature: "EkuboProtocol tracker", free: false, pro: true },
  { feature: "8-Signal radar charts", free: false, pro: true },
  { feature: "Discord Pro channel", free: false, pro: true },
  { feature: "Weekly intelligence reports", free: false, pro: true },
  { feature: "Pre-token discovery alerts", free: false, pro: true },
  { feature: "Direct research team access", free: false, pro: true },
] as const;

const FAQ_ITEMS = [
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
    question: "What kind of signal quality can I expect?",
    answer:
      "Pro subscribers receive curated, research-backed signals -- not social media noise. Every signal includes the full thesis, risk factors, catalyst timeline, and radar chart breakdown. We prioritize quality over quantity: typically 3-5 actionable signals per week, each backed by our systematic methodology.",
  },
  {
    question: "What is the refund policy?",
    answer:
      "We offer a full refund within the first 7 days of your subscription if you are not satisfied with the quality of research. After the initial 7-day period, subscriptions are non-refundable but can be canceled at any time to prevent future charges. Contact support@earlythunder.com for refund requests.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no contracts or commitments. Cancel your subscription at any time from your account dashboard or by contacting support. Your access continues through the end of the current billing period.",
  },
  {
    question: "What is included in the Discord community?",
    answer:
      "Pro members get access to a private Discord server with channels for daily signals, deep alpha discussion, EkuboProtocol tracking, and direct interaction with our research team. This is where real-time updates and emerging opportunities are shared first.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
      <PageHeader />
      <PricingCards />
      <ComparisonTable />
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
        Simple pricing.
        <br />
        <span className="text-text-secondary">Serious alpha.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
        Free access to our public research, or unlock the full intelligence
        pipeline with Pro. 300+ developers tracked. 31 organizations monitored.
        VC wallets decoded. No contracts. Cancel anytime.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Cards                                                      */
/* ------------------------------------------------------------------ */

function PricingCards() {
  return (
    <div className="mt-16 grid gap-8 md:grid-cols-2">
      <FreeCard />
      <ProCard />
    </div>
  );
}

function FreeCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-bg-card p-8">
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
        Free
      </h2>
      <div className="mt-4 font-mono text-5xl font-semibold text-text-primary">
        $0
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        Free forever -- no credit card required
      </p>
      <FeatureList features={FREE_FEATURES} />
      <div className="mt-auto pt-8">
        <Link
          href="/blog"
          className="block rounded-full border border-border py-3.5 text-center text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-bg-elevated"
        >
          Start Reading
        </Link>
      </div>
    </div>
  );
}

function ProCard() {
  return (
    <div className="relative flex flex-col rounded-2xl border border-amber/40 bg-bg-card p-8">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber px-4 py-1 text-xs font-bold uppercase tracking-wider text-black">
        Pro
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
        Pro
      </h2>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-5xl font-semibold text-text-primary">
          $999
        </span>
        <span className="text-sm text-text-secondary">/month</span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        Full intelligence pipeline -- institutional-grade alpha
      </p>
      <FeatureList features={PRO_FEATURES} />
      <div className="mt-auto pt-8">
        <a
          href={STRIPE_CHECKOUT_URL}
          className="block rounded-full bg-amber py-3.5 text-center text-sm font-bold text-black transition-colors hover:bg-amber-hover"
        >
          Unlock Full Pipeline
        </a>
      </div>
    </div>
  );
}

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
/*  Comparison Table                                                    */
/* ------------------------------------------------------------------ */

function ComparisonTable() {
  return (
    <section className="mt-24">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-text-primary">
        Compare plans
      </h2>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-4 pr-4 text-left font-medium text-text-secondary">
                Feature
              </th>
              <th className="py-4 px-4 text-center font-medium text-text-secondary">
                Free
              </th>
              <th className="py-4 pl-4 text-center font-medium text-amber">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <ComparisonRow key={row.feature} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonRow({
  row,
}: {
  readonly row: {
    readonly feature: string;
    readonly free: boolean | string;
    readonly pro: boolean | string;
  };
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-4 pr-4 text-text-primary">{row.feature}</td>
      <td className="py-4 px-4 text-center">
        <CellValue value={row.free} />
      </td>
      <td className="py-4 pl-4 text-center">
        <CellValue value={row.pro} />
      </td>
    </tr>
  );
}

function CellValue({ value }: { readonly value: boolean | string }) {
  if (value === true) {
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
  if (value === false) {
    return (
      <span className="text-text-tertiary" aria-label="Not included">
        --
      </span>
    );
  }
  return <span className="text-text-secondary">{value}</span>;
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
