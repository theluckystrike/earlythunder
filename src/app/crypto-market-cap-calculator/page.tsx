import type { Metadata } from "next";
import Link from "next/link";
import scorecardData from "../../../data/altcoin-scorecard.json";
import JsonLd from "@/components/JsonLd";
import MarketCapCalculator from "@/components/MarketCapCalculator";
import { getMarketUniverse, UNIVERSE_ENDPOINTS, type MarketUniverse, type UniverseRow } from "@/lib/market-universe";
import {
  circulatingSharePercent,
  compareLegs,
  dilutedValuation,
  formatCompactUsd,
  formatMultiple,
  formatPercent,
  formatRank,
  formatUsd,
  overhangMultiple,
  positiveWithin,
  MAX_SCORECARD_SUBSCORE,
  MAX_SUPPLY_UNITS,
  MAX_VALUATION_USD,
  type MarketCapRow,
  type MarketCapSnapshot,
  type ScorecardOverlay,
} from "@/lib/market-cap-math";

const PAGE_URL = "https://earlythunder.com/crypto-market-cap-calculator";
const PAGE_TITLE = "Crypto Market Cap Calculator with Dilution Correction";
const PAGE_DESCRIPTION =
  "Price any token at another token's market cap, then see the fully diluted answer and the dilution haircut the standard calculators leave out.";

/** Bounds. Nothing on this page loops without one of these. */
const MAX_EMBEDDED_ROWS = 300;
const MAX_SCORECARD_TOKENS = 400;
const MAX_SCORECARD_KEYS = 60;
const DEFAULT_SOURCE_RANK_CEILING = 60;
const OVERHANG_TABLE_RANK_CEILING = 100;
const OVERHANG_TABLE_ROWS = 10;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

/* ── Scorecard join ──────────────────────────────────────── */

interface RawScorecardToken {
  readonly symbol?: unknown;
  readonly score?: unknown;
  readonly verdict?: unknown;
  readonly scores?: unknown;
}

/** Reads one raw research row, returning null rather than repairing a bad one. */
function toOverlay(raw: RawScorecardToken): readonly [string, ScorecardOverlay] | null {
  if (!raw || typeof raw !== "object") return null;
  const symbol = typeof raw.symbol === "string" ? raw.symbol.toUpperCase() : null;
  const score = typeof raw.score === "number" && Number.isFinite(raw.score) ? raw.score : null;
  const verdict = typeof raw.verdict === "string" && raw.verdict.length > 0 && raw.verdict.length <= 40 ? raw.verdict : null;
  if (symbol === null || score === null || verdict === null) return null;
  const scores = raw.scores;
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;
  const table = scores as Record<string, unknown>;
  const keys = Object.keys(table);
  if (keys.length === 0 || keys.length > MAX_SCORECARD_KEYS) return null;
  const unlock = table.unlock_schedule;
  const ratio = table.circ_fdv_ratio;
  if (typeof unlock !== "number" || typeof ratio !== "number") return null;
  if (!Number.isFinite(unlock) || !Number.isFinite(ratio)) return null;
  return [symbol, { score, maxScore: keys.length * MAX_SCORECARD_SUBSCORE, verdict, unlockSchedule: unlock, circFdvRatio: ratio }];
}

/** Symbol keyed index of the dated research file. */
function scorecardIndex(): ReadonlyMap<string, ScorecardOverlay> {
  const raw: unknown = (scorecardData as { tokens?: unknown }).tokens;
  const index = new Map<string, ScorecardOverlay>();
  if (!Array.isArray(raw)) return index;
  const ceiling = Math.min(raw.length, MAX_SCORECARD_TOKENS);
  for (let position = 0; position < ceiling; position += 1) {
    const entry = toOverlay(raw[position] as RawScorecardToken);
    if (entry === null) continue;
    if (!index.has(entry[0])) index.set(entry[0], entry[1]);
  }
  return index;
}

function scorecardUpdatedAt(): string {
  const value = (scorecardData as { updated_at?: unknown }).updated_at;
  if (typeof value !== "string" || value.length < 10 || value.length > 40) return "";
  return value;
}

/* ── Snapshot assembly ───────────────────────────────────── */

