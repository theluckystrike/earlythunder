import type { Metadata } from "next";
import Link from "next/link";
import CompoundInterestCalculator, {
  type AssetOption,
  type CompoundSnapshot,
  type PoolOption,
} from "@/components/CompoundInterestCalculator";
import JsonLd from "@/components/JsonLd";
import { yieldCancellingPriceChange } from "@/lib/compound-math";
import { getMarketUniverse, UNIVERSE_ENDPOINTS, type MarketUniverse, type UniverseRow } from "@/lib/market-universe";
import { getYieldSnapshot, YIELD_ENDPOINT, type YieldSnapshot, type YieldRow } from "@/lib/staking-yields";

const PAGE_URL = "https://earlythunder.com/crypto-compound-interest-calculator";
const PAGE_TITLE = "Crypto Compound Interest Calculator";
const PAGE_DESCRIPTION = "Compound a staking balance in tokens, then price it. Live pool rates, a break even price change, and measured 1 year moves beside the projection.";

const MAX_POOL_OPTIONS = 10;
const MAX_ASSET_OPTIONS = 24;
const MAX_MATCHED_ASSETS = 10;
const MAX_PRICED_POOL_OPTIONS = 4;
const MIN_DISPLAY_APY = 1;
const REWARD_SHARE_THRESHOLD = 0.5;
const SPIKE_THRESHOLD = 1.25;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

