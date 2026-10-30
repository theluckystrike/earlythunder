import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import HalvingTracker from "@/components/HalvingTracker";
import {
  ANCHOR_BLOCK,
  daysBetween,
  eraRows,
  estimateUtc,
  formatBtc,
  formatInt,
  GENESIS_BLOCK,
  PAST_HALVINGS,
  subsidySatsAt,
  TOTAL_SCHEDULE_SATS,
} from "@/lib/bitcoin-halving";

const title = "Bitcoin halving schedule with block subsidy calculator";
const description = "Every Bitcoin halving era from block 0 with subsidy, BTC issued and cumulative supply, the four past halving dates, and a block height calculator.";
const URL = "https://earlythunder.com/bitcoin-halving-schedule";
const FETCHED = "2026-10-11";

export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: URL }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: URL }, twitter: { card: "summary_large_image", title, description } };

const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };

const schemas = [
  {
    "@context": "https://schema.org", "@type": "WebApplication", name: title,
    url: URL, description, applicationCategory: "FinanceApplication",
    operatingSystem: "Web", isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER,
  },
  {
    "@context": "https://schema.org", "@type": "Article", headline: title,
    description, url: URL, mainEntityOfPage: URL,
    datePublished: "2026-10-11", dateModified: "2026-10-11", author: AUTHOR, publisher: PUBLISHER,
  },
  {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
      { "@type": "ListItem", position: 2, name: title, item: URL },
    ],
  },
];

const SOURCES = [
  { title: "Bitcoin Core src/validation.cpp (GetBlockSubsidy)", href: "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp", note: `The subsidy rule: halvings = nHeight / nSubsidyHalvingInterval, 0 when halvings >= 64, and 50 * COIN shifted right by halvings. Fetched ${FETCHED}.` },
  { title: "Bitcoin Core src/kernel/chainparams.cpp", href: "https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp", note: `Main network values nSubsidyHalvingInterval = 210000 and nPowTargetSpacing = 10 * 60. Fetched ${FETCHED}.` },
  { title: "Bitcoin Core src/consensus/amount.h", href: "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/amount.h", note: `COIN = 100,000,000 satoshis. MAX_MONEY = 21,000,000 * COIN, which the comment calls a sanity check and not the total money supply. Fetched ${FETCHED}.` },
  { title: "Bitcoin whitepaper", href: "https://bitcoin.org/bitcoin.pdf", note: `Section 6 (Incentive) describes the move from new coins to transaction fees. Fetched ${FETCHED}.` },
  { title: "mempool.space block data", href: `https://mempool.space/block/${ANCHOR_BLOCK.hash}`, note: `Block header timestamps for blocks 0, 210,000, 420,000, 630,000, 840,000 and ${formatInt(ANCHOR_BLOCK.height)}. Fetched ${FETCHED}.` },
] as const;

const RELATED = [
  { href: "/opportunities/bitcoin", label: "Bitcoin thesis" },
  { href: "/guides/how-to-read-crypto-supply-metrics", label: "How to read crypto supply metrics" },
] as const;

function utcText(iso: string): string {
  return iso.replace("T", " ").replace("Z", " UTC");
}

