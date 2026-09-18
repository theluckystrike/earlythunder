import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import BuyTheDipCalculator from "@/components/BuyTheDipCalculator";
import {
  compareStrategies,
  dipBacktestSummary,
  dipDisclosureText,
  dipIntroText,
  dipWorkedExample,
  formatHumanDate,
  formatPercent,
  formatUnits,
  formatUsd,
  type PriceDataset,
  type PriceRow,
} from "@/lib/dip-calc";
import dataset from "../../../data/btc-daily-365.json";

const title = "Crypto buy the dip calculator with backtest";
const description = "Model staged crypto buys on price dips with a dip threshold, trading fees, and a 364-day real Bitcoin price backtest cross-checked across two exchanges.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-buy-the-dip-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-buy-the-dip-calculator", images: [{ url: "/og-default.png", width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] } };

const rows = (dataset as PriceDataset).rows;
const BACKTEST_CASH = 10000;
const BACKTEST_TRANCHES = 4;
const BACKTEST_THRESHOLD = 15;
const BACKTEST_FEE = 0.25;
const comparison = compareStrategies(rows, { totalCash: BACKTEST_CASH, tranches: BACKTEST_TRANCHES, dipThresholdPercent: BACKTEST_THRESHOLD, feePercent: BACKTEST_FEE });
const { dip, baseline } = comparison;
const windowLabel = `${formatHumanDate(rows[0].date)} to ${formatHumanDate(rows[rows.length - 1].date)}`;

const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };

