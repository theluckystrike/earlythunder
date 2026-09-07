import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import StakingCalculator from "@/components/StakingCalculator";
import { getMarketUniverse, UNIVERSE_ENDPOINTS, type MarketUniverse, type UniverseRow } from "@/lib/market-universe";
import { getYieldSnapshot, YIELD_ENDPOINT, type YieldRow, type YieldSnapshot } from "@/lib/staking-yields";
import type { ScorecardScale, StakingPoolOption } from "@/lib/staking-math";
import scorecardData from "../../../data/altcoin-scorecard.json";

const PAGE_URL = "https://earlythunder.com/crypto-staking-calculator";
const PAGE_TITLE = "Crypto Staking Calculator with Real Yield";
const PAGE_DESCRIPTION =
  "Calculate staking rewards from live DeFiLlama pool APYs, then net them against supply issuance to see the real yield. Base and reward APY are shown apart.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

/* ─── Bounds ──────────────────────────────────────────────── */

const MAX_EMBEDDED_POOLS = 60;
const MAX_SCORECARD_TOKENS = 2_000;
const MAX_SUFFIX_RULES = 32;

/** Underlying asset for a staked ticker the suffix rule cannot resolve. */
const BASE_SYMBOL_OVERRIDES: Readonly<Record<string, string>> = {
  ETH: "ETH",
  ETHX: "ETH",
  INF: "SOL",
  MATICX: "POL",
  ANKRFLOWEVM: "FLOW",
  SUPEROETHB: "ETH",
  VENOM: "VENOM",
};

/** Suffix rule applied to a staked ticker, longest suffix first. */
const BASE_SYMBOL_SUFFIXES: readonly (readonly [string, string])[] = [
  ["PENDLE", "PENDLE"],
  ["MATIC", "POL"],
  ["LINK", "LINK"],
  ["AVAX", "AVAX"],
  ["FLOW", "FLOW"],
  ["BNB", "BNB"],
  ["ETH", "ETH"],
  ["SOL", "SOL"],
  ["BTC", "BTC"],
  ["DOT", "DOT"],
  ["CRV", "CRV"],
];

/** DeFiLlama project slugs that are staking products without a stake token in the name. */
const STAKING_PROJECT_ALLOWLIST: readonly string[] = [
  "lido",
  "rocket-pool",
  "kelp",
  "renzo",
  "stader",
  "ankr",
  "frax-ether",
  "origin-ether",
  "sanctum-infinity",
  "lombard-lbtc",
];

/** Assets the measured query cluster asks about by name. */
const COVERAGE_SYMBOLS: readonly string[] = ["ETH", "SOL", "DOT", "ATOM"];

/* ─── Scorecard access ────────────────────────────────────── */

