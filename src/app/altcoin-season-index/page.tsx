import type { Metadata } from "next";
import Link from "next/link";
import AltcoinSeasonIndex, { type SeasonSnapshot } from "@/components/AltcoinSeasonIndex";
import JsonLd from "@/components/JsonLd";
import scorecardFile from "../../../data/altcoin-scorecard.json";
import {
  DEFAULT_DEPTH,
  DEFAULT_WINDOW,
  MAX_DEPTH,
  MIN_COMPARABLE,
  MIN_SPLIT_HALF,
  SEASON_DEPTHS,
  SEASON_WINDOWS,
  bandLabel,
  buildDepthCurve,
  computeFundamentalsSplit,
  computeSeasonIndex,
  formatIndexValue,
  formatSignedPercent,
  readScorecardDate,
  readScorecardScores,
  windowLabel,
  type DepthPoint,
  type FundamentalsSplit,
  type SeasonIndex,
  type SeasonRow,
} from "@/lib/altcoin-season";
import { UNIVERSE_ENDPOINTS, getMarketUniverse, type MarketUniverse } from "@/lib/market-universe";

const PAGE_URL = "https://earlythunder.com/altcoin-season-index";
const PAGE_TITLE = "Altcoin Season Index, Five Windows and Five Depths";
const PAGE_DESCRIPTION = "The altcoin season index computed from a dated market fetch across 24h, 7d, 30d, 200d and 1y, at five depths, and split by fundamental score.";
/** Depths the static split table reports. Below these the ticker join is too thin. */
const SPLIT_DEPTHS = [50, 100, 200] as const;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

function schemas(fetchedAt: string): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: PAGE_TITLE,
      url: PAGE_URL, description: PAGE_DESCRIPTION, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Altcoin season index over five lookback windows",
        "Breadth recomputed at five market cap depths",
        "Index split at the median fundamental score",
        "Contributing assets ranked by margin over Bitcoin",
      ],
      author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION, url: PAGE_URL, mainEntityOfPage: PAGE_URL,
      datePublished: "2026-09-07", dateModified: fetchedAt, author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Altcoin season index", item: PAGE_URL },
      ],
    },
  ];
}