export default function BitcoinHalvingSchedulePage() {
  const rows = eraRows();
  const nextHeight = 1_050_000;
  const blocksToNext = nextHeight - ANCHOR_BLOCK.height;
  const daysToNext = ((blocksToNext * 600) / 86_400).toFixed(1);
  const starts = [GENESIS_BLOCK.timeUtc, ...PAST_HALVINGS.map((row) => row.timeUtc)];
  const gaps = PAST_HALVINGS.map((row, index) => daysBetween(starts[index], row.timeUtc));
  const shortfallSats = 21_000_000 * 100_000_000 - TOTAL_SCHEDULE_SATS;
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas.map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-sm text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>{title}</span></nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />Consensus schedule reference</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">Bitcoin pays a block subsidy to the miner of each block. Bitcoin Core cuts the subsidy in half every 210,000 blocks. This page lists each era from block 0, the four past halvings with their block timestamps, and a calculator for any block height.</p>
        <p className="mt-5 inline-flex max-w-3xl rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 font-mono text-sm leading-relaxed text-text-secondary">No price data. The numbers come from the Bitcoin Core source code and from block timestamps, fetched {FETCHED}.</p>
      </header>

      <HalvingTracker />

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The rule in Bitcoin Core</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">halvings = floor(height / 210,000)</div>
          <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">subsidy_sats = (50 &times; 100,000,000) &gt;&gt; halvings, and 0 when halvings &ge; 64</div>
          <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">issued(h) = sum of subsidy_sats for heights 0 to h, with h included</div>
          <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">next_halving = (halvings + 1) &times; 210,000</div>
        </div>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>GetBlockSubsidy in src/validation.cpp shifts 50 &times; COIN to the right by the number of halvings. COIN is 100,000,000 satoshis (src/consensus/amount.h). On the main network, nSubsidyHalvingInterval is 210000 and nPowTargetSpacing is 10 &times; 60 seconds (src/kernel/chainparams.cpp). A comment in GetBlockSubsidy says that the cut will occur approximately every 4 years.</p>
          <p>On this page, supply issued up to height h is the sum of the subsidies for heights 0 to h, with h included. It is supply issued by schedule. It does not count coins that miners did not claim or coins that cannot be spent.</p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The four past halvings</h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-text-secondary">The halving heights are fixed by the rule. The times are the header timestamps of those blocks on mempool.space, fetched {FETCHED}. Block 0 has the timestamp {utcText(GENESIS_BLOCK.timeUtc)}.</p>
        <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Past halvings table">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Past Bitcoin halvings with block height, block timestamp, days after the previous era start, and subsidy change</caption>
            <thead>
              <tr className="border-b border-border-subtle font-mono text-sm text-text-secondary">
                <th scope="col" className="py-3 pr-4">Halving</th>
                <th scope="col" className="py-3 pr-4">Block</th>
                <th scope="col" className="py-3 pr-4">Block timestamp (UTC)</th>
                <th scope="col" className="py-3 pr-4">Days after previous era start</th>
                <th scope="col" className="py-3">Subsidy before and after (BTC)</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {PAST_HALVINGS.map((row, index) => (
                <tr key={row.height} className="border-b border-border-subtle">
                  <td className="py-3 pr-4 font-mono">{row.number}</td>
                  <td className="py-3 pr-4 font-mono"><a className="text-amber hover:text-accent-hover" href={`https://mempool.space/block/${row.hash}`}>{formatInt(row.height)}</a></td>
                  <td className="py-3 pr-4 font-mono">{utcText(row.timeUtc)}</td>
                  <td className="py-3 pr-4 font-mono">{gaps[index]}</td>
                  <td className="py-3 font-mono">{formatBtc(subsidySatsAt(row.height - 1))} to {formatBtc(subsidySatsAt(row.height))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-text-secondary">Four years of 365.25 days is 1,461 days. Each of the four eras so far ended before that mark: the gaps were {gaps.join(", ")} days.</p>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The next halving, with an estimated date</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>The next halving is at block {formatInt(nextHeight)}. The rule fixes that height. It does not fix a date.</p>
          <p>Estimate: {utcText(estimateUtc(nextHeight))}. Assumption: 600 seconds per block (the nPowTargetSpacing value) from block {formatInt(ANCHOR_BLOCK.height)}, which has the timestamp {utcText(ANCHOR_BLOCK.timeUtc)}. That is {formatInt(blocksToNext)} blocks, or {daysToNext} days at 600 seconds per block. Real block times vary, and each past era was shorter than four years, so this date is an estimate only. The <Link href="/bitcoin-difficulty-adjustment-calculator">Bitcoin difficulty adjustment calculator</Link> shows how the retarget every 2,016 blocks moves the block time back toward 600 seconds.</p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Every era from block 0</h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-text-secondary">Each era has 210,000 blocks. The cumulative column is the supply issued by schedule at the last block of the era. Era 32 starts at block 6,720,000 and pays 1 satoshi per block. Era 33 starts at block 6,930,000 and pays 0. All later eras also pay 0, and from era 64 Bitcoin Core returns 0 directly.</p>
        <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Era table">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <caption className="sr-only">Bitcoin subsidy eras 0 to 33 with start height, subsidy, BTC issued in the era, and cumulative supply issued by schedule</caption>
            <thead>
              <tr className="border-b border-border-subtle font-mono text-sm text-text-secondary">
                <th scope="col" className="py-3 pr-4">Era</th>
                <th scope="col" className="py-3 pr-4">Start height</th>
                <th scope="col" className="py-3 pr-4">Subsidy (BTC)</th>
                <th scope="col" className="py-3 pr-4">BTC issued in era</th>
                <th scope="col" className="py-3">Cumulative at era end (BTC)</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {rows.map((row) => (
                <tr key={row.era} className="border-b border-border-subtle">
                  <td className="py-3 pr-4 font-mono">{row.era}</td>
                  <td className="py-3 pr-4 font-mono">{formatInt(row.startHeight)}</td>
                  <td className="py-3 pr-4 font-mono">{formatBtc(row.subsidySats)}</td>
                  <td className="py-3 pr-4 font-mono">{formatBtc(row.eraIssueSats)}</td>
                  <td className="py-3 font-mono">{formatBtc(row.cumulativeEndSats)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Why the total is less than 21 million</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>The sum of all eras is {formatInt(TOTAL_SCHEDULE_SATS)} satoshis, or {formatBtc(TOTAL_SCHEDULE_SATS)} BTC. That is {formatBtc(shortfallSats)} BTC less than 21,000,000 BTC.</p>
          <p>The right shift drops the remainder. Era 10 is the first era where 5,000,000,000 satoshis does not divide exactly by 2 to the power of the era, so its subsidy is 4,882,812 satoshis and not 4,882,812.5.</p>
          <p>In src/consensus/amount.h, MAX_MONEY is 21,000,000 &times; COIN. The comment in that file says that this constant is not the total money supply but a sanity check.</p>
          <p>The Bitcoin whitepaper says: &ldquo;Once a predetermined number of coins have entered circulation, the incentive can transition entirely to transaction fees and be completely inflation free.&rdquo;</p>
        </div>
      </section>

      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-sm uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">Block 970,858</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">Enter 970,858. The era is floor(970,858 / 210,000) = 4. The subsidy is 5,000,000,000 &gt;&gt; 4 = 312,500,000 satoshis, or 3.12500000 BTC. The next halving is (4 + 1) &times; 210,000 = 1,050,000, which is 79,142 blocks away. Supply issued by schedule up to block 970,858 is 19,687,500 BTC for eras 0 to 3, plus 130,859 blocks &times; 3.125 BTC = 408,934.375 BTC. The total is 20,096,434.37500000 BTC.</p></section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-sm uppercase tracking-wider text-text-secondary">Primary references</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Method and sources</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">The calculator and both tables use the constants below. The block timestamps are stored in the page source. The calculator does not fetch data from an outside service.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {SOURCES.map((source) => <li key={source.href} className="rounded-xl border border-border-subtle bg-bg-card p-5"><a className="font-medium text-amber hover:text-accent-hover" href={source.href}>{source.title}<span aria-hidden="true"> ↗</span></a><p className="mt-2 text-sm leading-relaxed text-text-secondary">{source.note}</p></li>)}
        </ol>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related pages</h2><div className="mt-6 flex flex-wrap gap-3">{RELATED.map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div></section>

      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">This page describes the consensus subsidy rule. It is not investment advice, and it does not predict prices. Check the Bitcoin Core source before you rely on a number.</p><p className="mt-4 text-sm text-text-secondary">Written by <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link>.</p></section>
    </div>
  );
}