function toCalculatorRow(row: UniverseRow, overlays: ReadonlyMap<string, ScorecardOverlay>): MarketCapRow | null {
  if (positiveWithin(row.marketCap, MAX_VALUATION_USD) === null) return null;
  if (positiveWithin(row.circulatingSupply, MAX_SUPPLY_UNITS) === null) return null;
  const overlay = overlays.get(row.symbol);
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    rank: row.rank,
    price: row.price,
    marketCap: row.marketCap,
    fullyDilutedValuation: row.fullyDilutedValuation,
    circulatingSupply: row.circulatingSupply,
    totalSupply: row.totalSupply,
    maxSupply: row.maxSupply,
    isStablecoin: row.isStablecoin,
    scorecard: overlay === undefined ? null : overlay,
  };
}

/**
 * The token with the largest supply overhang inside the measured leading ranks.
 * It is chosen from data rather than typed in, so the default pair always
 * demonstrates the correction this page exists for.
 */
function pickDefaultSource(rows: readonly MarketCapRow[], bitcoinId: string): MarketCapRow | null {
  if (rows.length === 0) return null;
  let best: MarketCapRow | null = null;
  let bestRatio = 0;
  const ceiling = Math.min(rows.length, MAX_EMBEDDED_ROWS);
  for (let position = 0; position < ceiling; position += 1) {
    const row = rows[position];
    if (row.id === bitcoinId || row.isStablecoin || row.rank > DEFAULT_SOURCE_RANK_CEILING) continue;
    const ratio = overhangMultiple(row);
    if (ratio === null || ratio <= bestRatio) continue;
    best = row;
    bestRatio = ratio;
  }
  if (best !== null) return best;
  for (let position = 0; position < ceiling; position += 1) {
    const row = rows[position];
    if (row.id !== bitcoinId && !row.isStablecoin) return row;
  }
  return null;
}

interface OverhangEntry {
  readonly row: MarketCapRow;
  readonly overhang: number;
  readonly sharePercent: number | null;
  readonly haircutPercent: number | null;
}

/** The largest overhangs in the measured leading ranks, priced at bitcoin. */
function overhangTable(rows: readonly MarketCapRow[], bitcoin: MarketCapRow, peerCaps: readonly number[]): readonly OverhangEntry[] {
  const entries: OverhangEntry[] = [];
  const ceiling = Math.min(rows.length, MAX_EMBEDDED_ROWS);
  for (let position = 0; position < ceiling; position += 1) {
    const row = rows[position];
    if (row.id === bitcoin.id || row.isStablecoin || row.rank > OVERHANG_TABLE_RANK_CEILING) continue;
    const overhang = overhangMultiple(row);
    if (overhang === null || overhang <= 1) continue;
    const comparison = compareLegs({ source: row, target: bitcoin, overrideValuationUsd: null, peerMarketCaps: peerCaps });
    entries.push({
      row,
      overhang,
      sharePercent: comparison.sourceShare.percent,
      haircutPercent: comparison.dilutionHaircutPercent,
    });
  }
  entries.sort((left, right) => right.overhang - left.overhang);
  return entries.slice(0, OVERHANG_TABLE_ROWS);
}

function marketCaps(rows: readonly MarketCapRow[]): readonly number[] {
  const caps: number[] = [];
  const ceiling = Math.min(rows.length, MAX_EMBEDDED_ROWS);
  for (let position = 0; position < ceiling; position += 1) caps.push(rows[position].marketCap);
  return caps;
}

function scoredCount(rows: readonly MarketCapRow[]): number {
  let scored = 0;
  const ceiling = Math.min(rows.length, MAX_EMBEDDED_ROWS);
  for (let position = 0; position < ceiling; position += 1) if (rows[position].scorecard !== null) scored += 1;
  return scored;
}

/* ── Structured data ─────────────────────────────────────── */

function schemas(universe: MarketUniverse): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: PAGE_TITLE,
      url: PAGE_URL,
      description: PAGE_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Implied price at another token's market cap",
        "Fully diluted answer alongside the circulating answer",
        "Dilution haircut between the two",
        "Circulating share of both sides of the pair",
        "Implied rank against the measured market cap list",
      ],
      author,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: PAGE_URL,
      mainEntityOfPage: PAGE_URL,
      datePublished: "2026-09-07",
      dateModified: universe.fetchedAt,
      author,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto market cap calculator", item: PAGE_URL },
      ],
    },
  ];
}

/* ── View pieces ─────────────────────────────────────────── */