function integer(value: number): string {
  if (!Number.isFinite(value)) return "not available";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/** Trims the universe to the rows the client needs, so the embedded payload stays small. */
function embeddedRows(universe: MarketUniverse): readonly SeasonRow[] {
  const rows: SeasonRow[] = [];
  const ceiling = Math.min(universe.rows.length, 400);
  for (let index = 0; index < ceiling; index += 1) {
    const row = universe.rows[index];
    if (row.isStablecoin) continue;
    rows.push({
      id: row.id, symbol: row.symbol, name: row.name, rank: row.rank,
      change24h: row.change24h, change7d: row.change7d, change30d: row.change30d,
      change200d: row.change200d, change1y: row.change1y, isStablecoin: false,
    });
    if (rows.length >= MAX_DEPTH) break;
  }
  return rows;
}

function IndexRow({ label, index }: { readonly label: string; readonly index: SeasonIndex | null }) {
  return (
    <tr className="border-b border-border-subtle last:border-0">
      <th scope="row" className="px-2 py-3 text-left font-mono font-normal text-text-primary sm:px-3">{label}</th>
      <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{index === null ? "not available" : formatIndexValue(index.value)}</td>
      <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{index === null ? "-" : `${index.beat}/${index.comparable}`}</td>
      <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{index === null ? "-" : integer(index.excluded)}</td>
      <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{index === null ? "-" : formatSignedPercent(index.bitcoinChange)}</td>
      <td className="px-2 py-3 text-text-secondary sm:px-3">{index === null ? "-" : bandLabel(index.band)}</td>
    </tr>
  );
}

function IndexTable({ caption, firstColumn, rows }: {
  readonly caption: string;
  readonly firstColumn: string;
  readonly rows: readonly { readonly label: string; readonly index: SeasonIndex | null }[];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        <caption className="mb-4 text-left text-sm leading-relaxed text-text-secondary">{caption}</caption>
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">{firstColumn}</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Index</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Beat / total</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">No data</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">BTC change</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Band</th>
          </tr>
        </thead>
        <tbody>{rows.map((row) => <IndexRow key={row.label} label={row.label} index={row.index} />)}</tbody>
      </table>
    </div>
  );
}

function SplitTable({ splits }: { readonly splits: readonly FundamentalsSplit[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        <caption className="mb-4 text-left text-sm leading-relaxed text-text-secondary">
          The 30 day index computed separately for the higher scoring and lower scoring half of the assets that joined the research file on ticker symbol.
        </caption>
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Depth</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Matched</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Median score</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Above median</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Below median</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Read</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => (
            <tr key={split.depth} className="border-b border-border-subtle last:border-0">
              <th scope="row" className="px-2 py-3 text-left font-mono font-normal text-text-primary sm:px-3">Top {split.depth}</th>
              <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{integer(split.matched)}</td>
              <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{split.medianScore === null ? "-" : split.medianScore.toFixed(1)}</td>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{split.aboveMedian === null ? "-" : `${formatIndexValue(split.aboveMedian.value)} (${split.aboveMedian.beat}/${split.aboveMedian.comparable})`}</td>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{split.belowMedian === null ? "-" : `${formatIndexValue(split.belowMedian.value)} (${split.belowMedian.beat}/${split.belowMedian.comparable})`}</td>
              <td className="px-2 py-3 text-text-secondary sm:px-3">{split.meaningful ? "Reportable" : `Sample too thin, ${integer(split.halfSize)} per half`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Definition({ headline }: { readonly headline: SeasonIndex | null }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">What the altcoin season index actually counts</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          The index is a counting exercise, not a model. Take the largest assets by market capitalisation, remove the stablecoins, remove Bitcoin because it cannot outperform itself, and ask one question of each survivor. Did it return more than Bitcoin over the same lookback. The yes answers are added up and divided by the number of assets that had a usable price change, and multiplying by 100 gives the reading.
        </p>
        <p>
          Two thresholds carry the names. A reading of 75 or above is called altcoin season, because three quarters of the field is clearing the benchmark. A reading of 25 or below is called bitcoin season. Everything between is neither, and the number usually sits in that middle band, which is the part the headlines skip.
        </p>
        <p>
          {headline === null
            ? `At the default setting of the top ${DEFAULT_DEPTH} over ${windowLabel(DEFAULT_WINDOW)} this build could not produce a reading, because fewer than ${MIN_COMPARABLE} assets in the slice carried a price change for that window.`
            : `On the fetch behind this build, the top ${DEFAULT_DEPTH} over ${windowLabel(DEFAULT_WINDOW)} reads ${formatIndexValue(headline.value)}. That is ${headline.beat} assets out of ${headline.comparable} clearing a Bitcoin move of ${formatSignedPercent(headline.bitcoinChange)}, which puts the reading in the band called ${bandLabel(headline.band).toLowerCase()}.`}
        </p>
        <p>
          Everything above is arithmetic anyone can repeat from the same two endpoints. What follows is the part that needs a second data set.
        </p>
      </div>
    </section>
  );
}

function WindowSection({ rows }: { readonly rows: readonly { readonly label: string; readonly index: SeasonIndex | null }[] }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Five lookback windows from one fetch</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A season index is a statement about one lookback period, and the period is a choice rather than a fact. The original blockchaincenter version uses 90 days. Change the lookback and the same market can read as breadth or as concentration, so publishing one window hides the most important assumption in the metric.
        </p>
        <p>
          The CoinGecko markets endpoint serves five change windows on a single call, 24 hours, 7 days, 30 days, 200 days and 1 year. It does not serve 90 days. This page therefore does not publish a 90 day figure, and the 30 day default here is not the same measurement as the 90 day figure quoted elsewhere. Comparing the two numbers directly is a category error, and the difference between them is not a signal.
        </p>
      </div>
      <IndexTable caption={`Every available window at the top ${DEFAULT_DEPTH}, computed from one dated fetch. The no data column counts assets dropped from both sides of the ratio because the provider served no change for that window.`} firstColumn="Window" rows={rows} />
    </section>
  );
}

function DepthSection({ points }: { readonly points: readonly DepthPoint[] }) {
  const rows = points.map((point) => ({ label: `Top ${point.depth}`, index: point.index }));
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">The breadth curve, not just the headline</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          One number at one depth cannot tell you whether outperformance is broad. A reading of 60 across the top 10 and a reading of 60 across the top 200 describe very different markets, and only the second one means the move has reached past the largest names. The ranked results for this query all publish a single depth, so the shape is missing from every one of them.
        </p>
        <p>
          Read the ladder from the top down. A curve that falls as depth grows means the leaders are carrying the reading and the long tail is lagging. A curve that rises with depth means smaller assets are doing the work. A flat curve is a market moving together.
        </p>
      </div>
      <IndexTable caption={`The ${windowLabel(DEFAULT_WINDOW)} index recomputed at five cut off points, from the top 10 down to the top ${MAX_DEPTH}. Stablecoins and Bitcoin are removed before the cut, so the top 50 here is the 50 largest non stablecoin assets other than Bitcoin.`} firstColumn="Depth" rows={rows} />
    </section>
  );
}

function SplitSection({ splits, scorecardDate, tokenCount }: {
  readonly splits: readonly FundamentalsSplit[];
  readonly scorecardDate: string | null;
  readonly tokenCount: number;
}) {
  const reportable = splits.filter((split) => split.meaningful);
  const widest = reportable.length > 0 ? reportable[reportable.length - 1] : null;
  const dateLabel = scorecardDate === null ? "an undated file" : scorecardDate.slice(0, 10);
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Is the breadth coming from the good tokens or the bad ones</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          The standard index treats every asset as one vote. A protocol with real fee revenue and a finished vesting schedule counts exactly as much as a token whose only distinguishing feature is a listing. That is fine as a definition and useless as a description, because the two cases mean opposite things about what is driving the move.
        </p>
        <p>
          Early Thunder scores {integer(tokenCount)} tokens on 25 named variables, including protocol revenue, supply inflation, token release schedule, circulating to fully diluted ratio, holder concentration and competitive moat. That research file is dated {dateLabel}. Joining it to today prices on ticker symbol splits the index into two halves at the median score, and the two halves can then be compared against the same Bitcoin benchmark over the same window.
        </p>
        <p>
          {widest === null
            ? `On this build no depth produced ${MIN_SPLIT_HALF} matched tokens per half, so no split is reported. A share computed over a dozen tokens moves eight points on one row and would be a decorative number rather than a finding.`
            : widest.aboveMedian && widest.belowMedian
              ? `At the top ${widest.depth}, ${integer(widest.matched)} assets matched a scored token. The higher scoring half reads ${formatIndexValue(widest.aboveMedian.value)} and the lower scoring half reads ${formatIndexValue(widest.belowMedian.value)}, both against the same Bitcoin move of ${formatSignedPercent(widest.aboveMedian.bitcoinChange)}. Whichever half is higher, that is the half doing the work behind the headline number.`
              : `At the top ${widest.depth} the join produced ${integer(widest.matched)} matched assets but no reportable pair of halves.`}
        </p>
        <p>
          Two limits on this split, stated plainly. The scores are a dated snapshot and the prices are live, so this is research from {dateLabel} tested against a later market, never a live score. And the join runs on ticker symbol, which is the weakest identifier in this asset class, so a renamed or reused ticker will fail to match and simply drop out of both halves rather than land in the wrong one. The matched count in the table is the honest measure of how much of the slice the split actually covers. The full scoring method sits on the <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link>, and the per token detail sits on the <Link className="text-amber hover:text-accent-hover" href="/scorecard">scorecard</Link>.
        </p>
      </div>
      <SplitTable splits={splits} />
    </section>
  );
}

function Limits() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Where this metric breaks</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          It measures breadth against one benchmark over one lookback, and that is the whole of it. It is not a forecast. A high reading says a lot of assets have already outperformed, which is a description of the recent past and carries no claim about the next month.
        </p>
        <p>
          Survivorship is baked in. The top 50 is recomputed from today ranks, so an asset that collapsed out of the top 50 during the lookback is simply absent from the count, while an asset that climbed into the top 50 on the strength of that same move is present and counted as a win. The measured population is selected partly on the outcome being measured, and no version of this index avoids that, including the original.
        </p>
        <p>
          Equal weighting is a second choice with consequences. A hundred billion dollar asset and a two billion dollar asset each contribute one vote, so a reading can be high while the market capitalisation weighted move is flat. The depth ladder is the partial answer here, since comparing the top 10 with the top 200 exposes where the votes are coming from.
        </p>
        <p>
          Missing data is excluded rather than assumed. An asset with no percentage change for the selected window is dropped from the numerator and from the denominator, and the count of those drops is printed next to every figure. Below {MIN_COMPARABLE} comparable assets this page prints no index at all, because a share of eight moves twelve points on a single row.
        </p>
        <p>
          The reading also changes with the fetch. This page holds one dated snapshot taken at build time, so the number here is already older than the market by the time it is read. For trade level math the <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link> is the tool, and the current research shortlist sits on the <Link className="text-amber hover:text-accent-hover" href="/opportunities">opportunities page</Link>.
        </p>
      </div>
    </section>
  );
}