function schemas(modified: string): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: PAGE_TITLE,
      url: PAGE_URL, description: PAGE_DESCRIPTION, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Token balance and dollar value calculated as separate legs",
        "Rates prefilled from live staking pools",
        "Break even annual price change",
        "Base rate and reward rate split",
        "Measured 24 hour to 1 year price change beside the projection",
      ],
      author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION, url: PAGE_URL, mainEntityOfPage: PAGE_URL,
      datePublished: "2026-09-07", dateModified: modified, author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto compound interest calculator", item: PAGE_URL },
      ],
    },
  ];
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function decimals(value: number, digits: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function signed(value: number, digits: number): string {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: "exceptZero" }).format(value)}%`;
}

function billions(value: number): string {
  if (!Number.isFinite(value)) return "not available";
  if (value >= 1e9) return `${decimals(value / 1e9, 2)} billion dollars`;
  return `${integer(value / 1e6)} million dollars`;
}

/**
 * Pools offered as a prefill. The largest by value locked come first, then up
 * to a few more that carry a price in the market universe, so a reader can see
 * both legs of the same asset without leaving the page.
 */
function poolOptions(snapshot: YieldSnapshot, priced: ReadonlySet<string>): readonly PoolOption[] {
  const primary: PoolOption[] = [];
  const extra: PoolOption[] = [];
  const taken = new Set<string>();
  for (const row of snapshot.rows) {
    if (primary.length >= MAX_POOL_OPTIONS && extra.length >= MAX_PRICED_POOL_OPTIONS) break;
    if (row.apy < MIN_DISPLAY_APY) continue;
    const option: PoolOption = {
      key: row.pool,
      symbol: row.symbol.toUpperCase(),
      project: row.project,
      chain: row.chain,
      tvlUsd: row.tvlUsd,
      apy: row.apy,
      apyBase: row.apyBase,
      apyReward: row.apyReward,
      apyMean30d: row.apyMean30d,
      stablecoin: row.stablecoin,
    };
    if (primary.length < MAX_POOL_OPTIONS) {
      taken.add(option.key);
      primary.push(option);
      continue;
    }
    if (taken.has(option.key) || !priced.has(option.symbol)) continue;
    taken.add(option.key);
    extra.push(option);
  }
  return [...primary, ...extra];
}

/** The pool the form opens on, preferring one whose asset also carries a price. */
function defaultPoolKey(pools: readonly PoolOption[], priced: ReadonlySet<string>): string | null {
  for (const pool of pools) {
    if (!pool.stablecoin && priced.has(pool.symbol)) return pool.key;
  }
  for (const pool of pools) {
    if (priced.has(pool.symbol)) return pool.key;
  }
  const first = pools[0];
  return first === undefined ? null : first.key;
}

function toAsset(row: UniverseRow): AssetOption {
  return {
    symbol: row.symbol,
    name: row.name,
    priceUsd: row.price,
    change24h: row.change24h,
    change7d: row.change7d,
    change30d: row.change30d,
    change200d: row.change200d,
    change1y: row.change1y,
  };
}

/** Assets the reader can price the position in, with every pool asset that has a row included. */
function assetOptions(universe: MarketUniverse, pools: readonly PoolOption[]): readonly AssetOption[] {
  const wanted = new Set<string>();
  for (const pool of pools) wanted.add(pool.symbol);
  const chosen: AssetOption[] = [];
  const seen = new Set<string>();
  for (const row of universe.rows) {
    if (chosen.length >= MAX_MATCHED_ASSETS) break;
    if (seen.has(row.symbol) || !wanted.has(row.symbol)) continue;
    seen.add(row.symbol);
    chosen.push(toAsset(row));
  }
  for (const row of universe.rows) {
    if (chosen.length >= MAX_ASSET_OPTIONS) break;
    if (seen.has(row.symbol) || row.isStablecoin) continue;
    seen.add(row.symbol);
    chosen.push(toAsset(row));
  }
  if (chosen.length === 0) return [toAsset(universe.bitcoin)];
  return [...chosen].sort((left, right) => left.symbol.localeCompare(right.symbol));
}

/** Symbols in the universe that carry a usable price for the dollar leg. */
function pricedSymbols(universe: MarketUniverse): ReadonlySet<string> {
  const symbols = new Set<string>();
  for (const row of universe.rows) {
    if (row.price > 0) symbols.add(row.symbol);
  }
  return symbols;
}

interface RateFacts {
  readonly rewardHeavy: number;
  readonly withReward: number;
  readonly aboveMean: number;
  readonly withMean: number;
  readonly noMean: number;
  readonly largest: YieldRow;
}

function rateFacts(snapshot: YieldSnapshot): RateFacts | null {
  if (snapshot.rows.length === 0) return null;
  let rewardHeavy = 0;
  let withReward = 0;
  let aboveMean = 0;
  let withMean = 0;
  let noMean = 0;
  for (const row of snapshot.rows) {
    if (row.apyReward !== null && row.apyReward > 0) {
      withReward += 1;
      if (row.apy > 0 && row.apyReward / row.apy > REWARD_SHARE_THRESHOLD) rewardHeavy += 1;
    }
    if (row.apyMean30d === null || row.apyMean30d <= 0) {
      noMean += 1;
      continue;
    }
    withMean += 1;
    if (row.apy > row.apyMean30d * SPIKE_THRESHOLD) aboveMean += 1;
  }
  const largest = snapshot.rows[0];
  if (largest === undefined) return null;
  return { rewardHeavy, withReward, aboveMean, withMean, noMean, largest };
}

interface WindowFacts {
  readonly tracked: number;
  readonly withYear: number;
  readonly negativeYear: number;
  readonly medianYear: number | null;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (upper === undefined) return null;
  if (sorted.length % 2 === 1) return upper;
  return lower === undefined ? upper : (lower + upper) / 2;
}

function windowFacts(universe: MarketUniverse): WindowFacts {
  let tracked = 0;
  let withYear = 0;
  let negativeYear = 0;
  const yearly: number[] = [];
  for (const row of universe.rows) {
    if (row.isStablecoin) continue;
    tracked += 1;
    if (row.change1y === null) continue;
    withYear += 1;
    yearly.push(row.change1y);
    if (row.change1y < 0) negativeYear += 1;
  }
  return { tracked, withYear, negativeYear, medianYear: median(yearly) };
}

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

function TwoLegs({ cancelRate, largest }: { readonly cancelRate: number | null; readonly largest: YieldRow }) {
  const cancelText = cancelRate === null
    ? "not available for this pool"
    : `${signed(cancelRate * 100, 2)} a year`;
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Two legs that do not move together</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A savings calculator has one moving part. You put in dollars, a rate is applied to dollars, and dollars come out.
          A staking position has two. The rate is paid in tokens and grows a token balance. The dollar value of that balance
          is the token count multiplied by a price that moves for reasons the rate knows nothing about. Most calculators that
          rank for this query were built for a deposit account and quietly treat the two as one thing.
        </p>
        <p>
          Separating them changes what the output means. The token leg is close to arithmetic. If a validator pays a rate and
          you restake what it pays, your balance rises by that rate and the only uncertainty is whether the rate holds. The
          dollar leg is an assumption you supply, and the calculator gives it no weight of evidence at all. It is your number,
          carried forward, not a forecast.
        </p>
        <p>
          The place where the two legs meet is a single figure that a dollar only calculator cannot show. For every rate there
          is an annual price decline that exactly cancels it, and past that point the dollar value falls while the token count
          rises. On the largest pool in this build snapshot, {largest.symbol.toUpperCase()} on {largest.project}, the rate is{" "}
          {decimals(largest.apy, 3)} percent and the price change that cancels it is {cancelText}. The cushion a rate buys is
          always about the size of the rate itself, and a single digit rate sits well inside the ordinary yearly movement of the
          assets it is paid in.
        </p>
        <p>
          The calculator above reports that crossover for whatever rate, term and contribution you enter. With a recurring
          contribution the break even shifts, because later tokens spend less time compounding, so the general form solves the
          whole plan rather than the rate alone.
        </p>
      </div>
    </section>
  );
}

function MathSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">How the math works</h2>
      <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        The token leg uses the standard future value of a balance with a fixed addition at the end of every compounding
        period. The dollar leg is one multiplication on top of it. Every division and every exponent is guarded, and any step
        that stops being finite returns nothing rather than a number, so the page never prints a value the math did not
        actually produce.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Formula text="i = rate ÷ periods per year" />
        <Formula text="N = floor(periods per year × years)" />
        <Formula text="tokens = start × (1 + i)^N + added × ((1 + i)^N − 1) ÷ i" />
        <Formula text="effective annual rate = (1 + i)^periods − 1" />
        <Formula text="value = tokens × price × (1 + price change)^years" />
        <Formula text="break even price change = (put in ÷ tokens)^(1 ÷ years) − 1" />
      </div>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          Two details in that set are worth stating plainly. The period count is floored, because a partial compounding period
          pays nothing, and a calculator that credits a fraction of a period is inventing a payment. The contribution is added
          once per compounding period, which is the assumption the closed form requires. A monthly contribution against a daily
          compounding schedule is a different and messier calculation, and this page does not pretend the two are the same.
        </p>
        <p>
          The break even line is the one to read twice. It divides the tokens you put in by the tokens you end with, takes the
          annual root, and subtracts one. When the contribution is zero it reduces exactly to the price decline that cancels the
          rate. When there is a contribution it accounts for the shorter compounding life of each later addition.
        </p>
      </div>
    </section>
  );
}

function RateReality({ snapshot, facts }: { readonly snapshot: YieldSnapshot; readonly facts: RateFacts }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">The rate you are compounding is a snapshot</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          The rates in the selector are not typed constants. This build read {integer(snapshot.totalPools)} pools from the
          DefiLlama yields endpoint and kept {integer(snapshot.keptPools)} that hold at least two million dollars, which is the
          floor below which a published rate says more about a thin pool than about a market. The largest is{" "}
          {facts.largest.symbol.toUpperCase()} on {facts.largest.project} at {decimals(facts.largest.apy, 3)} percent across{" "}
          {billions(facts.largest.tvlUsd)} locked.
        </p>
        <p>
          A rate has parts, and the parts do not behave the same way. The base rate comes from the work the protocol charges
          for, staking rewards or borrower interest. The reward rate comes from token emissions a team decided to pay and can
          decide to stop. Of the pools kept in this snapshot, {integer(facts.withReward)} publish a reward component above zero
          and {integer(facts.rewardHeavy)} of those draw more than half their headline rate from it. Compounding an emissions
          rate over five years assumes a budget decision holds for five years, and that is the failure mode this page is here to
          name.
        </p>
        <p>
          Stability is checkable too. The endpoint publishes a 30 day mean beside the current rate. In this snapshot{" "}
          {integer(facts.withMean)} pools carry a usable 30 day mean and {integer(facts.aboveMean)} of them sit more than a
          quarter above their own recent average, which is the shape of a spike rather than a rate you can plan around.
          Another {integer(facts.noMean)} pools publish no usable mean at all, and for those there is nothing to compare
          against, so the page says so rather than filling the gap. The selector shows the split for whichever pool you pick,
          so the number you compound arrives with its own provenance attached.
        </p>
        <p>
          One more thing the incumbents get wrong by default. A quoted APY is already an effective annual rate with compounding
          inside it. Feeding that figure into a calculator set to compound monthly counts the compounding twice and inflates
          the result. Choosing a pool here sets the frequency to once a year for exactly that reason, and the field stays
          editable for a nominal rate that genuinely needs compounding applied.
        </p>
      </div>
    </section>
  );
}

function MeasuredWindows({ facts, universe }: { readonly facts: WindowFacts; readonly universe: MarketUniverse }) {
  const medianText = facts.medianYear === null
    ? "not available"
    : `${signed(facts.medianYear, 1)}`;
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">What the measured windows say</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A five year curve is persuasive because nothing in it has to survive contact with a real year. The table under the
          calculator puts your chosen asset and Bitcoin next to what they actually did over the windows the source publishes,
          which are 24 hours, 7 days, 30 days, 200 days and 1 year. There is no 90 day figure on this endpoint and none is
          shown. Where a window is empty the cell reads not available, because a missing measurement is information and a
          substituted one is not.
        </p>
        <p>
          The wider picture from the same fetch. Of {integer(facts.tracked)} non stablecoin rows in the universe,{" "}
          {integer(facts.withYear)} carry a 1 year price change, and {integer(facts.negativeYear)} of those are lower than they
          were twelve months ago. The median 1 year change across them is {medianText}. Set that against any of the rates in the
          selector above and the ordering is clear. Price movement dominates the outcome, and the rate is a modest edge applied
          to something much larger and much less predictable.
        </p>
        <p>
          Prices in this build were cross checked. {integer(universe.crossCheckedCount)} rows matched a second independent
          source within {decimals(universe.worstPriceSpreadPercent, 3)} percent at worst, and{" "}
          {integer(universe.droppedRows)} rows were dropped for failing a range check rather than repaired. Our{" "}
          <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link> describes the checks
          in full, and the <Link className="text-amber hover:text-accent-hover" href="/scorecard">scorecard</Link> covers the
          fundamentals that decide whether a token is worth holding long enough for any of this compounding to matter.
        </p>
      </div>
    </section>
  );
}

function Limits() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Where this calculator breaks</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          An APY is a snapshot of a rate that was being paid at the moment of the fetch. It is not a term rate and nobody has
          promised it for the length of your projection. Validator sets change, emissions schedules end, borrowing demand
          falls, and the rate moves with them.
        </p>
        <p>
          Compounding assumes the reward is restaked without cost. In practice claiming and restaking costs gas, some
          protocols pay on a schedule rather than continuously, and unbonding periods mean the tokens are not always available
          when you want them. On a small balance those frictions can consume most of a low single digit rate. The calculator
          models none of them, and treating its output as achievable is the first mistake to avoid.
        </p>
        <p>
          Tax is ignored. In several jurisdictions a staking reward is income at receipt, which means the compounding balance
          carries a liability the token count does not show. Slashing is ignored, and so is smart contract failure, bridge
          failure and the possibility that a liquid staking token trades below the asset it represents. Impermanent loss is
          ignored, which matters for any pool holding more than one asset.
        </p>
        <p>
          The price assumption is yours. This page supplies no forecast and treats a flat price as the default because a flat
          price at least states its own assumption openly. A long horizon at a high rate produces a large number that says more
          about the exponent than about any outcome. If a fifty year projection at eighty percent looks like a plan, the
          arithmetic is working and the model is not.
        </p>
        <p>
          For the trading side of a position, entry and exit fees, break even price and loss recovery live on the{" "}
          <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link>.
          For what we currently rate as worth research attention, see{" "}
          <Link className="text-amber hover:text-accent-hover" href="/opportunities">opportunities</Link>.
        </p>
      </div>
    </section>
  );
}

function Sources({ yields, universe }: { readonly yields: YieldSnapshot; readonly universe: MarketUniverse }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="sources-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span>
          <h2 id="sources-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Build snapshot</h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">
          Rates <time dateTime={yields.fetchedAt}>{yields.fetchedAt}</time>
        </p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        These values were fetched and checked before the static page was written. The calculator runs on the embedded snapshot
        and the browser makes no market data request.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotValue label="Pools returned" value={integer(yields.totalPools)} />
        <SnapshotValue label="Pools above the TVL floor" value={integer(yields.keptPools)} />
        <SnapshotValue label="Universe rows" value={integer(universe.rows.length)} />
        <SnapshotValue label="Rows cross checked" value={integer(universe.crossCheckedCount)} />
        <SnapshotValue label="Worst price spread" value={`${decimals(universe.worstPriceSpreadPercent, 3)}%`} />
        <SnapshotValue label="Prices fetched" value={universe.fetchedAt.slice(0, 19).replace("T", " ")} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Endpoints used</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Machine readable endpoints only. Rates come from DefiLlama, prices and price changes from CoinGecko, and each price
          is cross checked against CoinPaprika before the page is written.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          <li><a className="text-amber hover:text-accent-hover" href={YIELD_ENDPOINT}>DefiLlama yields<span aria-hidden="true"> ↗</span></a></li>
          {Object.entries(UNIVERSE_ENDPOINTS).map(([provider, href]) => (
            <li key={provider}><a className="text-amber hover:text-accent-hover" href={href}>{provider}<span aria-hidden="true"> ↗</span></a></li>
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
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the Early
          Thunder research engine end to end. He wrote this calculator after reading a shelf of compounding tools that model a
          crypto position as a dollar deposit and never mention the price leg.{" "}
          <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.
        </p>
      </section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold text-text-primary">Site-wide disclosures</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-text-secondary">
          <li>Research and data analysis only. Nothing here is investment advice or a recommendation to buy or sell any asset.</li>
          <li>Crypto assets are volatile and you can lose the entire amount you put in.</li>
          <li>A published rate is a snapshot of what was being paid when it was fetched. It is not a promise for any term.</li>
          <li>Every figure carries the timestamp it was fetched. Prices move continuously and the number on the page may already be out of date.</li>
          <li>The operator may hold positions in assets covered on this site. See the <Link className="text-amber hover:text-accent-hover" href="/portfolio">portfolio page</Link>.</li>
        </ul>
      </section>
    </>
  );
}

export default async function CryptoCompoundInterestCalculatorPage() {
  const [universe, yields] = await Promise.all([getMarketUniverse(), getYieldSnapshot()]);
  const priced = pricedSymbols(universe);
  const pools = poolOptions(yields, priced);
  const assets = assetOptions(universe, pools);
  const facts = rateFacts(yields);
  const windows = windowFacts(universe);
  const snapshot: CompoundSnapshot = {
    yieldFetchedAt: yields.fetchedAt,
    universeFetchedAt: universe.fetchedAt,
    pools,
    assets,
    defaultPoolKey: defaultPoolKey(pools, priced),
    bitcoin: toAsset(universe.bitcoin),
  };
  const cancelRate = facts === null ? null : yieldCancellingPriceChange(facts.largest.apy, 1);
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(yields.fetchedAt).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Crypto compound interest calculator</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Staking math with the price leg shown
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">Crypto compound interest calculator</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Compound a staking balance in tokens, then price it separately. The rate can be prefilled from live pools, and the
          page reports the annual price change that cancels whatever rate you compound.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          A generic savings calculator applies a fixed rate to a fixed dollar principal. A staking position does not work that
          way, and the difference decides the answer. Every calculation stays in your browser.
        </p>
      </header>
      <CompoundInterestCalculator snapshot={snapshot} />
      {facts !== null && <TwoLegs cancelRate={cancelRate} largest={facts.largest} />}
      <MathSection />
      {facts !== null && <RateReality snapshot={yields} facts={facts} />}
      <MeasuredWindows facts={windows} universe={universe} />
      <Limits />
      <Sources yields={yields} universe={universe} />
      <AuthorAndDisclosures />
    </div>
  );
}