function Formula({ text }: { readonly text: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{text}</div>;
}

function SnapshotValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words font-mono text-xl font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

function HowItWorks({ example }: { readonly example: string }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">How the comparison is calculated</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A market capitalization is a price multiplied by the number of tokens in circulation. Nothing else goes into it. It is not money that went into the asset, it is not a measure of how much could be sold, and it carries no information about how deep the order book is at that price.
        </p>
        <p>
          Every ranked calculator for this query runs the same single line. Take the price of the token you hold, multiply by the market capitalization of the token you are comparing against, divide by the market capitalization of the token you hold. What comes out is the price your token would trade at if its circulating supply were suddenly worth the same total as the other token is worth today.
        </p>
        <p>
          That is a correct calculation of a narrow thing, and this page computes it too. {example} The problem is that it is only half of an honest answer, because the circulating supply on either side of the pair is a snapshot of a schedule that is still running.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Formula text="Market cap = price x circulating supply" />
        <Formula text="Circulating answer = reference market cap ÷ circulating supply" />
        <Formula text="Fully diluted answer = reference FDV ÷ eventual supply" />
        <Formula text="Dilution haircut = 1 − (diluted answer ÷ circulating answer)" />
      </div>
    </section>
  );
}

function DilutionSection({ scored, universeSize }: { readonly scored: number; readonly universeSize: number }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">The dilution correction</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A token that has issued a fifth of its eventual supply is not the same asset as a token that has issued all of it, even when the two report the same market capitalization today. The first one has four fifths of its tokens still to arrive, held by teams, early backers and treasuries on a vesting calendar. The second one has none.
        </p>
        <p>
          Run the standard formula on the first token and the answer is quietly wrong. It spreads the reference valuation across today&apos;s float only, so it prints a price that assumes the remaining tokens never show up. They do show up. When they do, the same total valuation has to be divided across a much larger number of tokens, and the price per token falls in proportion.
        </p>
        <p>
          The correction is to run the comparison a second time on a fully diluted basis. The reference token&apos;s fully diluted valuation is divided by the eventual supply of the token being repriced. Both sides are then measured on the same footing, and the gap between the two answers is the dilution haircut. A positive haircut means the standard calculators are printing a number that is too high. A negative haircut means the reference token itself is the one with the larger supply overhang, which pushes the honest answer above the standard one instead.
        </p>
        <p>
          Neither answer is a forecast. The fully diluted figure is not a prediction that the price will fall to it, and the circulating figure is not a prediction that the price will rise to it. Both are arithmetic on today&apos;s reported supply, and both are shown so the size of the assumption is visible instead of buried.
        </p>
        <p>
          Where the token has been through Early Thunder&apos;s own research pass, the page also shows the two sub scores that speak directly to this. {scored} of the {universeSize} tokens in the live snapshot carry a research row. The rest are marked as not scored, and no number is invented for them. Read the scoring framework on the <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link>, or the full ranking on the <Link className="text-amber hover:text-accent-hover" href="/scorecard">scorecard</Link>.
        </p>
      </div>
    </section>
  );
}

function OverhangTableSection({
  entries,
  bitcoin,
  scorecardDate,
}: {
  readonly entries: readonly OverhangEntry[];
  readonly bitcoin: MarketCapRow;
  readonly scorecardDate: string;
}) {
  const dateLabel = scorecardDate.length >= 10 ? scorecardDate.slice(0, 10) : "a date the research file does not state";
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="overhang-heading">
      <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Computed at build time</span>
      <h2 id="overhang-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        Where the standard answer is most wrong
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          These are the largest supply overhangs inside the measured leading ranks of the snapshot, sorted by fully diluted valuation as a multiple of circulating market capitalization. Each row is priced at {bitcoin.symbol} on both bases, so the haircut column is the exact percentage by which a circulating only calculator overstates the implied price for that token.
        </p>
        <p>
          The last three columns come from the dated research file. The unlock schedule and circulating to fully diluted sub scores are each rated out of 10, recorded on {dateLabel}, and a token with no research row is shown as not scored.
        </p>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th className="px-2 py-3 font-medium sm:px-3">Token</th>
              <th className="px-2 py-3 font-medium sm:px-3">Market cap</th>
              <th className="px-2 py-3 font-medium sm:px-3">FDV multiple</th>
              <th className="px-2 py-3 font-medium sm:px-3">Circulating share</th>
              <th className="px-2 py-3 font-medium sm:px-3">Haircut</th>
              <th className="px-2 py-3 font-medium sm:px-3">Unlock schedule</th>
              <th className="px-2 py-3 font-medium sm:px-3">Circ to FDV</th>
              <th className="px-2 py-3 font-medium sm:px-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.row.id} className="border-b border-border-subtle last:border-0">
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{entry.row.symbol}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{formatCompactUsd(entry.row.marketCap)}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{formatMultiple(entry.overhang)}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{entry.sharePercent === null ? "Not reported" : formatPercent(entry.sharePercent)}</td>
                <td className="px-2 py-3 font-mono text-amber sm:px-3">{entry.haircutPercent === null ? "Not available" : formatPercent(entry.haircutPercent)}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{entry.row.scorecard === null ? "Not scored" : `${entry.row.scorecard.unlockSchedule} of 10`}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{entry.row.scorecard === null ? "Not scored" : `${entry.row.scorecard.circFdvRatio} of 10`}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{entry.row.scorecard === null ? "Not scored" : entry.row.scorecard.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        A large haircut is not by itself a reason to avoid a token. It is a statement that the headline comparison you were shown elsewhere has an unpriced assumption inside it. What the supply release is worth depends on who receives it and whether they sell, which is what the research sub scores try to capture and what the arithmetic cannot.
      </p>
    </section>
  );
}