function SourcesSection({ universe, scorecardDate, embedded }: {
  readonly universe: MarketUniverse;
  readonly scorecardDate: string | null;
  readonly embedded: number;
}) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="snapshot-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span>
          <h2 id="snapshot-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Market build snapshot</h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">Fetched <time dateTime={universe.fetchedAt}>{universe.fetchedAt}</time></p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        One fetch produced every figure on this page. The browser recomputes from the same embedded snapshot and makes no market data request of its own.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotValue label="Universe rows kept" value={integer(universe.rows.length)} />
        <SnapshotValue label="Stablecoins excluded" value={integer(universe.stablecoinCount)} />
        <SnapshotValue label="Rows embedded in the page" value={integer(embedded)} />
        <SnapshotValue label="Rows cross checked" value={integer(universe.crossCheckedCount)} />
        <SnapshotValue label="Worst price spread" value={`${universe.worstPriceSpreadPercent.toFixed(3)}%`} />
        <SnapshotValue label="Research file dated" value={scorecardDate === null ? "not available" : scorecardDate.slice(0, 10)} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Endpoints used</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          CoinGecko supplied ranks, stablecoin flags and every percentage change window. CoinPaprika supplied a second price for each asset it also lists, and the worst disagreement between the two across the cross checked rows is shown above. The fundamental scores come from the Early Thunder research file in this repository, which is dated and versioned rather than fetched.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          {Object.entries(UNIVERSE_ENDPOINTS).map(([provider, href]) => (
            <li key={provider}><a className="text-amber hover:text-accent-hover" href={href}>{provider}<span aria-hidden="true"> ↗</span></a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SnapshotValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words font-mono text-xl font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

function AuthorAndDisclosures() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Built and checked by Michael Lip</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the Early Thunder research engine end to end. He built this version of the season index because the published ones report one window at one depth and none of them says which half of the market is behind the number. <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.
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

export default async function AltcoinSeasonIndexPage() {
  const universe = await getMarketUniverse();
  const scores = readScorecardScores(scorecardFile);
  const scorecardDate = readScorecardDate(scorecardFile);
  const rows = embeddedRows(universe);
  const bitcoin: SeasonRow = {
    id: universe.bitcoin.id, symbol: universe.bitcoin.symbol, name: universe.bitcoin.name,
    rank: universe.bitcoin.rank, change24h: universe.bitcoin.change24h, change7d: universe.bitcoin.change7d,
    change30d: universe.bitcoin.change30d, change200d: universe.bitcoin.change200d,
    change1y: universe.bitcoin.change1y, isStablecoin: false,
  };
  const headline = computeSeasonIndex(rows, bitcoin, DEFAULT_WINDOW, DEFAULT_DEPTH);
  const windowRows = SEASON_WINDOWS.map((option) => ({
    label: windowLabel(option),
    index: computeSeasonIndex(rows, bitcoin, option, DEFAULT_DEPTH),
  }));
  const depthPoints = buildDepthCurve(rows, bitcoin, DEFAULT_WINDOW, SEASON_DEPTHS);
  const splits = SPLIT_DEPTHS.map((depth) => computeFundamentalsSplit(rows, bitcoin, DEFAULT_WINDOW, depth, scores));
  const snapshot: SeasonSnapshot = {
    fetchedAt: universe.fetchedAt,
    scorecardUpdatedAt: scorecardDate,
    bitcoin,
    rows,
    scores: rows
      .map((row) => [row.symbol, scores.get(row.symbol)] as const)
      .filter((pair): pair is readonly [string, number] => typeof pair[1] === "number"),
  };
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(universe.fetchedAt).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Altcoin season index</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Market breadth against Bitcoin
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">Altcoin season index</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          How many of the largest non stablecoin assets are beating Bitcoin right now, computed here across five lookback windows and five depths instead of one of each.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          The reading below is recomputed in your browser from a snapshot fetched at build time. Set the window, set the depth, and the index, the breadth curve and the contributing assets all move with it.
        </p>
      </header>
      <AltcoinSeasonIndex snapshot={snapshot} />
      <Definition headline={headline} />
      <WindowSection rows={windowRows} />
      <DepthSection points={depthPoints} />
      <SplitSection splits={splits} scorecardDate={scorecardDate} tokenCount={scores.size} />
      <Limits />
      <SourcesSection universe={universe} scorecardDate={scorecardDate} embedded={rows.length} />
      <AuthorAndDisclosures />
    </div>
  );
}