interface ScorecardEntry {
  readonly score: number;
  readonly verdict: string;
  readonly stakingYield: number | null;
  readonly supplyInflation: number | null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textOrNull(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= limit ? value : null;
}

/**
 * Indexes data/altcoin-scorecard.json by ticker. Every field is validated, and
 * a token whose score or verdict is missing is dropped rather than defaulted,
 * so the page can only print a score that is actually in the file.
 */
function scorecardIndex(): ReadonlyMap<string, ScorecardEntry> {
  const raw: unknown = (scorecardData as { tokens?: unknown }).tokens;
  const index = new Map<string, ScorecardEntry>();
  if (!Array.isArray(raw)) return index;
  const ceiling = Math.min(raw.length, MAX_SCORECARD_TOKENS);
  for (let position = 0; position < ceiling; position += 1) {
    const entry: unknown = raw[position];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const token = entry as Record<string, unknown>;
    const symbol = textOrNull(token.symbol, 40);
    const score = numberOrNull(token.score);
    const verdict = textOrNull(token.verdict, 60);
    if (symbol === null || score === null || verdict === null) continue;
    const scores = token.scores;
    const sub = scores && typeof scores === "object" && !Array.isArray(scores) ? (scores as Record<string, unknown>) : {};
    index.set(symbol.toUpperCase(), {
      score,
      verdict,
      stakingYield: numberOrNull(sub.staking_yield),
      supplyInflation: numberOrNull(sub.supply_inflation),
    });
  }
  return index;
}

/**
 * Measures the rating scale rather than asserting it. The variable count is
 * the widest sub score object in the file and the ceiling is the highest sub
 * score value present, so the stated maximum cannot drift from the data.
 */
function scorecardScale(): ScorecardScale {
  const raw: unknown = (scorecardData as { tokens?: unknown }).tokens;
  if (!Array.isArray(raw)) throw new Error("The research file has no token array.");
  let variables = 0;
  let subScoreMax = 0;
  const ceiling = Math.min(raw.length, MAX_SCORECARD_TOKENS);
  for (let position = 0; position < ceiling; position += 1) {
    const entry: unknown = raw[position];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const scores = (entry as Record<string, unknown>).scores;
    if (!scores || typeof scores !== "object" || Array.isArray(scores)) continue;
    const values = Object.values(scores as Record<string, unknown>);
    if (values.length > variables) variables = values.length;
    for (const value of values) {
      const numeric = numberOrNull(value);
      if (numeric !== null && numeric > subScoreMax) subScoreMax = numeric;
    }
  }
  if (variables < 1 || subScoreMax < 1) throw new Error("The research file has no usable rating scale.");
  return { variables, subScoreMax, compositeMax: variables * subScoreMax };
}

function scorecardUpdatedAt(): string {
  return textOrNull((scorecardData as { updated_at?: unknown }).updated_at, 40) ?? "unknown";
}

/* ─── Pool selection ──────────────────────────────────────── */

/** True when the DeFiLlama row describes a single asset staking position. */
function isStakingPool(row: YieldRow): boolean {
  if (row.stablecoin) return false;
  if (row.exposure !== "single") return false;
  if (row.ilRisk !== "no") return false;
  const project = row.project.toLowerCase();
  if (project.includes("stak")) return true;
  return STAKING_PROJECT_ALLOWLIST.includes(project);
}

/** Resolves the underlying asset ticker, or null when no stated rule matches. */
function resolveBaseSymbol(stakedSymbol: string): string | null {
  if (stakedSymbol.length === 0 || stakedSymbol.length > 40) return null;
  const ticker = stakedSymbol.toUpperCase();
  const override = BASE_SYMBOL_OVERRIDES[ticker];
  if (typeof override === "string") return override;
  const ceiling = Math.min(BASE_SYMBOL_SUFFIXES.length, MAX_SUFFIX_RULES);
  for (let position = 0; position < ceiling; position += 1) {
    const rule = BASE_SYMBOL_SUFFIXES[position];
    if (ticker.endsWith(rule[0])) return rule[1];
  }
  return null;
}

function overhangPercent(row: UniverseRow | null): number | null {
  if (row === null) return null;
  const total = row.totalSupply;
  if (total === null || total <= 0) return null;
  const share = ((total - row.circulatingSupply) / total) * 100;
  if (!Number.isFinite(share) || share < 0 || share > 100) return null;
  return share;
}

function buildPools(
  yields: YieldSnapshot,
  universe: MarketUniverse,
  scores: ReadonlyMap<string, ScorecardEntry>,
): readonly StakingPoolOption[] {
  if (yields.rows.length === 0) throw new Error("The yield snapshot returned no rows.");
  const bySymbol = new Map<string, UniverseRow>();
  for (const row of universe.rows) {
    if (!bySymbol.has(row.symbol)) bySymbol.set(row.symbol, row);
  }
  const options: StakingPoolOption[] = [];
  for (const row of yields.rows) {
    if (options.length >= MAX_EMBEDDED_POOLS) break;
    if (!isStakingPool(row)) continue;
    const baseSymbol = resolveBaseSymbol(row.symbol);
    const universeRow = baseSymbol === null ? null : bySymbol.get(baseSymbol) ?? null;
    const scored = baseSymbol === null ? undefined : scores.get(baseSymbol);
    options.push({
      id: row.pool,
      project: row.project,
      chain: row.chain,
      symbol: row.symbol,
      tvlUsd: row.tvlUsd,
      apy: row.apy,
      apyBase: row.apyBase,
      apyReward: row.apyReward,
      apyMean30d: row.apyMean30d,
      baseSymbol,
      baseName: universeRow === null ? null : universeRow.name,
      basePriceUsd: universeRow === null ? null : universeRow.price,
      circulatingSupply: universeRow === null ? null : universeRow.circulatingSupply,
      totalSupply: universeRow === null ? null : universeRow.totalSupply,
      overhangPercent: overhangPercent(universeRow),
      score: scored === undefined ? null : scored.score,
      verdict: scored === undefined ? null : scored.verdict,
      stakingYieldScore: scored === undefined ? null : scored.stakingYield,
      supplyInflationScore: scored === undefined ? null : scored.supplyInflation,
    });
  }
  if (options.length === 0) throw new Error("No staking pool survived the selection rule.");
  return options;
}

/* ─── Derived counts, all computed from the two snapshots ─── */

interface PoolStats {
  readonly embedded: number;
  readonly chains: number;
  readonly assets: number;
  readonly priced: number;
  readonly scored: number;
  readonly rewardBearing: number;
  readonly aboveThirtyDayMean: number;
}

function poolStats(pools: readonly StakingPoolOption[]): PoolStats {
  if (pools.length === 0) throw new Error("Pool statistics need at least one pool.");
  const chains = new Set<string>();
  const assets = new Set<string>();
  let priced = 0;
  let scored = 0;
  let rewardBearing = 0;
  let aboveThirtyDayMean = 0;
  for (const pool of pools) {
    chains.add(pool.chain);
    if (pool.baseSymbol !== null) assets.add(pool.baseSymbol);
    if (pool.basePriceUsd !== null) priced += 1;
    if (pool.score !== null) scored += 1;
    if (pool.apyReward !== null && pool.apyReward > 0) rewardBearing += 1;
    if (pool.apyMean30d !== null && pool.apy > pool.apyMean30d) aboveThirtyDayMean += 1;
  }
  return {
    embedded: pools.length,
    chains: chains.size,
    assets: assets.size,
    priced,
    scored,
    rewardBearing,
    aboveThirtyDayMean,
  };
}

interface CoverageRow {
  readonly symbol: string;
  readonly name: string | null;
  readonly priceUsd: number | null;
  readonly poolCount: number;
  readonly bestApy: number | null;
  readonly overhangPercent: number | null;
  readonly score: number | null;
  readonly verdict: string | null;
  readonly stakingYieldScore: number | null;
  readonly supplyInflationScore: number | null;
}

function coverageRows(
  pools: readonly StakingPoolOption[],
  universe: MarketUniverse,
  scores: ReadonlyMap<string, ScorecardEntry>,
): readonly CoverageRow[] {
  const rows: CoverageRow[] = [];
  for (const symbol of COVERAGE_SYMBOLS) {
    const universeRow = universe.rows.find((row) => row.symbol === symbol) ?? null;
    const scored = scores.get(symbol);
    let poolCount = 0;
    let bestApy: number | null = null;
    for (const pool of pools) {
      if (pool.baseSymbol !== symbol) continue;
      poolCount += 1;
      if (bestApy === null || pool.apy > bestApy) bestApy = pool.apy;
    }
    rows.push({
      symbol,
      name: universeRow === null ? null : universeRow.name,
      priceUsd: universeRow === null ? null : universeRow.price,
      poolCount,
      bestApy,
      overhangPercent: overhangPercent(universeRow),
      score: scored === undefined ? null : scored.score,
      verdict: scored === undefined ? null : scored.verdict,
      stakingYieldScore: scored === undefined ? null : scored.stakingYield,
      supplyInflationScore: scored === undefined ? null : scored.supplyInflation,
    });
  }
  if (rows.length !== COVERAGE_SYMBOLS.length) throw new Error("Coverage table lost a row.");
  return rows;
}

/* ─── Formatting ──────────────────────────────────────────── */

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function compactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function priceUsd(value: number | null): string {
  if (value === null) return "Not available";
  const decimals = value < 1 ? 6 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

function percentOrMissing(value: number | null, digits = 3): string {
  if (value === null) return "Not reported";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value)}%`;
}

/* ─── Structured data ─────────────────────────────────────── */

function schemas(fetchedAt: string): readonly Record<string, unknown>[] {
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
        "Compound staking rewards at a chosen frequency",
        "Inflation adjusted real yield",
        "Base APY and reward APY separated",
        "Break even issuance rate",
        "Dated fundamentals overlay from a 251 token research file",
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
      dateModified: fetchedAt,
      author,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: "Crypto staking calculator", item: PAGE_URL },
      ],
    },
  ];
}

/* ─── Sections ────────────────────────────────────────────── */

function Formula({ text }: { readonly text: string }) {
  return <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{text}</div>;
}

function RealYieldSection({ stats }: { readonly stats: PoolStats }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        Nominal yield against real yield
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A staking reward paid in the staked token adds tokens to a balance. It does not, on its own, add ownership.
          If a network mints new supply at roughly the rate it pays stakers, a validator who stakes and a holder who
          does not both end the year owning close to the same share of the network they started with, and the staker
          simply avoided being diluted. That is the reason this page prints two numbers where the ranked results print
          one.
        </p>
        <p>
          The nominal figure is the pool APY as the provider reports it. The real figure divides one plus that yield by
          one plus the annual supply issuance and subtracts one, which restates the ending balance as a share of total
          supply rather than as a token count. Set issuance equal to the yield and the real figure goes to zero even
          though the token balance still grew. Set issuance above the yield and the real figure goes negative while the
          balance keeps rising, which is the case a token denominated calculator cannot show at all.
        </p>
        <p>
          The break even issuance rate is the third output. It is the annual issuance at which the reward exactly
          cancels, and it equals the effective annual yield after compounding rather than the rate typed into the box.
          Those two agree only when the compounding frequency is annual, which is why the frequency control defaults
          there. {integer(stats.embedded)} pools are embedded in this page and every one of them is run through the
          same transform.
        </p>
      </div>
    </section>
  );
}

function IssuanceSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        Why the issuance field starts empty
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          The issuance box defaults to zero and nothing prefills it. That is deliberate. This page fetches market data
          and pool yields at build time, and neither of those feeds carries an annual issuance rate for a proof of
          stake network. Filling the field from a supply ratio would produce a plausible looking number that was not
          measured, and a wrong denominator here changes the sign of the answer. An empty field the reader fills in
          knowingly is worth more than a confident number nobody sourced.
        </p>
        <p>
          The rate is obtainable, it just has to come from the chain. A Solana node answers the JSON RPC method
          getInflationRate with the current total, validator and foundation components. A Cosmos SDK chain serves its
          current mint rate at the REST path /cosmos/mint/v1beta1/inflation, which is the figure a Cosmos or ATOM
          staking calculation actually needs. Polkadot has no single constant to quote, because its issuance is a
          function of how much of the supply is staked at the time. Ethereum issuance depends on the number of active
          validators and is netted against the fee burn, so the useful figure is a net change in supply rather than a
          gross mint. Take the number from the chain you are staking on, enter it, and the real yield line updates.
        </p>
      </div>
    </section>
  );
}

function SplitSection({ stats }: { readonly stats: PoolStats }) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        The part of an APY that can be switched off
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          DeFiLlama reports a headline APY, a base component and a reward component. The base component is what the
          position earns from consensus rewards or protocol revenue. The reward component is a token emission, and an
          emission is a budget decision that a protocol can cut, taper or stop. A headline rate that is mostly reward
          is a different asset from the same headline rate paid entirely from base, and quoting the two as one number
          is the habit that every ranked result on this query shares. Of the pools embedded here,
          {" "}{integer(stats.rewardBearing)} carry a reward component above zero, and the panel under the calculator
          prints the reward share of the headline so the split is visible before the amount is entered.
        </p>
        <p>
          The second column that matters is the thirty day mean. A rate quoted today can be a spike, a decayed
          incentive, or a genuinely steady payout, and one number cannot tell those apart. Comparing today against the
          thirty day mean does. {integer(stats.aboveThirtyDayMean)} of the embedded pools currently sit above their own
          thirty day mean, which is a fact about the moment the page was built and not a claim about tomorrow.
        </p>
      </div>
    </section>
  );
}

function OverlaySection({ pools, stats, updatedAt, scale }: {
  readonly pools: readonly StakingPoolOption[];
  readonly stats: PoolStats;
  readonly updatedAt: string;
  readonly scale: ScorecardScale;
}) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        The fundamentals behind the yield
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          Early Thunder scores its research universe across {integer(scale.variables)} variables, and two of those
          variables speak directly to a staking decision. The staking yield sub score reads how the payout is funded.
          The supply inflation sub score reads how fast the supply behind it grows. Both run to{" "}
          {integer(scale.subScoreMax)}, both sit inside a composite that runs to {integer(scale.compositeMax)}, and
          both carry the date they were written rather than the date you read them. The research file is stamped {updatedAt.slice(0, 10)}. It is a dated snapshot, not a live feed, and it
          is presented that way everywhere it appears on this page. The full method is on the{" "}
          <Link className="text-amber hover:text-accent-hover" href="/methodology">methodology page</Link> and the
          scored universe is on the{" "}
          <Link className="text-amber hover:text-accent-hover" href="/scorecard">scorecard</Link>.
        </p>
        <p>
          {integer(stats.scored)} of the {integer(stats.embedded)} embedded pools resolve to an asset that has a row in
          that file, and {integer(stats.priced)} resolve to an asset that had a live price in the build universe. The
          remainder print an explicit not scored or not available state. A pool whose staked ticker matches no stated
          mapping rule is left unmapped rather than guessed at, which costs a row of coverage and buys the reader the
          ability to trust the rows that are filled in.
        </p>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-xs sm:text-sm">
          <caption className="sr-only">Staking pools embedded in this page with their APY split and fundamentals</caption>
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Project</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Chain</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Ticker</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">TVL</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">APY</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Base</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Reward</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">30d mean</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={pool.id} className="border-b border-border-subtle last:border-0">
                <td className="break-words px-2 py-3 text-text-primary sm:px-3">{pool.project}</td>
                <td className="break-words px-2 py-3 text-text-secondary sm:px-3">{pool.chain}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{pool.symbol}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{compactUsd(pool.tvlUsd)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{percentOrMissing(pool.apy, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{percentOrMissing(pool.apyBase, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{percentOrMissing(pool.apyReward, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{percentOrMissing(pool.apyMean30d, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{pool.score === null ? "Not scored" : `${integer(pool.score)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CoverageSection({ rows, updatedAt }: {
  readonly rows: readonly CoverageRow[];
  readonly updatedAt: string;
}) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        Undistributed supply is not an issuance rate
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          A market data feed will give circulating supply and total supply, and the gap between them is often presented
          as dilution. It is a real overhang, but it measures tokens that are already minted and not yet distributed.
          It says nothing about a network that mints fresh supply every epoch forever. Polkadot is the clean example in
          the table below. Its undistributed share reads near zero because almost every token that exists is already
          circulating, while its supply inflation sub score is low precisely because issuance continues regardless.
          Deriving an inflation input from the supply columns would have flattered exactly the asset that needs the
          adjustment most.
        </p>
        <p>
          The table is generated from the same two snapshots the calculator uses. Where the pool count reads zero, no
          staking pool for that asset cleared the two million dollar total value locked floor in the DeFiLlama pull, so
          the calculator has no rate to prefill and the reader supplies one. That is the honest answer for Cosmos in
          particular, and it is more useful than a rate copied from a marketing page. Scores and sub scores are from
          the {updatedAt.slice(0, 10)} research snapshot.
        </p>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-xs sm:text-sm">
          <caption className="sr-only">Cluster assets with pool coverage, price, undistributed supply and research scores</caption>
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Asset</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Price</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Pools</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Best APY</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Undistributed</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Score</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Verdict</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Staking yield</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Supply inflation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-b border-border-subtle last:border-0">
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{row.symbol}{row.name === null ? "" : ` ${row.name}`}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{priceUsd(row.priceUsd)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{integer(row.poolCount)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{row.bestApy === null ? "No pool above floor" : percentOrMissing(row.bestApy, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{percentOrMissing(row.overhangPercent, 2)}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{row.score === null ? "Not scored" : integer(row.score)}</td>
                <td className="break-words px-2 py-3 text-text-secondary sm:px-3">{row.verdict === null ? "Not scored" : row.verdict}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{row.stakingYieldScore === null ? "Not scored" : `${integer(row.stakingYieldScore)} of 10`}</td>
                <td className="break-words px-2 py-3 font-mono text-text-secondary sm:px-3">{row.supplyInflationScore === null ? "Not scored" : `${integer(row.supplyInflationScore)} of 10`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MathSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        How the math works
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Formula text="Ending balance = amount × (1 + rate ÷ n) ^ (n × years)" />
        <Formula text="Effective annual = (1 + rate ÷ n) ^ n − 1" />
        <Formula text="Real yield = (1 + effective annual) ÷ (1 + issuance) − 1" />
        <Formula text="Break even issuance = effective annual" />
        <Formula text="Supply share multiple = (1 + real yield) ^ years" />
        <Formula text="Reward share = reward APY ÷ headline APY" />
      </div>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          The term is capped at 50 years and any rate is capped at 1000 percent, because past those points the
          exponent stops being representable and a calculator that prints infinity has stopped being a calculator.
          Every intermediate value is checked for finiteness before it reaches the screen, and an input combination
          that overflows returns an explicit message instead of a number. All of it runs in the browser from data
          embedded at build time, so the page makes no market request while you use it.
        </p>
      </div>
    </section>
  );
}

function LimitsSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
        Where this model breaks
      </h2>
      <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
        <p>
          An APY quoted today is an observation, not a promise. It moves with the validator set, with the fee market,
          with how much of the supply is staked and with whatever emission schedule funds the reward component. Holding
          one rate constant for five years, which is what any staking calculator does, is a modelling convenience and
          nothing more.
        </p>
        <p>
          A validator can be slashed. A protocol fault or a double signing event removes principal, and no yield figure
          on this page carries a slashing probability because none was measured. Unbonding is the second omission. Most
          proof of stake networks lock a withdrawal for a protocol set delay during which the position cannot be sold,
          and that parameter is not fetched here, so check it on the chain you are staking on before treating the
          balance as liquid. A liquid staking token removes the delay by adding a secondary market that can trade below
          the value of what it represents.
        </p>
        <p>
          Custodial staking through an exchange or a managed provider adds counterparty risk that a yield number cannot
          express. The rate quoted is net of a fee that is not always disclosed on the same page as the rate, and the
          assets are held by someone else. Smart contract risk applies to every pool in the embedded table. Finally,
          the USD outputs multiply a token balance by a single price that was true at build time and will not hold for
          the term. Read the dollar column as a unit conversion, not as a forecast. For entry and exit fee math on the
          trade around the position, use the{" "}
          <Link className="text-amber hover:text-accent-hover" href="/crypto-profit-calculator">crypto profit calculator</Link>,
          and for what the research engine currently flags, see the{" "}
          <Link className="text-amber hover:text-accent-hover" href="/opportunities">opportunities page</Link>.
        </p>
      </div>
    </section>
  );
}

function SourceSection({ yields, universe, stats }: {
  readonly yields: YieldSnapshot;
  readonly universe: MarketUniverse;
  readonly stats: PoolStats;
}) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12" aria-labelledby="sources-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Dated source check</span>
          <h2 id="sources-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
            Staking build snapshot
          </h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-secondary">
          Pools fetched <time dateTime={yields.fetchedAt}>{yields.fetchedAt}</time>
        </p>
      </div>
      <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.75] text-text-secondary">
        The build fetched and validated these values before writing the static page. The browser calculator reads the
        embedded snapshot and makes no market data request.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SourceValue label="Pools returned" value={integer(yields.totalPools)} />
        <SourceValue label="Pools above the TVL floor" value={integer(yields.keptPools)} />
        <SourceValue label="Staking pools embedded" value={integer(stats.embedded)} />
        <SourceValue label="Chains covered" value={integer(stats.chains)} />
        <SourceValue label="Underlying assets resolved" value={integer(stats.assets)} />
        <SourceValue label="Universe rows" value={integer(universe.rows.length)} />
        <SourceValue label="Rows cross checked" value={integer(universe.crossCheckedCount)} />
        <SourceValue label="Worst price spread" value={`${universe.worstPriceSpreadPercent.toFixed(3)}%`} />
        <SourceValue label="Market data fetched" value={universe.fetchedAt.slice(0, 19).replace("T", " ")} />
      </dl>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Endpoints used</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Pool yields come from the DeFiLlama yields endpoint. Prices and supply come from CoinGecko and are cross
          checked against CoinPaprika at build time. Scores come from a static research file inside this repository.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          <li><a className="text-amber hover:text-accent-hover" href={YIELD_ENDPOINT}>DeFiLlama yields<span aria-hidden="true"> ↗</span></a></li>
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

function AuthorAndDisclosures() {
  return (
    <>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">About the author</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
          Built and checked by Michael Lip
        </h2>
        <p className="mt-6 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link> builds and operates the
          Early Thunder research engine end to end. He wrote this calculator because the staking pages he was reading
          quoted a nominal rate and stopped, which is the one number that cannot answer whether staking preserved a
          share of the network.{" "}
          <a className="text-amber hover:text-accent-hover" href="https://github.com/theluckystrike">View his GitHub profile<span aria-hidden="true"> ↗</span></a>.
        </p>
      </section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold text-text-primary">Site-wide disclosures</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-text-secondary">
          <li>Research and data analysis only. Nothing here is investment advice or a recommendation to buy, sell or stake any asset.</li>
          <li>Crypto assets are volatile and you can lose the entire amount you put in.</li>
          <li>Scores measure fundamentals as recorded on the stated date. They do not predict price.</li>
          <li>Every figure carries the timestamp it was fetched. Prices move continuously and the number on the page may already be out of date.</li>
          <li>The operator may hold positions in assets covered on this site. See the <Link className="text-amber hover:text-accent-hover" href="/portfolio">portfolio page</Link>.</li>
        </ul>
      </section>
    </>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default async function CryptoStakingCalculatorPage() {
  const [yields, universe] = await Promise.all([getYieldSnapshot(), getMarketUniverse()]);
  const scores = scorecardIndex();
  const updatedAt = scorecardUpdatedAt();
  const scale = scorecardScale();
  const pools = buildPools(yields, universe, scores);
  const stats = poolStats(pools);
  const coverage = coverageRows(pools, universe, scores);
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(yields.fetchedAt).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span className="px-2" aria-hidden="true">/</span>
        <span>Crypto staking calculator</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Inflation adjusted staking math
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">
          Crypto staking calculator
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Compound a staking reward at the frequency you choose, then net it against supply issuance to see what the
          position did to your share of the network rather than to your token count.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          Rates are prefilled from a build time DeFiLlama pull with base and reward APY kept apart. Every calculation
          runs in your browser.
        </p>
      </header>
      <StakingCalculator pools={pools} snapshotFetchedAt={yields.fetchedAt} scorecardUpdatedAt={updatedAt} scale={scale} />
      <RealYieldSection stats={stats} />
      <IssuanceSection />
      <SplitSection stats={stats} />
      <OverlaySection pools={pools} stats={stats} updatedAt={updatedAt} scale={scale} />
      <CoverageSection rows={coverage} updatedAt={updatedAt} />
      <MathSection />
      <LimitsSection />
      <SourceSection yields={yields} universe={universe} stats={stats} />
      <AuthorAndDisclosures />
    </div>
  );
}
