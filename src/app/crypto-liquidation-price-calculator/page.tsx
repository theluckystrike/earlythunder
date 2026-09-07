import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import LiquidationCalculator from "@/components/LiquidationCalculator";
import { UNIVERSE_ENDPOINTS, getMarketUniverse, type MarketUniverse, type UniverseRow } from "@/lib/market-universe";
import { getAllScorecardTokens, getScorecardMeta, type ScorecardToken } from "@/lib/scorecard-analytics";
import type { LiquidationSnapshot, LiquidationToken } from "@/lib/liquidation-math";

const PAGE_URL = "https://earlythunder.com/crypto-liquidation-price-calculator";
const PAGE_TITLE = "Crypto Liquidation Price Calculator";
const PAGE_DESCRIPTION = "Work out the liquidation price of a long or short, then check that distance against the moves the token has actually made across 24h, 7d, 30d, 200d and 1y.";
const MAX_EMBEDDED_TOKENS = 400;
const SCORECARD_CEILING = 400;
const EXCHANGE_DEPTH_KEY = "exchange_depth";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

function schemas(snapshot: LiquidationSnapshot): readonly Record<string, unknown>[] {
  const author = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
  const publisher = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: PAGE_TITLE,
      url: PAGE_URL, description: PAGE_DESCRIPTION, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Long and short liquidation price",
        "Isolated and cross margin",
        "Liquidation distance against measured price history",
        "Backward looking survival count across the token universe",
      ],
      author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION, url: PAGE_URL, mainEntityOfPage: PAGE_URL,
      datePublished: "2026-09-07", dateModified: snapshot.fetchedAt, author, publisher,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto liquidation price calculator", item: PAGE_URL },
      ],
    },
  ];
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

/** Reads the exchange depth sub score off a scorecard row. Null when absent. */
function exchangeDepthOf(token: ScorecardToken): { readonly value: number | null; readonly median: number | null } {
  if (!Array.isArray(token.variables)) return { value: null, median: null };
  const ceiling = token.variables.length > 40 ? 40 : token.variables.length;
  for (let i = 0; i < ceiling; i += 1) {
    const variable = token.variables[i];
    if (variable.key !== EXCHANGE_DEPTH_KEY) continue;
    const value = Number.isFinite(variable.value) ? variable.value : null;
    const median = variable.universe_median !== null && Number.isFinite(variable.universe_median) ? variable.universe_median : null;
    return { value, median };
  }
  return { value: null, median: null };
}

/** Symbol keyed index over the dated research file. First row per symbol wins. */
function scorecardIndex(): ReadonlyMap<string, ScorecardToken> {
  const tokens = getAllScorecardTokens();
  const index = new Map<string, ScorecardToken>();
  const ceiling = tokens.length > SCORECARD_CEILING ? SCORECARD_CEILING : tokens.length;
  for (let i = 0; i < ceiling; i += 1) {
    const symbol = tokens[i].symbol.toUpperCase();
    if (index.has(symbol)) continue;
    index.set(symbol, tokens[i]);
  }
  return index;
}

function toEmbeddedToken(row: UniverseRow, scored: ScorecardToken | undefined): LiquidationToken {
  const depth = scored === undefined ? { value: null, median: null } : exchangeDepthOf(scored);
  return {
    symbol: row.symbol.toUpperCase(),
    name: row.name,
    rank: row.rank,
    price: row.price,
    allTimeHigh: row.allTimeHigh,
    allTimeHighDate: row.allTimeHighDate,
    fromAllTimeHighPercent: row.fromAllTimeHighPercent,
    change24h: row.change24h,
    change7d: row.change7d,
    change30d: row.change30d,
    change200d: row.change200d,
    change1y: row.change1y,
    score: scored === undefined ? null : scored.score,
    maxScore: scored === undefined ? null : scored.max_score,
    verdict: scored === undefined ? null : scored.verdict,
    exchangeDepth: depth.value,
    exchangeDepthMedian: depth.median,
  };
}

/** Builds the embedded snapshot. Stablecoins are dropped before anything else. */
function buildSnapshot(universe: MarketUniverse): LiquidationSnapshot {
  if (!universe || !Array.isArray(universe.rows)) throw new Error("Market universe is unavailable.");
  const index = scorecardIndex();
  const meta = getScorecardMeta();
  const tokens: LiquidationToken[] = [];
  let matches = 0;
  const ceiling = universe.rows.length > MAX_EMBEDDED_TOKENS ? MAX_EMBEDDED_TOKENS : universe.rows.length;
  for (let i = 0; i < ceiling; i += 1) {
    const row = universe.rows[i];
    if (row.isStablecoin) continue;
    if (!Number.isFinite(row.price) || row.price <= 0) continue;
    const scored = index.get(row.symbol.toUpperCase());
    if (scored !== undefined) matches += 1;
    tokens.push(toEmbeddedToken(row, scored));
  }
  if (tokens.length === 0) throw new Error("No non stablecoin rows survived the universe filter.");
  const updatedAt = meta.source_updated_at;
  if (updatedAt === null) throw new Error("Scorecard snapshot date is missing.");
  return {
    fetchedAt: universe.fetchedAt,
    scorecardUpdatedAt: updatedAt,
    universeRows: universe.rows.length,
    stablecoinCount: universe.stablecoinCount,
    crossCheckedCount: universe.crossCheckedCount,
    worstPriceSpreadPercent: universe.worstPriceSpreadPercent,
    scorecardMatches: matches,
    tokens,
  };
}

