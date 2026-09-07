import type { Metadata } from "next";
import Link from "next/link";
import ImpermanentLossCalculator, { type IlToken } from "@/components/ImpermanentLossCalculator";
import JsonLd from "@/components/JsonLd";
import {
  IL_WINDOWS,
  WINDOW_DAYS,
  WINDOW_LABELS,
  feeBreakEvenDays,
  feeYieldOverDays,
  impermanentLossFromChanges,
  type IlWindow,
} from "@/lib/impermanent-loss";
import { UNIVERSE_ENDPOINTS, getMarketUniverse, type MarketUniverse, type UniverseRow } from "@/lib/market-universe";
import { YIELD_ENDPOINT, getYieldSnapshot, type YieldSnapshot, type YieldRow } from "@/lib/staking-yields";

const PAGE_URL = "https://earlythunder.com/impermanent-loss-calculator";
const PAGE_TITLE = "Impermanent Loss Calculator on Real Price Moves";
const PAGE_DESCRIPTION = "Impermanent loss measured from real 24h, 7d, 30d, 200d and 1y token moves, with the pool APY needed to break even. Dated build snapshot included.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const DEFAULT_WINDOW: IlWindow = "30d";
const FEATURED_VOLATILE_COUNT = 5;
const RANKED_TOKEN_COUNT = 40;
const MAX_PAIRS = 2_000;
const TOP_LIST_SIZE = 10;
const POOL_LIST_SIZE = 12;
const CLIENT_TOKEN_COUNT = 80;
const MAX_UNIVERSE_ROWS = 400;
const MAX_POOL_ROWS = 4_000;

interface PairLoss {
  readonly symbolA: string;
  readonly symbolB: string;
  readonly changeA: number;
  readonly changeB: number;
  readonly loss: number;
}

interface WindowCell {
  readonly window: IlWindow;
  readonly loss: number | null;
}

interface FeaturedPair {
  readonly symbolA: string;
  readonly symbolB: string;
  readonly cells: readonly WindowCell[];
}

interface RankedSet {
  readonly worst: readonly PairLoss[];
  readonly best: readonly PairLoss[];
  readonly considered: number;
  readonly measured: number;
  readonly excluded: number;
}

interface PoolLine {
  readonly key: string;
  readonly project: string;
  readonly chain: string;
  readonly symbol: string;
  readonly tvlUsd: number;
  readonly apy: number;
  readonly loss: number;
  readonly feeYield: number;
  readonly netFraction: number;
  readonly breakEvenDays: number | null;
}

interface PoolSet {
  readonly lines: readonly PoolLine[];
  readonly ilRiskPools: number;
  readonly matched: number;
  readonly excludedShape: number;
  readonly excludedSymbol: number;
  readonly excludedChange: number;
}

function changeAt(row: UniverseRow, window: IlWindow): number | null {
  if (window === "24h") return row.change24h;
  if (window === "7d") return row.change7d;
  if (window === "30d") return row.change30d;
  if (window === "200d") return row.change200d;
  return row.change1y;
}

function byMarketCap(rows: readonly UniverseRow[]): readonly UniverseRow[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new RangeError("Universe returned no rows.");
  if (rows.length > MAX_UNIVERSE_ROWS) throw new RangeError("Universe returned more rows than expected.");
  return [...rows].sort((left, right) => right.marketCap - left.marketCap);
}

/** Top volatile tokens by market cap plus the single largest stablecoin. */
function featuredMembers(sorted: readonly UniverseRow[]): readonly UniverseRow[] {
  const volatile: UniverseRow[] = [];
  for (const row of sorted) {
    if (volatile.length >= FEATURED_VOLATILE_COUNT) break;
    if (row.isStablecoin === false) volatile.push(row);
  }
  const stable = sorted.find((row) => row.isStablecoin === true) ?? null;
  if (volatile.length < 2) throw new RangeError("Too few volatile tokens to build a featured pair set.");
  return stable === null ? volatile : [...volatile, stable];
}

