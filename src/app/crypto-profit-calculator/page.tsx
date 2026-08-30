import type { Metadata } from "next";
import Link from "next/link";
import CryptoProfitCalculator from "@/components/CryptoProfitCalculator";
import JsonLd from "@/components/JsonLd";
import { BITCOIN_SNAPSHOT_ENDPOINTS, getBitcoinSnapshot, type BitcoinSnapshot } from "@/lib/bitcoin-snapshot";

const PAGE_URL = "https://earlythunder.com/crypto-profit-calculator";
const PAGE_TITLE = "Crypto Profit Calculator with Recovery Math";
const PAGE_DESCRIPTION = "Calculate crypto profit, ROI, fees, break-even price, and the gain needed to recover a loss. Includes a dated, cross-checked Bitcoin build snapshot.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

function schemas(snapshot: BitcoinSnapshot): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: PAGE_TITLE,
      url: PAGE_URL, description: PAGE_DESCRIPTION, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: ["Profit and ROI calculation", "Separate entry and exit fees", "Fee-aware break-even price", "Loss recovery curve"],
      author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION, url: PAGE_URL, mainEntityOfPage: PAGE_URL,
      datePublished: "2026-08-30", dateModified: snapshot.fetchedAt, author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto profit calculator", item: PAGE_URL },
      ],
    },
  ];
}

function money(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits }).format(value);
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function Snapshot({ snapshot }: { readonly snapshot: BitcoinSnapshot }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="snapshot-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span><h2 id="snapshot-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Bitcoin build snapshot</h2></div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">Fetched <time dateTime={snapshot.fetchedAt}>{snapshot.fetchedAt}</time></p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">The build fetched and checked these values before writing the static page. The browser calculator uses the embedded snapshot and makes no market-data request.</p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotValue label="BTC price" value={money(snapshot.price)} />
        <SnapshotValue label="All-time high" value={money(snapshot.allTimeHigh)} />
        <SnapshotValue label="Distance from high" value={`${snapshot.distanceFromHighPercent.toFixed(1)}%`} />
        <SnapshotValue label="Market capitalization" value={money(snapshot.marketCap, 0)} />
        <SnapshotValue label="Circulating supply" value={`${integer(snapshot.circulatingSupply)} BTC`} />
        <SnapshotValue label="All-time-high date" value={snapshot.allTimeHighDate.slice(0, 10)} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Provider checks</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">CoinGecko supplied the displayed row. Each secondary BTC price matched it within 2%. CoinPaprika matched its all-time-high value within 2% and the date exactly. CoinPaprika and Blockchair each matched the displayed market capitalization within 2%, while Blockchair matched circulating supply within 0.1%.</p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-text-secondary">CoinGecko last updated <time dateTime={snapshot.lastUpdated}>{snapshot.lastUpdated}</time> UTC</p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          {Object.entries(BITCOIN_SNAPSHOT_ENDPOINTS).map(([provider, href]) => <li key={provider}><a className="text-amber hover:text-accent-hover" href={href}>{provider}<span aria-hidden="true"> ↗</span></a></li>)}
        </ul>
      </div>
    </section>
  );
}

function SnapshotValue({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-card p-6"><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-2 break-words font-mono text-xl font-semibold text-text-primary">{value}</dd></div>;
}

function Explanation() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Inputs and outputs</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary"><p>Quantity mode treats the entered amount as the number of tokens. Total cash mode keeps the entry fee inside the cash budget, then derives the quantity from the remaining buy notional.</p><p>Both modes separate buy notional, entry fee, total cost, gross exit, exit fee and net proceeds. ROI uses total cost after the entry fee, not the pre-fee buy notional.</p></div>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">How the math works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"><Formula text="Total cost = buy notional + buy fee" /><Formula text="Net proceeds = gross exit − exit fee" /><Formula text="Profit = net proceeds − total cost" /><Formula text="ROI = profit ÷ total cost" /><Formula text="Break-even price = total cost ÷ quantity ÷ (1 − sell fee rate)" /><Formula text="Recovery = break-even price ÷ sell price − 1" /></div>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Why loss recovery is asymmetric</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">A loss reduces the base that the next gain works from. The curve shows that effect across fixed drawdowns from the entered buy price. Every row also responds to the selected entry and exit fees, so it solves for your fee-aware break-even point instead of repeating a generic loss table.</p>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Limits of this calculator</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">This model covers percentage trading fees. It doesn&apos;t estimate spread, slippage, funding, gas, tax, currency conversion or order-book movement. Exchange statements remain the source of record for an executed trade.</p>
      </section>
    </>
  );
}

function Formula({ text }: { readonly text: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{text}</div>;
}

function AuthorAndDisclosures() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Built and checked by Michael Lip</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary"><Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the Early Thunder research engine end to end. He wrote this calculator to keep entry fees, exit fees, and recovery math in one calculation. <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.</p>
      </section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold text-text-primary">Site-wide disclosures</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-text-secondary"><li>Research and data analysis only. Nothing here is investment advice or a recommendation to buy or sell any asset.</li><li>Crypto assets are volatile and you can lose the entire amount you put in.</li><li>Scores measure fundamentals as recorded on the stated date. They do not predict price.</li><li>Every figure carries the timestamp it was fetched. Prices move continuously and the number on the page may already be out of date.</li><li>The operator may hold positions in assets covered on this site. See the <Link className="text-amber hover:text-accent-hover" href="/portfolio">portfolio page</Link>.</li></ul>
      </section>
    </>
  );
}

export default async function CryptoProfitCalculatorPage() {
  const snapshot = await getBitcoinSnapshot();
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(snapshot).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>Crypto profit calculator</span></nav>
      <header><span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />Fee-aware trade math</span><h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">Crypto profit calculator</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">Calculate profit or loss, ROI, separate trading fees, break-even price, and the gain needed to recover from a drawdown.</p><p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">Start with the provider-checked Bitcoin build snapshot or enter any trade. Every calculation stays in your browser.</p></header>
      <CryptoProfitCalculator snapshot={snapshot} />
      <Snapshot snapshot={snapshot} />
      <Explanation />
      <AuthorAndDisclosures />
    </div>
  );
}