function Formula({ text }: { readonly text: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{text}</div>;
}

function Sources({ snapshot }: { readonly snapshot: LiquidationSnapshot }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="sources-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span>
          <h2 id="sources-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Build snapshot behind this page</h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">Fetched <time dateTime={snapshot.fetchedAt}>{snapshot.fetchedAt}</time></p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        The build fetched the market rows, dropped the flagged stablecoins, and embedded what was left in the page. The
        browser reads the embedded copy and makes no market data request of its own.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SourceValue label="Rows returned" value={integer(snapshot.universeRows)} />
        <SourceValue label="Flagged stablecoins" value={integer(snapshot.stablecoinCount)} />
        <SourceValue label="Tokens embedded here" value={integer(snapshot.tokens.length)} />
        <SourceValue label="Rows cross checked" value={integer(snapshot.crossCheckedCount)} />
        <SourceValue label="Worst price spread" value={`${snapshot.worstPriceSpreadPercent.toFixed(3)}%`} />
        <SourceValue label="Matched to the research file" value={integer(snapshot.scorecardMatches)} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Endpoints and dates</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Prices, all-time highs and the five change windows come from the CoinGecko markets endpoint. A second read of
          CoinPaprika cross checked {integer(snapshot.crossCheckedCount)} of those rows and the worst price spread
          between the two providers was {snapshot.worstPriceSpreadPercent.toFixed(3)} percent. The score, verdict and
          exchange depth readings come from Early Thunder&apos;s own 251 token research file, a dated snapshot generated
          on {snapshot.scorecardUpdatedAt.slice(0, 10)} and not a live figure.
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

function SourceValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words font-mono text-xl font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

function Explanation({ snapshot }: { readonly snapshot: LiquidationSnapshot }) {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">How a liquidation price is derived</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            A perpetual position starts with a notional value and a posted margin. The margin is the notional divided by
            the leverage, so a 1,000 dollar position at 10x rests on 100 dollars. As the price moves against the
            position the unrealised loss eats that margin. The venue does not wait for the margin to reach zero. It
            closes the position once the remaining equity falls to the maintenance requirement, which is a small
            percentage of the notional set by the venue and usually stepped by position size.
          </p>
          <p>
            Setting the unrealised loss equal to the posted margin minus the maintenance requirement and solving for
            price gives the level below. The direction of the trade only flips the sign. The distance itself is the same
            either way, which is why a short at 10x sits as far above entry as a long at 10x sits below it.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Formula text="initial margin = notional / leverage" />
          <Formula text="maintenance requirement = notional * rate" />
          <Formula text="long liquidation = entry * (1 - 1/leverage + rate)" />
          <Formula text="short liquidation = entry * (1 + 1/leverage - rate)" />
          <Formula text="distance = 1/leverage - rate" />
          <Formula text="cross margin adds free balance / notional to the distance" />
        </div>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          That last term is the whole of the isolated and cross difference in this model. Isolated margin ring fences
          the posted amount, so the distance is fixed by the leverage and the rate alone. Cross margin puts the free
          wallet balance behind the position, which pushes the level further away while that balance lasts. The
          calculator asks for the free balance in cross mode because there is no honest way to compute the level
          without it.
        </p>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">The number every other calculator stops at</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            Search this term and the tools that come back all return the same arithmetic. Enter an entry price and a
            leverage, receive a liquidation price and a distance in percent. That distance is correct. It is also
            almost useless on its own, because 9.1 percent means nothing until you know what the asset in front of you
            does in a week.
          </p>
          <p>
            So this page puts the distance next to the record. For the selected token it shows the measured 24 hour, 7
            day, 30 day, 200 day and 1 year changes, plus the current drawdown from the all-time high, and it counts how
            many of those readings are already at least as large as the liquidation distance you just created. When the
            answer is four out of five, the leverage setting has stopped being an abstraction. The move that closes the
            position is not hypothetical for that asset. It is in the record, and it happened inside a window shorter
            than most people hold for.
          </p>
          <p>
            The count reads the absolute size of each change, so an upward move counts against a short and a downward
            move counts against a long, and a window with no reading is excluded rather than filled in. CoinGecko does
            not serve a 90 day window on this endpoint, so no 90 day figure appears anywhere on the page.
          </p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Reading the survival count honestly</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            The second table widens the question from one token to the whole embedded set. For the leverage on screen it
            takes the liquidation distance and asks, across the {integer(snapshot.tokens.length)} non stablecoin tokens
            in the snapshot, how many of them recorded a move at least that large over the chosen window. The count and
            the denominator are both printed, and the tokens the source gave no reading for are reported as an explicit
            exclusion rather than being quietly dropped from the base.
          </p>
          <p>
            That share is a backward looking frequency over a single window ending on the fetch date. It says how
            common a move of that size was among these assets in that window. It is not a probability that a position
            opened today gets closed out, and nothing here should be read that way. The sample is one point in time and
            the assets in it are the ones large enough to sit near the top of the market today, which is its own
            selection effect.
          </p>
          <p>
            The calculator also solves the question in reverse. Given the largest absolute move the selected token made
            across those windows, it reports the highest leverage whose liquidation distance still clears that move.
            That figure is frequently in the low single digits, and for a token that halved over a year it can fall
            below 1x, in which case the tool says so rather than rounding up to something reassuring.
          </p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Why exchange depth belongs next to a liquidation level</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            A liquidation is a market order the position holder does not get to place. The engine has to sell into
            whatever book exists at that moment, and on a thin book that sale moves the price further, which reaches the
            next stop below, which sells again. That feedback is why liquidation clusters arrive as cascades rather than
            as single prints, and why the same leverage carries a different practical risk on a deep pair than on a thin
            one.
          </p>
          <p>
            Early Thunder scores 251 tokens across 25 variables, and one of them is exchange depth. The panel joins the
            selected token to that file on its ticker and prints the composite score, the verdict and the exchange depth
            sub score against the universe median, with an explicit not scored state when the token has no row. The file
            was generated on {snapshot.scorecardUpdatedAt.slice(0, 10)}, so it is a dated research snapshot and the
            depth reading describes the venues as they were then. The full methodology is on the{" "}
            <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link>, and every
            scored token has its own page in the{" "}
            <Link className="text-amber hover:text-accent-hover" href="/scorecard">scorecard</Link>.
          </p>
          <p>
            Matching is on the ticker symbol, the weakest join available in this market. Tickers are reused across
            chains and reassigned after rebrands, so a match is evidence and not proof. This build matched{" "}
            {integer(snapshot.scorecardMatches)} of the {integer(snapshot.tokens.length)} embedded tokens.
          </p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Where this calculation breaks</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>
            Funding is the first gap. A perpetual pays or collects funding every few hours, and on an isolated position
            that payment comes out of the same margin the liquidation level is computed from. A long paying funding
            through a flat market watches its liquidation price drift up towards the mark without the price having moved
            at all. This model takes a single snapshot and applies no funding, so it understates the level on a position
            held for days.
          </p>
          <p>
            The mark price is the second. Venues do not liquidate on the last trade. They liquidate on a mark that is
            usually an index of several spot venues, sometimes smoothed by a moving average or a funding basis term. A
            wick on one exchange that never touches the index will not close the position, and an index that lags a
            genuine move will close it late. The level here is computed against the entry price you enter, which is a
            different quantity from the venue mark.
          </p>
          <p>
            Fees and slippage are the third. The forced close pays a taker fee and often a separate liquidation penalty,
            and it executes wherever the book allows rather than at the computed level. On a thin pair the realised
            close is worse than the arithmetic, which is exactly when the depth reading matters most. Cross margin is
            the fourth. Once the account is cross, the whole balance stands behind every open position, so the real
            level depends on every other position you hold and moves whenever any of them does. The free balance field
            models one moment of that, not its path.
          </p>
          <p>
            The maintenance rate is the fifth. Venues tier it by position size, and the rate here is whatever you type,
            applied to the entry notional rather than to the notional at the liquidation level. That is the common
            simplification and not the exact venue formula, so check the tier table for the contract before trusting a
            level from any calculator, this one included.
          </p>
        </div>
      </section>

      <section className="mt-20 rounded-2xl border border-negative/40 bg-negative/10 p-6">
        <h2 className="text-xl font-semibold text-text-primary">Risk warning</h2>
        <p className="mt-4 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          A leveraged position can lose the entire margin behind it, and on a cross margin account that margin is the
          whole balance. Liquidation is not a stop loss and it does not return the remainder in an orderly way. This
          page is research and data analysis, not investment advice and not a recommendation to open any position. If
          the survival count above shows that the asset routinely moves further than your liquidation distance, that is
          the finding, and no setting on this page changes it.
        </p>
      </section>
    </>
  );
}

function AuthorAndDisclosures() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Built and checked by Michael Lip</h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the
          Early Thunder research engine end to end. He wrote this calculator because the liquidation distance and the
          asset&apos;s own price record belong on the same screen. For fee aware entry and exit math on a spot trade, see
          the <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link>.{" "}
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

export default async function CryptoLiquidationPriceCalculatorPage() {
  const universe = await getMarketUniverse();
  const snapshot = buildSnapshot(universe);
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(snapshot).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Crypto liquidation price calculator</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-negative" />
          Leveraged position math
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">
          Crypto liquidation price calculator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Compute the liquidation price of a long or a short, in isolated or cross margin, then read that distance
          against the moves the token has actually recorded.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          Every price is embedded at build time from a cross checked market snapshot. The calculation stays in your
          browser and no market data request is made from this page.
        </p>
      </header>
      <LiquidationCalculator snapshot={snapshot} />
      <Sources snapshot={snapshot} />
      <Explanation snapshot={snapshot} />
      <AuthorAndDisclosures />
    </div>
  );
}