const schemas = [
  { "@context": "https://schema.org", "@type": "WebApplication", name: title, url: "https://earlythunder.com/crypto-buy-the-dip-calculator", description, applicationCategory: "FinanceApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER },
  { "@context": "https://schema.org", "@type": "Article", headline: title, description, url: "https://earlythunder.com/crypto-buy-the-dip-calculator", mainEntityOfPage: "https://earlythunder.com/crypto-buy-the-dip-calculator", datePublished: "2026-09-18", dateModified: "2026-09-18", author: AUTHOR, publisher: PUBLISHER },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" }, { "@type": "ListItem", position: 2, name: title, item: "https://earlythunder.com/crypto-buy-the-dip-calculator" }] },
];

const RELATED = [
  { href: "/crypto-dca-calculator", label: "DCA calculator" },
  { href: "/crypto-average-price-calculator", label: "Average price calculator" },
  { href: "/crypto-fee-calculator", label: "Fee calculator" },
  { href: "/crypto-apy-calculator", label: "APY calculator" },
  { href: "/crypto-position-size-calculator", label: "Position size calculator" },
  { href: "/crypto-profit-calculator", label: "Profit calculator" },
  { href: "/crypto-investment-calculator", label: "Investment calculator" },
] as const;

const SECTIONS = [
  {
    heading: "What a dip trigger waits for",
    paragraphs: [
      "A buy the dip plan holds cash until price falls a set distance below the highest price seen so far. That running high is the local peak, not a market forecast. The trigger fires only when the drop crosses the threshold you enter.",
      "Each tranche is a fixed slice of the total cash. When a dip crosses the threshold, one slice converts to the asset. If the threshold is never met again, the unused slices deploy at the final price of the window.",
    ],
  },
  {
    heading: "Why waiting is not always better",
    paragraphs: [
      "Cash sitting idle earns nothing while it waits. If price keeps climbing, the later tranches buy fewer units than a single earlier purchase. That is the cost of patience, and this page shows it in dollars against a lump sum.",
      "Dips are only identified in hindsight on real data. A live market gives no advance signal that a fall has finished. The model assumes the trigger price is available, which real order books may not deliver instantly.",
    ],
  },
  {
    heading: "What the backtest adds",
    paragraphs: [
      "Dollar amounts in the backtest are fixed at $10,000 with four tranches and a 15% trigger at a 0.25% fee. Change the parameters to test a tighter trigger or more tranches against the same real prices.",
    ],
  },
] as const;

const FAQS = [
  { question: "Does this calculator predict the next Bitcoin dip?", answer: "No. The synthetic path and the real backtest both assume prices that are already known. The trigger tells you when a modeled drop crosses a threshold, not when a real market will fall." },
  { question: "What happens if no dip crosses the threshold?", answer: "Every unused tranche deploys at the final price of the window. You still put all of the entered cash to work, just later and at whatever the final price happens to be." },
  { question: "Is cash idle really free?", answer: "In this model idle cash earns no yield and pays no penalty. Real cash can sit in a wallet, earn interest, or be eaten by inflation. None of that is included here." },
  { question: "Where does the backtest data come from?", answer: "The backtest below uses 364 published daily Bitcoin prices from CoinGecko, cross-checked against Kraken at a 1% tolerance, fetched on the date stated in the data disclosure." },
] as const;

const SOURCES = [
  { title: "Investor.gov dollar-cost averaging glossary", href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging", note: "Defines equal purchases at regular intervals and explains why a fixed amount buys more units at lower prices, the same logic a dip trigger relies on." },
  { title: "SEC bulletin on investment fees", href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated", note: "Explains that transaction fees reduce the money left in an investment and should be checked against account records before execution." },
] as const;

const FORMULAS = [
  "Drawdown below high = (high − price) ÷ high × 100",
  "Units per tranche = tranche cash × (1 − fee rate) ÷ price",
  "Average cost = total cash deployed ÷ total units",
  "Ending value = total units × final price",
] as const;

const EXAMPLES = [
  { heading: "A dip at 25%", body: "Start with $10,000 across four tranches and a 15% trigger. Each tranche holds $2,500. When price falls 15% below the running high, one $2,500 slice buys. A 25% drawdown therefore spends two slices. Leftover cash deploys at the end of the window." },
  { heading: "A slow climb", body: "Set a 40% trigger and price rises most of the window. Few tranches fire, so nearly all cash deploys at the final price. The average cost lands close to that ending price, which is rarely the cheapest point in the history." },
  { heading: "Fees on every slice", body: "At a 1% fee each purchase keeps 99% of its cash as units. Across four slices the drag is small, but across many tranches or repeated windows it grows. The calculator shows the fee effect in the average cost." },
] as const;

const DISCLOSURE = [
  "Primary price source CoinGecko daily USD closes, window 2025-09-19 to 2026-09-18.",
  "Cross-checked against Kraken XBTUSD daily opens at a 1% tolerance, with 364 of 364 readings matched.",
  "Data fetched on 2026-09-18 and not updated automatically by this page.",
  "One reading was dropped because CoinGecko and Kraken disagreed by 3.71%.",
  "Dips are only recognizable in hindsight and this backtest is not a forecast.",
] as const;

function BacktestSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Backtest of a 15% dip plan on a year of Bitcoin</h2>
      <p className="mt-4 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">The calculator above runs on a synthetic path. Real markets do not move that way. So below, the same dip rules run against {rows.length} dated daily Bitcoin prices, $10,000 in four tranches with a 15% trigger and a 0.25% fee.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Cash deployed in dips</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dip.cashDeployedDuringDips)}</p><p className="mt-1 text-sm text-text-secondary">{dip.dipsDeployed} of {dip.totalTranches} tranches on {formatPercent(dip.percentDuringDips)} of the cash</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Cash deployed at end</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dip.cashDeployedAtEnd)}</p><p className="mt-1 text-sm text-text-secondary">{dip.endDeploy ? "Leftover slices bought at the final price" : "No leftover cash after the dips"}</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Ending value</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dip.finalValue)}</p><p className="mt-1 text-sm text-text-secondary">{formatUnits(dip.units)} units, {formatPercent(dip.roiPercent)} ROI, peak {formatUsd(dip.peakPrice)}</p></div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Average cost</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dip.averageCost)}</p><p className="mt-1 text-sm text-text-secondary">against a final price of {formatUsd(dip.finalPrice)}</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Lump sum baseline</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(baseline.finalValue)}</p><p className="mt-1 text-sm text-text-secondary">{formatPercent(baseline.roiPercent)} ROI on the same {formatUsd(baseline.invested)}</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dip minus lump sum</p><p className="mt-2 text-2xl font-semibold text-text-primary">{comparison.dipBeatsBaseline ? formatUsd(Math.abs(comparison.gainDifference)) : `-${formatUsd(Math.abs(comparison.gainDifference))}`}</p><p className="mt-1 text-sm text-text-secondary">{comparison.dipBeatsBaseline ? "Dip plan led on this window" : "Lump sum led on this window"}</p></div>
      </div>
      <h3 className="mt-10 text-xl font-semibold text-text-primary">Dip plan versus lump sum on the same cash</h3>
      <p className="mt-4 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">{dipBacktestSummary(comparison, BACKTEST_FEE, windowLabel)}</p>
      <h3 className="mt-10 text-xl font-semibold text-text-primary">Data disclosure</h3>
      <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-text-secondary">
        {DISCLOSURE.map((line) => <li key={line} className="flex gap-2"><span aria-hidden="true">&bull;</span><span>{line}</span></li>)}
      </ul>
    </section>
  );
}

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas.map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>{title}</span></nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />DIP BUYING MODEL</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{description}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{dipIntroText()}</p>
        <p className="mt-5 inline-flex max-w-3xl rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">No market feed is used. Every price, rate, fee, and balance comes from the values you enter or the fixed backtest dataset.</p>
      </header>
      <BuyTheDipCalculator />
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The calculation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{FORMULAS.map((formula) => <div key={formula} className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{formula}</div>)}</div>
      </section>
      {SECTIONS.map((section) => <section key={section.heading} className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2><div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-xs uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">How a dip plan spends its cash</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{dipWorkedExample(BACKTEST_THRESHOLD, BACKTEST_TRANCHES, BACKTEST_CASH)}</p></section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Questions and answers</h2><div className="mt-8 grid gap-4">{FAQS.map((faq) => <details key={faq.question} className="rounded-xl border border-border-subtle bg-bg-card p-5"><summary className="cursor-pointer font-semibold text-text-primary">{faq.question}</summary><p className="mt-3 max-w-3xl leading-relaxed text-text-secondary">{faq.answer}</p></details>)}</div></section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Primary references</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Method and sources</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">The formulas run only on your inputs and the fixed backtest dataset. These references support the definitions and risk notes on this page. They do not supply prices or predict a result.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {SOURCES.map((source) => <li key={source.href} className="rounded-xl border border-border-subtle bg-bg-card p-5"><a className="font-medium text-amber hover:text-accent-hover" href={source.href}>{source.title}<span aria-hidden="true"> ↗</span></a><p className="mt-2 text-sm leading-relaxed text-text-secondary">{source.note}</p></li>)}
        </ol>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related calculators</h2><div className="mt-6 flex flex-wrap gap-3">{RELATED.map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div></section>
      <BacktestSection />
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research and risk disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">{dipDisclosureText()} Buy the dip plans can wait a long time for a trigger and can still lose money if the market falls further after each purchase.</p></section>
      <p className="mt-10 border-t border-border-subtle pt-6 text-sm text-text-secondary">Built and checked by Michael Lip</p>
    </div>
  );
}