function Limits() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Where this calculation breaks</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          Matching a market capitalization says nothing about whether the market would ever pay it. The formula moves a price to satisfy an equation. It contains no view on demand, on the product, on the team, or on whether anyone would bid. A token can be arithmetically capable of a valuation and never reach it.
        </p>
        <p>
          Liquidity is not modelled anywhere in this page. Reaching a target valuation requires buyers absorbing supply at every price in between, and thin books mean the marginal trade that sets the last price is nothing like the size that would be needed to hold it. A market capitalization can be moved a long way by a small amount of real money in an illiquid asset, in both directions.
        </p>
        <p>
          The implied rank assumes every other token&apos;s market capitalization stays exactly where it is. In practice a move large enough to change a token&apos;s rank is usually happening in a market where the rest of the list is moving too, so treat the rank as a position in the list as it stands right now rather than a place the token would land.
        </p>
        <p>
          Supply schedules can move the answer more than the price does. A token that doubles its float over a year has to double its total valuation just to hold the same price, and no price chart shows that on its own. Two tokens carrying the same market capitalization are not comparable assets, and the supply schedule is the single largest reason why.
        </p>
        <p>
          Reported supply is a provider figure, not a chain measurement made here. Total supply, maximum supply and fully diluted valuation are taken as published, and some tokens report none of the three. Where that happens the fully diluted lane prints not available rather than a guess. Burns, rebases, bridged wrappers and treasury holdings all make the same reported number mean different things across projects.
        </p>
        <p>
          Finally, the comparison is a snapshot. Prices moved while this page was being generated and they are moving now. For fee aware trade math on a position you actually hold, use the <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link>. For the tokens where the research pass found something worth reading, start at <Link className="text-amber hover:text-accent-hover" href="/opportunities">opportunities</Link>.
        </p>
      </div>
    </section>
  );
}

