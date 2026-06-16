import type { Metadata } from "next";
import Link from "next/link";
import scorecardData from "../../../data/altcoin-scorecard.json";
import opportunitiesData from "../../../data/opportunities.json";

/* Map scorecard symbols → opportunity slugs using ticker field */
const SYMBOL_TO_SLUG: Record<string, string> = {};
for (const opp of opportunitiesData as { ticker?: string | null; slug: string }[]) {
  const sym = opp.ticker?.replace("$", "");
  if (sym) SYMBOL_TO_SLUG[sym] = opp.slug;
}

const BUY_LIST = new Set(["BTC", "ETH", "GEOD", "UNI", "LINK", "HYPE"]);

export const metadata: Metadata = {
  title: "Altcoin Hold/Reduce/Sell Scorecard",
  description:
    "25-variable framework scoring 250 altcoins across revenue, tokenomics, supply metrics, institutional adoption, regulatory safety, and more. 40+ parallel research agents. CoinGecko supply data. Updated May 26, 2026.",
};

const VARIABLE_LABELS: Record<string, string> = {
  protocol_revenue: "Protocol Revenue",
  revenue_trend: "Revenue Trend",
  ps_multiple: "P/S Multiple",
  supply_inflation: "Supply Inflation",
  unlock_schedule: "unlock schedule",
  circ_fdv_ratio: "Circ/FDV Ratio",
  buyback_burn: "Buyback/Burn",
  smart_money: "Smart Money Flows",
  insider_selling: "Insider Selling",
  holder_concentration: "Holder Concentration",
  staking_yield: "Staking Yield (Real)",
  tvl_trend: "TVL Trend",
  active_users: "Active Users/DAU",
  developer_activity: "Developer Activity",
  ecosystem_growth: "system Growth",
  market_share: "Market Share",
  competitive_moat: "Competitive Moat",
  institutional_adoption: "Institutional Adoption",
  exchange_depth: "Exchange Depth",
  regulatory_safety: "Regulatory Safety",
  catalyst_calendar: "Catalyst Calendar",
  btc_alpha: "BTC Alpha Potential",
  team_execution: "Team Execution",
  treasury_runway: "Treasury/Runway",
  social_mindshare: "Social Mindshare",
};

function scoreColor(score: number): string {
  if (score >= 7) return "text-positive";
  if (score >= 4) return "text-warning";
  return "text-negative";
}