function featuredPairs(members: readonly UniverseRow[]): readonly FeaturedPair[] {
  const pairs: FeaturedPair[] = [];
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      if (pairs.length >= MAX_PAIRS) break;
      const left = members[i];
      const right = members[j];
      const cells = IL_WINDOWS.map((window) => {
        const changeA = changeAt(left, window);
        const changeB = changeAt(right, window);
        const loss = changeA === null || changeB === null ? null : impermanentLossFromChanges(changeA, changeB);
        return { window, loss };
      });
      pairs.push({ symbolA: left.symbol, symbolB: right.symbol, cells });
    }
  }
  if (pairs.length === 0) throw new RangeError("Featured pair set is empty.");
  return pairs;
}

function excludedInWindow(pairs: readonly FeaturedPair[], window: IlWindow): number {
  let count = 0;
  for (const pair of pairs) {
    const cell = pair.cells.find((entry) => entry.window === window);
    if (cell === undefined || cell.loss === null) count += 1;
  }
  return count;
}

function rankedPairs(sorted: readonly UniverseRow[], window: IlWindow): RankedSet {
  const members: UniverseRow[] = [];
  for (const row of sorted) {
    if (members.length >= RANKED_TOKEN_COUNT) break;
    if (row.isStablecoin === false) members.push(row);
  }
  if (members.length < 2) throw new RangeError("Ranked pair set needs at least two tokens.");
  const measured: PairLoss[] = [];
  let considered = 0;
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      if (considered >= MAX_PAIRS) break;
      considered += 1;
      const left = members[i];
      const right = members[j];
      const changeA = changeAt(left, window);
      const changeB = changeAt(right, window);
      if (changeA === null || changeB === null) continue;
      const loss = impermanentLossFromChanges(changeA, changeB);
      if (loss === null) continue;
      measured.push({ symbolA: left.symbol, symbolB: right.symbol, changeA, changeB, loss });
    }
  }
  if (measured.length === 0) throw new RangeError("No measurable pair in the ranked set.");
  const ascending = [...measured].sort((left, right) => left.loss - right.loss);
  return {
    worst: ascending.slice(0, TOP_LIST_SIZE),
    best: ascending.slice(-TOP_LIST_SIZE).reverse(),
    considered,
    measured: measured.length,
    excluded: considered - measured.length,
  };
}

function symbolIndex(rows: readonly UniverseRow[]): ReadonlyMap<string, UniverseRow> {
  const index = new Map<string, UniverseRow>();
  for (const row of rows) {
    if (index.size >= MAX_UNIVERSE_ROWS) break;
    if (index.has(row.symbol) === false) index.set(row.symbol, row);
  }
  if (index.size === 0) throw new RangeError("Universe symbol index is empty.");
  return index;
}

function poolLegs(symbol: string): readonly string[] | null {
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 80) return null;
  const legs = symbol.toUpperCase().split(/[-/]/).map((leg) => leg.trim()).filter((leg) => leg.length > 0);
  return legs.length === 2 ? legs : null;
}

function poolSet(yields: YieldSnapshot, index: ReadonlyMap<string, UniverseRow>, window: IlWindow): PoolSet {
  if (!Array.isArray(yields.rows)) throw new TypeError("Yield snapshot must carry a rows array.");
  if (yields.rows.length > MAX_POOL_ROWS) throw new RangeError("Yield snapshot returned more rows than expected.");
  const days = WINDOW_DAYS[window];
  const lines: PoolLine[] = [];
  let ilRiskPools = 0;
  let excludedShape = 0;
  let excludedSymbol = 0;
  let excludedChange = 0;
  for (const row of yields.rows) {
    if (row.ilRisk !== "yes") continue;
    ilRiskPools += 1;
    const legs = poolLegs(row.symbol);
    if (legs === null) { excludedShape += 1; continue; }
    const left = index.get(legs[0]) ?? null;
    const right = index.get(legs[1]) ?? null;
    if (left === null || right === null) { excludedSymbol += 1; continue; }
    const changeA = changeAt(left, window);
    const changeB = changeAt(right, window);
    if (changeA === null || changeB === null) { excludedChange += 1; continue; }
    const loss = impermanentLossFromChanges(changeA, changeB);
    const feeYield = feeYieldOverDays(row.apy, days);
    if (loss === null || feeYield === null) { excludedChange += 1; continue; }
    lines.push(buildPoolLine(row, loss, feeYield));
  }
  const matched = lines.length;
  lines.sort((left, right) => right.tvlUsd - left.tvlUsd);
  return {
    lines: lines.slice(0, POOL_LIST_SIZE),
    ilRiskPools,
    matched,
    excludedShape,
    excludedSymbol,
    excludedChange,
  };
}

