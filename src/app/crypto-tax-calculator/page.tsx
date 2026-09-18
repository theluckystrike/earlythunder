import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import TaxCalculator from "@/components/TaxCalculator";

export const metadata: Metadata = {
  title: "Crypto tax calculator for real capital gains math",
  description:
    "Estimate the capital gains tax on a crypto sale. Enter buy and sell prices, quantity, and fees to get cost basis, gain, tax owed, and after-tax proceeds.",
  alternates: { canonical: "https://earlythunder.com/crypto-tax-calculator" },
  openGraph: {
    title: "Crypto tax calculator for real capital gains math",
    description:
      "Estimate the capital gains tax on a crypto sale. Enter buy and sell prices, quantity, and fees to get cost basis, gain, tax owed, and after-tax proceeds.",
    url: "https://earlythunder.com/crypto-tax-calculator",
    siteName: "Early Thunder",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Crypto tax calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto tax calculator for real capital gains math",
    description:
      "Enter buy and sell prices, quantity, and fees to see cost basis, gain, tax owed, and what lands in your account after tax.",
    images: ["/og-default.png"],
  },
};

const TITLE = "Crypto tax calculator for real capital gains math";
const URL = "https://earlythunder.com/crypto-tax-calculator";
const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };

function schemas(): readonly Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: TITLE,
      url: URL, description: metadata.description, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: TITLE,
      description: metadata.description, url: URL, mainEntityOfPage: URL,
      datePublished: "2026-09-18", dateModified: "2026-09-18", author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: TITLE, item: URL },
      ],
    },
  ];
}

const RELATED = [
  { href: "/crypto-profit-calculator", label: "Profit calculator" },
  { href: "/crypto-investment-calculator", label: "Investment calculator" },
  { href: "/crypto-fee-calculator", label: "Fee calculator" },
  { href: "/crypto-dca-calculator", label: "DCA calculator" },
  { href: "/crypto-average-price-calculator", label: "Average price calculator" },
  { href: "/crypto-position-size-calculator", label: "Position size calculator" },
  { href: "/crypto-apy-calculator", label: "APY calculator" },
  { href: "/crypto-buy-the-dip-calculator", label: "Buy the dip calculator" },
] as const;

const FORMULAS = [
  "Cost basis = buy price × quantity + buy fee",
  "Proceeds = sell price × quantity − sell fee",
  "Gain = proceeds − cost basis",
  "Holding period = sell date − buy date",
  "Short term tax = gain × income bracket rate",
  "Long term tax = gain × long term capital gains rate",
  "After tax proceeds = proceeds − tax owed",
  "Tax drag = tax owed ÷ proceeds",
] as const;

const SECTIONS = [
  {
    heading: "What this model shows",
    paragraphs: [
      "The calculator starts from one buy and one sell. You enter the price you paid, the price you sold at, and how many units changed hands. Fees on both trades fold into the numbers, because a fee you paid is money you never got back.",
      "The output splits the trade into four amounts: what the position cost you, what the sale brought in, the gain on top, and the tax on that gain. The rate applied depends on how long you held the asset.",
      "Nothing here touches your other income, your other trades, or your state return. It is one position, priced on its own.",
    ],
  },
  {
    heading: "Short term versus long term",
    paragraphs: [
      "Hold an asset for 365 days or less and the gain counts as short term in the United States. It stacks on top of your ordinary income and is taxed at your marginal bracket rate. Hold it for more than 365 days and the gain moves into long term treatment, where a lower set of rates applies.",
      "The gap between the two is wide. A trader in the 32% bracket pays 32% on a short term gain and 15% or 20% on the same gain held past a year. On a $5,000 gain that difference is hundreds of dollars for waiting.",
      "The day count matters more than the calendar. Buying on March 1 means the long term clock starts running the next day. Selling on the following March 1 is still short term if the count lands on day 365. Add a day of buffer when the holding period is close.",
    ],
  },
  {
    heading: "Where the fee drag hides",
    paragraphs: [
      "Buy fees raise your basis, which lowers the taxable gain. Sell fees lower your proceeds, which lowers the gain too. Both effects shrink the tax bill, but they cost you more cash than they save in tax. A $300 sell fee on a $60,000 sale cuts $300 from your proceeds and saves at most $90 in tax at a 30% rate.",
      "Exchange fees, network fees, and spread all belong in these two boxes. If your exchange charges 0.1% per side, enter 0.1 in both fee fields. If you paid a network fee in the asset itself, convert it to dollars at the price on the day and add it in.",
      "The model reports the effective drag as a share of proceeds. It is the clearest single number for comparing two venues with different fee schedules on the same trade.",
    ],
  },
  {
    heading: "What the estimate leaves out",
    paragraphs: [
      "Wash sale rules do not apply to crypto the way they apply to stocks, so a loss harvested today can be rebought tomorrow and still count. That rule can change. Check the current guidance before you plan around it.",
      "The model ignores state income tax, net investment income tax, and any bracket effects from your other income. It also treats the whole gain as taxable, with no offsetting losses from elsewhere in your portfolio.",
      "Cost basis accounting method matters when you bought the same asset more than once. Specific identification, FIFO, and average cost can produce three different gains from one sale. This page models a single lot and applies the rate you enter.",
    ],
  },
] as const;