function verdictBadge(verdict: string, color: string) {
  const classes: Record<string, string> = {
    green: "bg-positive-bg text-positive border-positive/30",
    yellow: "bg-warning-bg text-warning border-warning/30",
    orange: "bg-warning-bg text-warning border-warning/40",
    red: "bg-negative-bg text-negative border-negative/30",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-mono font-semibold border ${classes[color] ?? classes.yellow}`}
    >
      {verdict}
    </span>
  );
}

function changeColor(change: number): string {
  return change >= 0 ? "text-positive" : "text-negative";
}

function fmtSupply(n: number | null | undefined): string {
  if (n == null || n === 0) return "-";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || n === 0) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function circColor(circ: number | null | undefined, total: number | null | undefined): string {
  if (!circ || !total || total === 0) return "text-text-tertiary";
  const pct = (circ / total) * 100;
  if (pct >= 90) return "text-positive";
  if (pct >= 60) return "text-warning";
  if (pct >= 30) return "text-warning";
  return "text-negative";
}

function dilColor(mcap: number | null | undefined, fdv: number | null | undefined): string {
  if (!mcap || !fdv || mcap === 0) return "text-text-tertiary";
  const x = fdv / mcap;
  if (x <= 1.1) return "text-positive";
  if (x <= 2) return "text-warning";
  if (x <= 5) return "text-warning";
  return "text-negative";
}

export default function ScorecardPage() {
  const { tokens, benchmark, updated_at } = scorecardData;
  const sorted = [...tokens].sort((a, b) => b.score - a.score);
  const variableKeys = Object.keys(VARIABLE_LABELS);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      {/* Header */}
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Altcoin Scorecard
      </h1>
      <p className="mt-3 text-lg text-text-secondary">
        25-variable Hold/Reduce/Sell framework, 250 tokens, 40+
        parallel research agents
      </p>
      <p className="mt-1 text-sm text-text-tertiary font-mono">
        BTC benchmark: ${benchmark.price.toLocaleString()} ({benchmark.change_24h}%)
        &middot; Updated {new Date(updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      {/* Rankings */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          Final Rankings
        </h2>
        <p className="mb-4 text-xs text-text-tertiary lg:hidden">
          Tap a card for the full breakdown. Catalyst and risk shown on every screen.
        </p>

        {/* Desktop / tablet table (lg and up). Scrolls horizontally if needed. */}
        <div className="hidden overflow-x-auto rounded-2xl border border-border lg:block">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">Token</th>
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">Score</th>
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">Verdict</th>
                <th className="px-3 py-3 text-right text-xs text-text-tertiary uppercase tracking-wider">Price</th>
                <th className="px-3 py-3 text-right text-xs text-text-tertiary uppercase tracking-wider">MCap</th>
                <th className="px-3 py-3 text-right text-xs text-text-tertiary uppercase tracking-wider hidden 2xl:table-cell">FDV</th>
                <th className="px-3 py-3 text-right text-xs text-text-tertiary uppercase tracking-wider hidden 2xl:table-cell">Circ</th>
                <th className="px-3 py-3 text-right text-xs text-text-tertiary uppercase tracking-wider hidden 2xl:table-cell">Total</th>
                <th className="px-3 py-3 text-center text-xs text-text-tertiary uppercase tracking-wider hidden 2xl:table-cell">Max</th>
                <th className="px-3 py-3 text-center text-xs text-text-tertiary uppercase tracking-wider">Circ%</th>
                <th className="px-3 py-3 text-center text-xs text-text-tertiary uppercase tracking-wider">Dil.</th>
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">Catalyst</th>
                <th className="px-3 py-3 text-left text-xs text-text-tertiary uppercase tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((token, i) => {
                const t = token as Record<string, unknown>;
                const circS = t.circulating_supply as number | null;
                const totalS = t.total_supply as number | null;
                const maxS = t.max_supply as number | null;
                const fdvVal = (t.fdv as number | null) ?? (t.fully_diluted_valuation as number | null);
                const circPct = circS && totalS && totalS > 0 ? (circS / totalS) * 100 : null;
                const dilX = token.market_cap && fdvVal && token.market_cap > 0 ? fdvVal / token.market_cap : null;
                return (
                <tr key={token.symbol} className="border-b border-border/50 hover:bg-bg-card/50 transition-colors align-top">
                  <td className="px-3 py-2.5 text-text-tertiary">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      {SYMBOL_TO_SLUG[token.symbol] ? (
                        <Link
                          href={`/opportunities/${SYMBOL_TO_SLUG[token.symbol]}`}
                          className="text-info hover:text-info/80 hover:underline"
                        >
                          {token.symbol}
                        </Link>
                      ) : (
                        token.symbol
                      )}
                      {BUY_LIST.has(token.symbol) && (
                        <span className="inline-block rounded px-1 py-px text-[9px] font-bold bg-positive-bg text-positive border border-positive/30 leading-tight">
                          BUY
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold ${scoreColor(token.score / 10)}`}>{token.score}</span>
                  </td>
                  <td className="px-3 py-2.5">{verdictBadge(token.verdict, token.verdict_color)}</td>
                  <td className="px-3 py-2.5 text-right text-text-primary whitespace-nowrap">
                    ${token.price < 10 ? token.price.toFixed(2) : token.price.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary whitespace-nowrap">{fmtUsd(token.market_cap)}</td>
                  <td className="px-3 py-2.5 text-right text-text-tertiary hidden 2xl:table-cell">{fmtUsd(fdvVal)}</td>
                  <td className="px-3 py-2.5 text-right text-text-secondary hidden 2xl:table-cell">{fmtSupply(circS)}</td>
                  <td className="px-3 py-2.5 text-right text-text-tertiary hidden 2xl:table-cell">{fmtSupply(totalS)}</td>
                  <td className="px-3 py-2.5 text-center text-text-tertiary hidden 2xl:table-cell">{maxS == null ? "\u221E" : fmtSupply(maxS)}</td>
                  <td className={`px-3 py-2.5 text-center font-semibold ${circColor(circS, totalS)}`}>
                    {circPct != null ? `${circPct.toFixed(0)}%` : "-"}
                  </td>
                  <td className={`px-3 py-2.5 text-center ${dilColor(token.market_cap, fdvVal)}`}>
                    {dilX != null ? `${dilX.toFixed(1)}x` : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary text-xs min-w-[180px] max-w-[280px] whitespace-normal leading-snug">{token.key_catalyst}</td>
                  <td className="px-3 py-2.5 text-text-secondary text-xs min-w-[180px] max-w-[280px] whitespace-normal leading-snug">{token.key_risk}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile / small-screen ranked cards (below lg). Risk is always visible. */}
        <ol className="space-y-3 lg:hidden">
          {sorted.map((token, i) => {
            const t = token as Record<string, unknown>;
            const circS = t.circulating_supply as number | null;
            const totalS = t.total_supply as number | null;
            const circPct = circS && totalS && totalS > 0 ? (circS / totalS) * 100 : null;
            return (
              <li
                key={token.symbol}
                className="rounded-xl border border-border bg-bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-text-tertiary text-xs">{i + 1}</span>
                    {SYMBOL_TO_SLUG[token.symbol] ? (
                      <Link
                        href={`/opportunities/${SYMBOL_TO_SLUG[token.symbol]}`}
                        className="font-semibold text-info hover:underline"
                      >
                        {token.symbol}
                      </Link>
                    ) : (
                      <span className="font-semibold text-text-primary">{token.symbol}</span>
                    )}
                    {BUY_LIST.has(token.symbol) && (
                      <span className="inline-block rounded px-1 py-px text-[9px] font-bold bg-positive-bg text-positive border border-positive/30 leading-tight">
                        BUY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={`font-bold ${scoreColor(token.score / 10)}`}>{token.score}</span>
                    {verdictBadge(token.verdict, token.verdict_color)}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <div className="text-text-tertiary">Price</div>
                    <div className="text-text-primary">
                      ${token.price < 10 ? token.price.toFixed(2) : token.price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">MCap</div>
                    <div className="text-text-primary">{fmtUsd(token.market_cap)}</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Circ%</div>
                    <div className={`font-semibold ${circColor(circS, totalS)}`}>
                      {circPct != null ? `${circPct.toFixed(0)}%` : "-"}
                    </div>
                  </div>
                </div>
                {token.key_catalyst && (
                  <p className="mt-3 text-xs leading-snug text-text-secondary">
                    <span className="font-mono uppercase tracking-wider text-[10px] text-positive">Catalyst</span>{" "}
                    {token.key_catalyst}
                  </p>
                )}
                {token.key_risk && (
                  <p className="mt-1.5 text-xs leading-snug text-text-secondary">
                    <span className="font-mono uppercase tracking-wider text-[10px] text-negative">Risk</span>{" "}
                    {token.key_risk}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Token Cards */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Token Verdicts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((token) => (
            <div
              key={token.symbol}
              className="rounded-2xl border border-border bg-bg-card p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-text-primary">{token.symbol}</span>
                  <span className="text-sm text-text-tertiary">{token.name}</span>
                  {BUY_LIST.has(token.symbol) && (
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-positive-bg text-positive border border-positive/30">
                      BUY LIST
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-lg ${scoreColor(token.score / 10)}`}>
                    {token.score}
                  </span>
                  {verdictBadge(token.verdict, token.verdict_color)}
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3">{token.one_liner}</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-text-tertiary">Price</span>
                  <div className="text-text-primary">
                    ${token.price < 10 ? token.price.toFixed(2) : token.price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-text-tertiary">MCap</span>
                  <div className="text-text-primary">
                    ${(token.market_cap / 1e9).toFixed(1)}B
                  </div>
                </div>
                <div>
                  <span className="text-text-tertiary">Circ %</span>
                  <div className="text-text-primary">{token.circ_supply_pct}%</div>
                </div>
              </div>
              {token.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Citations</p>
                  {token.citations.map((c: { source: string; claim: string; url?: string }, ci: number) => (
                    <p key={ci} className="text-[11px] text-text-tertiary leading-tight">
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-info/70 hover:text-info hover:underline"
                        >
                          [{c.source}]
                        </a>
                      ) : (
                        <span>[{c.source}]</span>
                      )}{" "}
                      {c.claim}
                    </p>
                  ))}
                </div>
              )}
              {SYMBOL_TO_SLUG[token.symbol] && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Link
                    href={`/opportunities/${SYMBOL_TO_SLUG[token.symbol]}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      BUY_LIST.has(token.symbol)
                        ? "bg-positive-bg text-positive border-positive/30 hover:bg-positive/20"
                        : "bg-[rgba(59,130,246,0.10)] text-info border-info/30 hover:bg-info/20"
                    }`}
                  >
                    View analysis <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Verification Sprint Summary */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          13-Agent Verification Sprint
        </h2>
        <p className="text-sm text-text-tertiary mb-4">
          Every score was challenged by skeptical verification agents running 50+ sub-queries. Key corrections applied:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "PENDLE -12", color: "red", detail: "Revenue collapsed 88% ($34M\u2192$6.6M). P/S 9x\u219247x." },
            { label: "SYRUP -12", color: "red", detail: "$100M ARR is a projection, not achieved. Circ% was 65%\u219298%." },
            { label: "LINK -9", color: "red", detail: "Oracle share inflated: 63-70% not 83.7%. Three 10/10s indefensible." },
            { label: "LQTY -7", color: "red", detail: "V2 is a RE-deployment after Jan 2025 bug. BOLD <0.01% share." },
            { label: "GEOD -5", color: "red", detail: "Q2 revenue DECLINED -29% QoQ. ARR ~$5M not $10.5M." },
            { label: "GMX -4", color: "red", detail: "Protocol revenue $14M, not $42M (3x overstatement)." },
            { label: "CRV +7", color: "green", detail: "Revenue growing. ATH distance -96%, not -99.6%." },
            { label: "ONDO +6", color: "green", detail: "Fee switch imminent H2. SEC probe CLOSED. Real partnerships." },
            { label: "JUP +5", color: "green", detail: "Securitize equities LIVE. system growth accelerating." },
            { label: "NEAR +5", color: "green", detail: "P/S is 32-38x, not 290x. AI chain abstraction thesis intact." },
            { label: "ENA +5", color: "green", detail: "Smart money entering. Institutional adoption improving." },
            { label: "KMNO +1", color: "green", detail: "Revenue understated ($8.7M\u2192$17M). V2 already live." },
          ].map((item, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 text-xs font-mono ${
                item.color === "red"
                  ? "border-negative/30 bg-negative-bg"
                  : "border-positive/30 bg-positive-bg"
              }`}
            >
              <span className={item.color === "red" ? "text-negative font-bold" : "text-positive font-bold"}>
                {item.label}
              </span>
              <span className="text-text-tertiary ml-2">{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 25-Variable Heatmap */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          25-Variable Heatmap
        </h2>
        <p className="text-sm text-text-tertiary mb-4">
          Each variable scored 1-10. Green {"\u2265"}7 | Yellow 4-6 | Red {"\u2264"}3
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="px-3 py-2 text-left text-text-tertiary uppercase tracking-wider">#</th>
                <th className="px-3 py-2 text-left text-text-tertiary uppercase tracking-wider min-w-[140px]">Variable</th>
                {sorted.map((t) => (
                  <th key={t.symbol} className="px-3 py-2 text-center text-text-tertiary uppercase tracking-wider">
                    {t.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variableKeys.map((key, idx) => (
                <tr key={key} className="border-b border-border/30 hover:bg-bg-card/50">
                  <td className="px-3 py-1.5 text-text-tertiary">{idx + 1}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{VARIABLE_LABELS[key]}</td>
                  {sorted.map((t) => {
                    const val = (t.scores as Record<string, number>)[key] ?? 0;
                    return (
                      <td key={t.symbol} className={`px-3 py-1.5 text-center font-semibold ${scoreColor(val)}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-border font-bold">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-text-primary">TOTAL</td>
                {sorted.map((t) => {
                  const total = Object.values(t.scores as Record<string, number>).reduce((a, b) => a + b, 0);
                  return (
                    <td key={t.symbol} className={`px-3 py-2 text-center ${scoreColor(t.score / 10)}`}>
                      {total}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Raw Supply Data */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Raw Supply Data
        </h2>
        <p className="text-sm text-text-tertiary mb-4">
          Max supply, total supply, circulating supply, FDV, and where to buy. Links to CoinMarketCap.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="px-3 py-2 text-left text-text-tertiary uppercase tracking-wider">Token</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">Max Supply</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">Total Supply</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">Circulating</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">Circ %</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">MCap</th>
                <th className="px-3 py-2 text-right text-text-tertiary uppercase tracking-wider">FDV</th>
                <th className="px-3 py-2 text-left text-text-tertiary uppercase tracking-wider">Where to Buy</th>
                <th className="px-3 py-2 text-center text-text-tertiary uppercase tracking-wider">CMC</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((token) => {
                const t = token as Record<string, unknown>;
                const maxS = t.max_supply as number | null;
                const totalS = t.total_supply as number | null;
                const circS = t.circulating_supply as number | null;
                const fdvVal = t.fdv as number | null;
                const wtb = (t.where_to_buy as string[] | undefined) ?? [];
                const slug = t.cmc_slug as string | undefined;
                const fmt = (n: number | null) => {
                  if (n == null) return "\u221E";
                  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
                  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
                  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
                  return n.toLocaleString();
                };
                const fmtUsd = (n: number | null) => {
                  if (n == null) return "-";
                  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
                  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
                  return `$${n.toLocaleString()}`;
                };
                return (
                  <tr key={token.symbol} className="border-b border-border/30 hover:bg-bg-card/50">
                    <td className="px-3 py-2 font-semibold text-text-primary">{token.symbol}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{fmt(maxS)}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{fmt(totalS)}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{fmt(circS)}</td>
                    <td className="px-3 py-2 text-right text-text-primary">{token.circ_supply_pct}%</td>
                    <td className="px-3 py-2 text-right text-text-primary">{fmtUsd(token.market_cap)}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{fmtUsd(fdvVal)}</td>
                    <td className="px-3 py-2 text-text-secondary">{wtb.join(", ")}</td>
                    <td className="px-3 py-2 text-center">
                      {slug ? (
                        <a
                          href={`https://coinmarketcap.com/currencies/${slug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-info hover:text-info/80 underline"
                        >
                          CMC
                        </a>
                      ) : (
                        <span className="text-text-tertiary">,</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Methodology */}
      <section className="mt-12 border-t border-border pt-8">
        <h3 className="text-sm font-mono uppercase tracking-wider text-text-tertiary mb-3">
          Methodology
        </h3>
        <p className="text-sm text-text-secondary max-w-3xl">
          {scorecardData.methodology}
        </p>
      </section>
    </div>
  );
}