function buildPoolLine(row: YieldRow, loss: number, feeYield: number): PoolLine {
  if (!Number.isFinite(loss) || !Number.isFinite(feeYield)) throw new RangeError("Pool line requires finite inputs.");
  if (loss > 0) throw new RangeError("Impermanent loss must be zero or negative.");
  return {
    key: row.pool,
    project: row.project,
    chain: row.chain,
    symbol: row.symbol,
    tvlUsd: row.tvlUsd,
    apy: row.apy,
    loss,
    feeYield,
    netFraction: feeYield + loss,
    breakEvenDays: feeBreakEvenDays(loss, row.apy),
  };
}

function clientTokens(sorted: readonly UniverseRow[]): readonly IlToken[] {
  const tokens: IlToken[] = [];
  for (const row of sorted) {
    if (tokens.length >= CLIENT_TOKEN_COUNT) break;
    tokens.push({
      symbol: row.symbol,
      name: row.name,
      isStablecoin: row.isStablecoin,
      change24h: row.change24h,
      change7d: row.change7d,
      change30d: row.change30d,
      change200d: row.change200d,
      change1y: row.change1y,
    });
  }
  if (tokens.length < 2) throw new RangeError("Client snapshot needs at least two tokens.");
  return tokens;
}

/**
 * Opens the calculator on the legs of the largest matched pool, so the default
 * reading is the biggest real position on the page rather than an arbitrary
 * pick. Falls back to the largest volatile asset against the largest
 * stablecoin, then to the first two tokens in the snapshot.
 */
function defaultPair(tokens: readonly IlToken[], pools: PoolSet): readonly [string, string] {
  if (tokens.length < 2) throw new RangeError("A default pair needs at least two tokens.");
  const held = (symbol: string): boolean => tokens.some((token) => token.symbol === symbol);
  const largest = pools.lines.length > 0 ? poolLegs(pools.lines[0].symbol) : null;
  if (largest !== null && held(largest[0]) && held(largest[1]) && largest[0] !== largest[1]) {
    return [largest[0], largest[1]];
  }
  const volatile = tokens.find((token) => token.isStablecoin === false) ?? null;
  const stable = tokens.find((token) => token.isStablecoin === true) ?? null;
  if (volatile !== null && stable !== null) return [volatile.symbol, stable.symbol];
  return [tokens[0].symbol, tokens[1].symbol];
}

function money(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits }).format(value);
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/**
 * Renders a loss or yield fraction as a percentage. Short windows produce very
 * small divergences, so the precision widens rather than rounding a real
 * measurement away to zero.
 */
function lossText(fraction: number | null): string {
  if (fraction === null) return "Not available";
  const percent = fraction * 100;
  if (!Number.isFinite(percent)) return "Not available";
  const magnitude = Math.abs(percent);
  const digits = magnitude >= 0.01 ? 3 : magnitude >= 0.001 ? 4 : 5;
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(percent)}%`;
}

function percentText(value: number, digits = 2): string {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;
}

function daysText(days: number | null): string {
  if (days === null) return "Never at this APY";
  if (days < 1) return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(days)} days`;
  return `${integer(days)} days`;
}