const FAQS = [
  {
    question: "How does the calculator decide between short term and long term?",
    answer:
      "You enter how many days you held the asset. A holding period of 365 days or less is treated as short term, and the income bracket rate applies. More than 365 days is treated as long term, and the flat long term rate applies. The widget shows which rule it used next to the tax line.",
  },
  {
    question: "Why do fees change my tax bill?",
    answer:
      "Fees are real money spent on the trade, so they adjust the gain. A buy fee adds to your cost basis and shrinks the gain. A sell fee reduces your proceeds and shrinks the gain. The trade-off is that the fee itself usually costs more than the tax it saves.",
  },
  {
    question: "What bracket should I enter for short term gains?",
    answer:
      "Use your marginal federal rate for ordinary income, the rate on the last dollar you earned. A single filer in the 24% bracket enters 24. If you are not sure, look at the tax bracket table for your filing status and taxable income for the year.",
  },
  {
    question: "Is 15% the right long term rate for me?",
    answer:
      "Most filers land in the 15% long term bracket. Higher earners pay 20%, and lower earners can pay 0%. Enter the rate that applies to your taxable income. The default is 15% because it is the most common case.",
  },
  {
    question: "Does this include state tax or the net investment income tax?",
    answer:
      "No. The model covers the federal capital gains piece only. State rates vary from zero to double digits, and the 3.8% net investment income tax applies above certain income thresholds. Add those on top of the number this page returns.",
  },
] as const;

const SOURCES = [
  { title: "IRS: Digital assets", href: "https://www.irs.gov/filing/digital-assets", note: "Official guidance on how the IRS treats virtual currency, including the property classification that makes gains taxable." },
  { title: "IRS: Topic no. 409, capital gains and losses", href: "https://www.irs.gov/taxtopics/tc409", note: "Defines short term and long term holding periods, the 365 day threshold, and how gains are reported." },
  { title: "IRS: Publication 544, sales and other dispositions of assets", href: "https://www.irs.gov/publications/p544", note: "Covers basis, amount realized, and the fee treatment used in the cost basis and proceeds lines." },
  { title: "Investor.gov: Capital gains tax", href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/capital-gains-tax", note: "Plain language explainer on capital gains and the difference between short term and long term rates." },
  { title: "Investor.gov: Taxes on investments", href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/taxes-investments", note: "Background on how investment income is taxed and why the holding period changes the rate." },
  { title: "IRS: Publication 550, investment income and expenses", href: "https://www.irs.gov/publications/p550", note: "Reference for how expenses tied to an investment, including transaction fees, affect the result." },
] as const;

export default function CryptoTaxCalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas().map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>{TITLE}</span></nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />CAPITAL GAINS MODEL</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{TITLE}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{metadata.description as string}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">Enter one buy and one sell. The model returns cost basis, proceeds, gain or loss, tax owed, and what actually lands in your account. Holding period decides whether the short term or long term rate applies.</p>
        <p className="mt-5 inline-flex max-w-3xl rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">No tax return is filed and no account is connected. Every number comes from the values you enter.</p>
      </header>
      <TaxCalculator />
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The calculation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{FORMULAS.map((formula) => <div key={formula} className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{formula}</div>)}</div>
      </section>
      {SECTIONS.map((section) => <section key={section.heading} className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2><div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-xs uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">Half a Bitcoin bought and sold inside a year</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">Buy 0.5 units at $40,000 each. Pay a 0.5% buy fee of $100, so the position costs $20,100. Sell at $60,000 for $30,000 gross, pay a 0.5% sell fee of $150, and the proceeds land at $29,850. The gain is $9,750. Held for 180 days it is short term, and at a 24% bracket the tax owed is $2,340. That leaves $27,510 in your account and a tax drag of 7.84% of proceeds. Hold the same lot for 400 days instead and the long term rate drops the tax to $1,462.50, lifting the after-tax proceeds to $28,387.50. The exact figures track the inputs you enter.</p></section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Questions and answers</h2><div className="mt-8 grid gap-4">{FAQS.map((faq) => <details key={faq.question} className="rounded-xl border border-border-subtle bg-bg-card p-5"><summary className="cursor-pointer font-semibold text-text-primary">{faq.question}</summary><p className="mt-3 max-w-3xl leading-relaxed text-text-secondary">{faq.answer}</p></details>)}</div></section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Primary references</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Method and sources</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">The formulas run only on your inputs. These references support the definitions and rate rules on this page. They do not supply prices or predict a result.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {SOURCES.map((source) => <li key={source.href} className="rounded-xl border border-border-subtle bg-bg-card p-5"><a className="font-medium text-amber hover:text-accent-hover" href={source.href}>{source.title}<span aria-hidden="true"> ↗</span></a><p className="mt-2 text-sm leading-relaxed text-text-secondary">{source.note}</p></li>)}
        </ol>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related calculators</h2><div className="mt-6 flex flex-wrap gap-3">{RELATED.map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div></section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research and risk disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">This calculator is an educational planning model, not investment, tax, or trading advice. It does not predict returns or your final tax liability. Crypto assets can lose their entire value. Tax rules change, and your own situation depends on income, filing status, jurisdiction, and records. Confirm the numbers with the current IRS guidance or a qualified tax professional before you file or act.</p><p className="mt-4 text-sm text-text-secondary">Built and checked by <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link>. Method assumptions are stated on this page so the result can be reproduced independently.</p></section>
    </div>
  );
}