function Sources({ universe, scorecardDate, scored }: { readonly universe: MarketUniverse; readonly scorecardDate: string; readonly scored: number }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="sources-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span>
          <h2 id="sources-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Market cap build snapshot</h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">
          Fetched <time dateTime={universe.fetchedAt}>{universe.fetchedAt}</time>
        </p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        The build fetched and checked these values before writing the static page. The browser calculator reads the embedded snapshot and makes no market data request of its own.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotValue label="Tokens in the snapshot" value={String(universe.rows.length)} />
        <SnapshotValue label="Flagged stablecoins" value={String(universe.stablecoinCount)} />
        <SnapshotValue label="Rows cross checked" value={String(universe.crossCheckedCount)} />
        <SnapshotValue label="Worst price spread" value={formatPercent(universe.worstPriceSpreadPercent, 3)} />
        <SnapshotValue label="Rows dropped in validation" value={String(universe.droppedRows)} />
        <SnapshotValue label="Tokens with a research row" value={String(scored)} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Provider checks</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          CoinGecko supplied every displayed row, including price, market capitalization, circulating supply, total supply, maximum supply and fully diluted valuation. CoinPaprika supplied an independent price for each symbol it also lists, and the widest disagreement across those matched symbols is shown above. Rows that failed range validation were dropped rather than repaired.
        </p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-text-secondary">
          Research file updated {scorecardDate.length >= 10 ? <time dateTime={scorecardDate}>{scorecardDate}</time> : "on a date the file does not state"}, a dated snapshot and not a live figure
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          {Object.entries(UNIVERSE_ENDPOINTS).map(([provider, href]) => (
            <li key={provider}>
              <a className="text-amber hover:text-accent-hover" href={href}>
                {provider}
                <span aria-hidden="true"> ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AuthorAndDisclosures() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Built and checked by Michael Lip</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the Early Thunder research engine end to end. He wrote this calculator because every ranked tool for the question answers it on circulating supply alone, which is the one assumption that most often makes the answer wrong.{" "}
          <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.
        </p>
      </section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold text-text-primary">Site-wide disclosures</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-text-secondary">
          <li>Research and data analysis only. Nothing here is investment advice or a recommendation to buy or sell any asset.</li>
          <li>Crypto assets are volatile and you can lose the entire amount you put in.</li>
          <li>Scores measure fundamentals as recorded on the stated date. They do not predict price.</li>
          <li>Every figure carries the timestamp it was fetched. Prices move continuously and the number on the page may already be out of date.</li>
          <li>The operator may hold positions in assets covered on this site. See the <Link className="text-amber hover:text-accent-hover" href="/portfolio">portfolio page</Link>.</li>
        </ul>
      </section>
    </>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default async function CryptoMarketCapCalculatorPage() {
  const universe = await getMarketUniverse();
  const overlays = scorecardIndex();
  const rows: MarketCapRow[] = [];
  const ceiling = Math.min(universe.rows.length, MAX_EMBEDDED_ROWS);
  for (let position = 0; position < ceiling; position += 1) {
    const row = toCalculatorRow(universe.rows[position], overlays);
    if (row !== null) rows.push(row);
  }
  if (rows.length === 0) throw new Error("Market cap calculator produced no usable rows.");
  const bitcoin = toCalculatorRow(universe.bitcoin, overlays);
  if (bitcoin === null) throw new Error("Market cap calculator could not build the bitcoin row.");
  const defaultSource = pickDefaultSource(rows, bitcoin.id);
  if (defaultSource === null) throw new Error("Market cap calculator could not choose a default token.");

  const caps = marketCaps(rows);
  const peerCaps = caps.filter((value, index) => rows[index].id !== defaultSource.id);
  const headline = compareLegs({ source: defaultSource, target: bitcoin, overrideValuationUsd: null, peerMarketCaps: peerCaps });
  const share = circulatingSharePercent(defaultSource);
  const fdv = dilutedValuation(defaultSource);
  const scored = scoredCount(rows);
  const scorecardDate = scorecardUpdatedAt();
  const snapshot: MarketCapSnapshot = {
    fetchedAt: universe.fetchedAt,
    scorecardUpdatedAt: scorecardDate,
    rows,
    defaultSourceId: defaultSource.id,
    defaultTargetId: bitcoin.id,
  };
  const example = `Priced that way, ${defaultSource.symbol} at the market capitalization of ${bitcoin.symbol} comes out at ${formatUsd(headline.circulating.impliedPrice)}, which is ${formatMultiple(headline.circulating.multiple)} its price in the snapshot.`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(universe).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Crypto market cap calculator</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Dilution aware valuation math
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">Crypto market cap calculator</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Price any token at another token&apos;s market capitalization, then see the same answer corrected for the supply that has not been issued yet.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          The default pair is chosen from the snapshot at build time as the largest supply overhang in the measured leading ranks. In this build that is {defaultSource.name}, which circulates {share.percent === null ? "an unreported share of" : formatPercent(share.percent)} of its eventual supply and carries a fully diluted valuation of {formatCompactUsd(fdv.usd)} against a market capitalization of {formatCompactUsd(defaultSource.marketCap)}.
        </p>
      </header>
      <MarketCapCalculator snapshot={snapshot} />
      <section className="mt-16 rounded-2xl border border-amber/40 bg-bg-tertiary p-6">
        <h2 className="text-xl font-semibold text-text-primary">The number the ranked calculators do not print</h2>
        <p className="mt-3 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          On the build default pair the circulating answer is {formatUsd(headline.circulating.impliedPrice)} and the fully diluted answer is {formatUsd(headline.diluted.impliedPrice)}. That is a dilution haircut of {formatPercent(headline.dilutionHaircutPercent)}. The circulating answer would put {defaultSource.symbol} at rank {formatRank(headline.circulating.impliedRank)} in the snapshot, the fully diluted answer at rank {formatRank(headline.diluted.impliedRank)}.
        </p>
      </section>
      <HowItWorks example={example} />
      <DilutionSection scored={scored} universeSize={rows.length} />
      <OverhangTableSection entries={overhangTable(rows, bitcoin, caps)} bitcoin={bitcoin} scorecardDate={scorecardDate} />
      <Limits />
      <Sources universe={universe} scorecardDate={scorecardDate} scored={scored} />
      <AuthorAndDisclosures />
    </div>
  );
}
