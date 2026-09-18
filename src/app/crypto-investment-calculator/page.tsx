import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import InvestmentCalculator from "@/components/InvestmentCalculator";

export const metadata: Metadata = {
  title: "Crypto investment calculator with recurring buys",
  description:
    "Model a lump sum plus recurring crypto buys and see ending value, ROI, CAGR, fee drag, and price scenarios. The math backs onto a real Bitcoin backtest.",
};

const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
const URL = "https://earlythunder.com/crypto-investment-calculator";

function schemas(): readonly Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: "Crypto investment calculator with recurring buys",
      url: URL, description: metadata.description, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: "Crypto investment calculator with recurring buys",
      description: metadata.description, url: URL, mainEntityOfPage: URL,
      datePublished: "2026-09-18", dateModified: "2026-09-18", author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto investment calculator with recurring buys", item: URL },
      ],
    },
  ];
}

const RELATED = [
  { href: "/crypto-dca-calculator", label: "DCA calculator" },
  { href: "/crypto-average-price-calculator", label: "Average price calculator" },
  { href: "/crypto-fee-calculator", label: "Fee calculator" },
  { href: "/crypto-apy-calculator", label: "APY calculator" },
  { href: "/crypto-position-size-calculator", label: "Position size calculator" },
  { href: "/crypto-profit-calculator", label: "Profit calculator" },
  { href: "/crypto-buy-the-dip-calculator", label: "Buy the dip calculator" },
] as const;

const FORMULAS = [
  "Total invested = initial + recurring × periods",
  "Units = cash × (1 − fee rate) ÷ price per unit",
  "Average cost = total invested ÷ units received",
  "Ending value = units × ending price",
  "ROI = (ending value − total invested) ÷ total invested",
  "CAGR = (ending value ÷ total invested) ^ (1 ÷ years) − 1",
  "Fee drag = ending value at zero fee − ending value at entered fee",
] as const;

const SECTIONS = [
  {
    heading: "What this model shows",
    paragraphs: [
      "A single lump sum plus an optional recurring contribution make up the total you put in. Every purchase pays the same fee rate. The model spaces the recurring buys evenly along a straight path from your start price to your end price.",
      "The result separates what you invested from what it is worth at the end. ROI measures the whole plan. CAGR smooths the return to one annual rate over the window you enter. Fee drag shows how much value a fee quietly takes from the plan.",
    ],
  },
  {
    heading: "How recurring buys are priced",
    paragraphs: [
      "The first purchase is the lump sum at your start price. Each recurring contribution then buys at a price spaced evenly toward the end price. With twelve periods, the seventh buy sits halfway along that path.",
      "A straight glide path stands in for the real market tape. Real prices jump, gap, and cluster. The straight line is an approximation that keeps the model reproducible by hand with a calculator.",
    ],
  },
] as const;

const FAQS = [
  {
    question: "Why is the average cost different from the ending price?",
    answer:
      "Average cost is total cash divided by units. If your recurring buys happen below the end price, average cost lands below it too. The gap between average cost and end price is the meat of the return. It is a planning number, not a guaranteed fill.",
  },
  {
    question: "What does the ending price scenario table do?",
    answer:
      "It replays your whole contribution plan at six different end prices. The set runs from fifty percent below your start price to double it. Each row shows what the plan would be worth at that price. The table helps you see downside and upside before you commit money.",
  },
  {
    question: "Is this a backtest of real Bitcoin data?",
    answer:
      "The method mirrors a real Bitcoin backtest that applies the same buy path math to historic prices. The calculator itself accepts whatever prices you type, so it stays a forward planning tool. The backtest confirms the math, not a forecast of your result.",
  },
  {
    question: "How should I pick the holding window for CAGR?",
    answer:
      "Use the calendar span of your plan in years. Twelve monthly periods are one year. Thirty-six are three. CAGR only appears when you enter a window longer than zero. It is a fair way to compare a crypto plan against other annualized returns.",
  },
] as const;

const SOURCES = [
  {
    title: "Investor.gov: Compound interest",
    href: "https://www.investor.gov/introduction-investing/investing-basics/compound-interest",
    note: "The US investor education site explains how interest and returns build on themselves over time. It anchors the CAGR and compounding notes on this page.",
  },
  {
    title: "SEC: Investor education on digital assets",
    href: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-assets",
    note: "The Securities and Exchange Commission warns that crypto assets are volatile and can lose their entire value. It frames the risk disclosure below.",
  },
] as const;

export default function CryptoInvestmentCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas().map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>Crypto investment calculator with recurring buys</span></nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />Investment growth model</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">Crypto investment calculator with recurring buys</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">Model a lump sum plus recurring crypto buys and see the ending value, ROI, CAGR, fee drag, and price scenarios. The buy-path math backs onto a real Bitcoin backtest.</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">Enter an amount, a schedule, and two prices. The model returns what the plan is worth at the end and how the return breaks down. Toggle the fee to see what it really costs.</p>
        <p className="mt-5 inline-flex max-w-3xl rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">No market feed is used. Every price, rate, fee, and balance comes from the values you enter.</p>
      </header>
      <InvestmentCalculator />
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The calculation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{FORMULAS.map((formula) => <div key={formula} className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{formula}</div>)}</div>
      </section>
      {SECTIONS.map((section) => <section key={section.heading} className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2><div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-xs uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">A ten thousand dollar plan across a year</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">Put in $10,000 today at $60,000 per unit. Add $500 each month for twelve months. Run the path to an end price of $90,000 with a 0.5% fee. The total invested is $16,000. The plan accumulates about 0.218 units at an average cost near $73,500. At $90,000 it is worth close to $19,640. That is a gain of roughly $3,640, about 22.8% on the money put in. Over one year the CAGR lands near 22.8% too. Raising the fee to 2% shaves roughly $246 off the end value. The exact figures track the inputs you enter in the calculator.</p></section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Questions and answers</h2><div className="mt-8 grid gap-4">{FAQS.map((faq) => <details key={faq.question} className="rounded-xl border border-border-subtle bg-bg-card p-5"><summary className="cursor-pointer font-semibold text-text-primary">{faq.question}</summary><p className="mt-3 max-w-3xl leading-relaxed text-text-secondary">{faq.answer}</p></details>)}</div></section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Primary references</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Method and sources</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">The formulas run only on your inputs. These references support the definitions and risk notes on this page. They do not supply prices or predict a result.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {SOURCES.map((source) => <li key={source.href} className="rounded-xl border border-border-subtle bg-bg-card p-5"><a className="font-medium text-amber hover:text-accent-hover" href={source.href}>{source.title}<span aria-hidden="true"> ↗</span></a><p className="mt-2 text-sm leading-relaxed text-text-secondary">{source.note}</p></li>)}
        </ol>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related calculators</h2><div className="mt-6 flex flex-wrap gap-3">{RELATED.map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div></section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research and risk disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">This calculator is an educational planning model, not investment, tax, or trading advice. It does not predict returns or execution. Crypto assets can lose their entire value. Confirm actual fills, fee schedules, funding, taxes, and account balances with the relevant provider before acting.</p><p className="mt-4 text-sm text-text-secondary">Built and checked by <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link>. Method assumptions are stated on this page so the result can be reproduced independently.</p></section>
    </div>
  );
}