function schemas(universe: MarketUniverse): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: PAGE_TITLE,
      url: PAGE_URL, description: PAGE_DESCRIPTION, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Impermanent loss from measured token price moves",
        "Constant product loss from a manual price ratio",
        "LP value against hold value in percent and dollars",
        "Fee break even holding period against real pool APY",
      ],
      author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION, url: PAGE_URL, mainEntityOfPage: PAGE_URL,
      datePublished: "2026-09-07", dateModified: universe.fetchedAt, author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Impermanent loss calculator", item: PAGE_URL },
      ],
    },
  ];
}

function SectionHeading({ id, kicker, title }: { readonly id: string; readonly kicker?: string; readonly title: string }) {
  return (
    <div>
      {kicker && <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">{kicker}</span>}
      <h2 id={id} className={`${kicker ? "mt-2 " : ""}text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]`}>{title}</h2>
    </div>
  );
}

function lossClass(loss: number | null): string {
  if (loss === null) return "text-text-tertiary";
  return loss < 0 ? "text-negative" : "text-text-primary";
}

function FeaturedTable({ pairs }: { readonly pairs: readonly FeaturedPair[] }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left text-xs sm:text-sm">
        <caption className="sr-only">Impermanent loss for the largest real pairs over every window the snapshot serves</caption>
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Pair</th>
            {IL_WINDOWS.map((window) => <th key={window} scope="col" className="px-2 py-3 font-medium sm:px-3">{WINDOW_LABELS[window]}</th>)}
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => (
            <tr key={`${pair.symbolA}-${pair.symbolB}`} className="border-b border-border-subtle last:border-0">
              <th scope="row" className="px-2 py-3 text-left font-mono font-normal text-text-primary sm:px-3">{pair.symbolA} and {pair.symbolB}</th>
              {pair.cells.map((cell) => (
                <td key={cell.window} className={`px-2 py-3 font-mono sm:px-3 ${lossClass(cell.loss)}`}>{lossText(cell.loss)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoolTable({ set, window }: { readonly set: PoolSet; readonly window: IlWindow }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-left text-xs sm:text-sm">
        <caption className="sr-only">Real pools flagged for impermanent loss risk, with the fee break even holding period</caption>
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Pool</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">TVL</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">APY</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Loss over {WINDOW_LABELS[window]}</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Fees over {WINDOW_LABELS[window]}</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Net</th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-3">Break even</th>
          </tr>
        </thead>
        <tbody>
          {set.lines.map((line) => (
            <tr key={line.key} className="border-b border-border-subtle last:border-0">
              <th scope="row" className="px-2 py-3 text-left font-normal text-text-primary sm:px-3">
                <span className="block font-mono">{line.symbol}</span>
                <span className="block text-text-tertiary">{line.project} on {line.chain}</span>
              </th>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{money(line.tvlUsd, 0)}</td>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{percentText(line.apy)}</td>
              <td className="px-2 py-3 font-mono text-negative sm:px-3">{lossText(line.loss)}</td>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{lossText(line.feeYield)}</td>
              <td className={`px-2 py-3 font-mono sm:px-3 ${line.netFraction >= 0 ? "text-positive" : "text-negative"}`}>{lossText(line.netFraction)}</td>
              <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{daysText(line.breakEvenDays)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankedTable({ heading, rows }: { readonly heading: string; readonly rows: readonly PairLoss[] }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">{heading}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Pair</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Moves</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Loss</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.symbolA}-${row.symbolB}`} className="border-b border-border-subtle last:border-0">
                <th scope="row" className="px-2 py-3 text-left font-mono font-normal text-text-primary sm:px-3">{row.symbolA} and {row.symbolB}</th>
                <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{percentText(row.changeA, 1)} and {percentText(row.changeB, 1)}</td>
                <td className="px-2 py-3 font-mono text-negative sm:px-3">{lossText(row.loss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

function Formula({ text }: { readonly text: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{text}</div>;
}

export default async function ImpermanentLossCalculatorPage() {
  const [universe, yields] = await Promise.all([getMarketUniverse(), getYieldSnapshot()]);
  const sorted = byMarketCap(universe.rows);
  const members = featuredMembers(sorted);
  const pairs = featuredPairs(members);
  const ranked = rankedPairs(sorted, DEFAULT_WINDOW);
  const pools = poolSet(yields, symbolIndex(sorted), DEFAULT_WINDOW);
  const tokens = clientTokens(sorted);
  const excludedByWindow = IL_WINDOWS.map((window) => ({ window, excluded: excludedInWindow(pairs, window) }));
  const coveredPools = pools.lines.filter((line) => line.netFraction >= 0).length;
  const [defaultA, defaultB] = defaultPair(tokens, pools);

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(universe).map((schema, index) => <JsonLd key={index} data={schema} />)}

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Impermanent loss calculator</span>
      </nav>

      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Measured, not hypothetical
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">
          Impermanent loss calculator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Most impermanent loss tools ask you to invent a price change. This one starts from the moves that already happened, across five windows, for {integer(universe.rows.length)} tokens fetched at build time.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          Pick two real assets and a window to see what a constant product position would have given up against simply holding. The manual mode is still there if you want to test a ratio you choose yourself.
        </p>
      </header>

      <ImpermanentLossCalculator
        tokens={tokens}
        fetchedAt={universe.fetchedAt}
        defaultSymbolA={defaultA}
        defaultSymbolB={defaultB}
        defaultWindow={DEFAULT_WINDOW}
      />

      <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="featured-heading">
        <SectionHeading id="featured-heading" kicker="Real moves, five windows" title="What the largest pairs actually cost" />
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            The table pairs the {FEATURED_VOLATILE_COUNT} largest non stablecoin assets by market capitalisation with each other and with the largest stablecoin. Each cell is the constant product loss implied by the two real percentage moves over that window, so nothing on this page depends on a price change anyone made up.
          </p>
          <p>
            Read the numbers as the gap between an equal weight liquidity position and the same two balances left alone. A pair that moved together shows a loss near zero even when both assets fell hard, because impermanent loss measures divergence rather than direction. A stablecoin paired with a volatile asset shows the full effect of a one sided move.
          </p>
        </div>
        <FeaturedTable pairs={pairs} />
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          Pairs measured {pairs.length}. Excluded per window because one side carries no change in this snapshot,{" "}
          {excludedByWindow.map((entry, index) => (
            <span key={entry.window}>
              {index > 0 ? ", " : ""}{WINDOW_LABELS[entry.window]} {entry.excluded}
            </span>
          ))}
          . An excluded pair is stated rather than quietly dropped.
        </p>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="fees-heading">
        <SectionHeading id="fees-heading" kicker="The other half of the decision" title="Whether the fees covered the divergence" />
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            Impermanent loss on its own does not decide anything. A pool that gave up two percent to divergence while paying twenty percent a year in fees was still ahead. The build pulled the DeFiLlama pool snapshot, kept the pools it flags with impermanent loss risk, and matched both legs of each pool to a token in the market universe.
          </p>
          <p>
            For every matched pool the table shows the reported APY, the measured loss over the last {WINDOW_LABELS[DEFAULT_WINDOW]}, the fee yield the same APY would have produced over that period, the net of the two, and the break even holding period. Break even is the number of days of fee accrual at that APY needed to offset the measured loss. It assumes the APY holds, that fees accrue evenly with no compounding, and that the divergence stops where it is.
          </p>
        </div>
        <PoolTable set={pools} window={DEFAULT_WINDOW} />
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          The snapshot kept {integer(yields.keptPools)} pools above the two million dollar TVL floor out of {integer(yields.totalPools)} returned. Of those, {integer(pools.ilRiskPools)} carry an impermanent loss risk flag and {integer(pools.matched)} matched two tokens in the universe. Excluded, {integer(pools.excludedShape)} whose symbol does not resolve to exactly two legs, {integer(pools.excludedSymbol)} where at least one leg is not in the universe, and {integer(pools.excludedChange)} where a leg carries no {WINDOW_LABELS[DEFAULT_WINDOW]} change. The {pools.lines.length} largest matched pools by TVL are shown, and {coveredPools} of them earned more in fees than the window cost in divergence.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Matching is by exact ticker. Wrapped, staked and bridged variants carry their own tickers and are not treated as the underlying asset, which is why large pools quoted in wrapped assets fall into the excluded count instead of borrowing a price they do not have.
        </p>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="ranked-heading">
        <SectionHeading id="ranked-heading" kicker={`Every pair in the top ${RANKED_TOKEN_COUNT}`} title="The widest and the narrowest real pairs" />
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            The build took the {RANKED_TOKEN_COUNT} largest non stablecoin tokens by market capitalisation and measured every distinct pair over the last {WINDOW_LABELS[DEFAULT_WINDOW]}. It considered {integer(ranked.considered)} pairs, measured {integer(ranked.measured)} of them, and excluded {integer(ranked.excluded)} because one side carries no change for that window. Flagged stablecoins are left out of this set on purpose, since a pair of two of them sits at zero by construction and would fill the narrowest list without saying anything.
          </p>
          <p>
            The widest list is where two assets pulled apart hardest, and it is usually one asset running while the other sat still. The narrowest list is where two assets moved by almost the same percentage over the same month, so an equal weight liquidity position ended up worth close to what holding would have been worth. That is the structural argument for pairing assets that move together, and the numbers put a size on it rather than leaving it as a claim.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RankedTable heading={`Widest divergence over ${WINDOW_LABELS[DEFAULT_WINDOW]}`} rows={ranked.worst} />
          <RankedTable heading={`Narrowest divergence over ${WINDOW_LABELS[DEFAULT_WINDOW]}`} rows={ranked.best} />
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <SectionHeading id="math-heading" title="How the math works" />
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          A constant product pool holds two assets whose quantities multiply to a constant. When an outside price moves, arbitrage traders rebalance the pool, which leaves the position holding more of the asset that fell and less of the asset that rose. The formula below compares the value of that rebalanced position against the value of the two starting balances left untouched.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Formula text="a = 1 + change of asset A ÷ 100" />
          <Formula text="b = 1 + change of asset B ÷ 100" />
          <Formula text="r = a ÷ b" />
          <Formula text="IL = 2 × √r ÷ (1 + r) − 1" />
          <Formula text="Hold value = V × (a + b) ÷ 2" />
          <Formula text="LP value = V × √(a × b)" />
          <Formula text="Fee yield = APY ÷ 100 × days ÷ 365" />
          <Formula text="Break even days = loss ÷ (APY ÷ 100 ÷ 365)" />
        </div>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          Impermanent loss is always zero or negative and it depends only on the ratio r, never on the absolute prices. A ratio of 1 gives zero. A ratio of 2 gives about minus 5.7 percent. A ratio of 4 gives minus 20 percent. The curve is symmetric, so a fourfold rise and a fourfold fall in the same asset produce the same figure. A change of exactly minus 100 percent drives a price factor to zero and leaves no ratio at all, so this calculator returns no result there rather than an infinity.
        </p>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <SectionHeading id="limits-heading" title="Where this model breaks" />
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            The formula describes a constant product two asset pool with equal starting weights. It does not describe concentrated liquidity. Inside a chosen range the loss is larger than this figure because the same capital backs a narrower slice of the curve, and once price leaves the range the position sits entirely in one asset and stops earning fees until price returns. Weighted pools that start at something other than fifty fifty follow a different curve as well.
          </p>
          <p>
            The figure ignores trading fees unless they are added explicitly, which is what the pool section does. It ignores gas, both to enter and to exit, and it ignores reward emissions, which can dominate a headline APY and can stop without notice. It says nothing about the credit risk of the pool contract or the bridge that issued either token.
          </p>
          <p>
            The loss is only realised on withdrawal, which is why it is called impermanent. A position whose price ratio returns to where it started carries no loss at all. The numbers here are a snapshot of a ratio at one moment, not a settled outcome.
          </p>
          <p>
            Reported APY is the pool operator figure as DeFiLlama recorded it, and a headline APY on a small or new pool is often a short lived reading. Read it next to the TVL in the same row. Our{" "}
            <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link>{" "}
            covers how the research engine treats reported yields, and the{" "}
            <Link className="text-amber hover:text-accent-hover" href="/scorecard">token scorecard</Link>{" "}
            covers the fundamentals of the assets that sit inside these pairs. If you want entry and exit fee math on a spot position instead, the{" "}
            <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link>{" "}
            handles that case.
          </p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="snapshot-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="snapshot-heading" kicker="Dated source check" title="Build snapshot" />
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            Universe fetched <time dateTime={universe.fetchedAt}>{universe.fetchedAt}</time>
          </p>
        </div>
        <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          The build fetched and checked these values before writing the static page. The browser calculator reads the embedded snapshot and makes no market data request.
        </p>
        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotValue label="Universe rows" value={integer(universe.rows.length)} />
          <SnapshotValue label="Rows dropped in validation" value={integer(universe.droppedRows)} />
          <SnapshotValue label="Flagged stablecoins" value={integer(universe.stablecoinCount)} />
          <SnapshotValue label="Cross checked prices" value={integer(universe.crossCheckedCount)} />
          <SnapshotValue label="Worst price spread" value={percentText(universe.worstPriceSpreadPercent, 3)} />
          <SnapshotValue label="Tokens in the browser snapshot" value={integer(tokens.length)} />
          <SnapshotValue label="Pools returned" value={integer(yields.totalPools)} />
          <SnapshotValue label="Pools above the TVL floor" value={integer(yields.keptPools)} />
          <SnapshotValue label="Pools matched to two tokens" value={integer(pools.matched)} />
        </dl>
        <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
          <h3 className="text-lg font-semibold text-text-primary">Endpoints used</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Market rows and price changes come from CoinGecko, cross checked against CoinPaprika. Pool APY, TVL and the impermanent loss risk flag come from DeFiLlama. The windows available on the CoinGecko markets endpoint are 24h, 7d, 30d, 200d and 1y, so no 90 day figure appears anywhere on this page.
          </p>
          <p className="mt-3 font-mono text-xs leading-relaxed text-text-secondary">
            Pool snapshot fetched <time dateTime={yields.fetchedAt}>{yields.fetchedAt}</time>
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
            {Object.entries(UNIVERSE_ENDPOINTS).map(([provider, href]) => (
              <li key={provider}><a className="text-amber hover:text-accent-hover" href={href}>{provider}<span aria-hidden="true"> ↗</span></a></li>
            ))}
            <li><a className="text-amber hover:text-accent-hover" href={YIELD_ENDPOINT}>DeFiLlama pools<span aria-hidden="true"> ↗</span></a></li>
          </ul>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Built and checked by Michael Lip</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the Early Thunder research engine end to end. He wrote this calculator because every ranked impermanent loss tool asks the reader to guess a price change, while the real moves were already sitting in the data.{" "}
          <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.
        </p>
      </section>

      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold text-text-primary">Site-wide disclosures</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-text-secondary">
          <li>Research and data analysis only. Nothing here is investment advice or a recommendation to buy or sell any asset.</li>
          <li>Crypto assets are volatile and you can lose the entire amount you put in.</li>
          <li>Impermanent loss is a comparison against holding. It is not a fee, a tax figure or a settled result, and it only becomes real on withdrawal.</li>
          <li>Every figure carries the timestamp it was fetched. Prices move continuously and the number on the page may already be out of date.</li>
          <li>The operator may hold positions in assets covered on this site. See the <Link className="text-amber hover:text-accent-hover" href="/portfolio">portfolio page</Link>.</li>
        </ul>
      </section>
    </div>
  );
}
