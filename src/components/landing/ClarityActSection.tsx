import Link from "next/link";
import {
  getClarityMeta,
  getClarityTimeline,
  getClarityReadiness,
  getBackerTotals,
  getClarityCalendar,
} from "@/lib/clarity";
import { formatUsdScale } from "@/lib/format";

/** Milliseconds in a day, used for the catalyst countdown. */
const MS_PER_DAY = 86_400_000;

/** Days until an ISO date, floored at zero. Null when the date is unusable. */
function daysUntil(iso: string): number | null {
  if (typeof iso !== "string" || iso.length === 0) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / MS_PER_DAY));
}

/**
 * Homepage block for the CLARITY Act tracker.
 * Server Component. Every number is read from the cited dataset or derived
 * from the scorecard, so it moves when the underlying data moves.
 */
export default function ClarityActSection() {
  const meta = getClarityMeta();
  const timeline = getClarityTimeline();
  const readiness = getClarityReadiness();
  const totals = getBackerTotals();
  const calendar = getClarityCalendar();

  const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const exposedBand = readiness.bands.find((b) => b.band === "exposed");
  const clearBand = readiness.bands.find((b) => b.band === "clear");
  const daysToRecess = daysUntil("2026-08-07");

  const stats = [
    {
      value: formatUsdScale(totals.discretionary_usd),
      label: "Discretionary capital backing it",
      sub: `${formatUsdScale(totals.headline_usd)} headline, but only this much is allocated by the firm`,
    },
    {
      value: String(readiness.total_tokens),
      label: "Tokens scored against the bill",
      sub: `Median readiness ${readiness.median} of 100`,
    },
    {
      value: exposedBand ? formatUsdScale(exposedBand.market_cap_usd) : "-",
      label: "Market cap in the exposed band",
      sub: exposedBand ? `${exposedBand.count} tokens scoring below 35` : "",
    },
    {
      value: clearBand ? String(clearBand.count) : "-",
      label: "Tokens with a clear path",
      sub: "Out of 251. Bitcoin and ether carry the band",
    },
  ];

  const insights = [
    {
      heading: "Passage is not uniformly bullish",
      body: `Strip out bitcoin and ether and 32 percent of the altcoin market cap we track sits in the band a written framework would hurt, not help. BNB carries $88.7B of it and TRON another $35.5B. The tokens with the most to gain are the ones that already had the least classification uncertainty.`,
    },
    {
      heading: "The capital behind it is smaller than the headline",
      body: `Coverage puts more than $30 trillion behind the bill. The four largest backers report ${formatUsdScale(totals.headline_usd)} between them, but that adds discretionary assets under management to custodial client assets to assets under supervision. Only ${formatUsdScale(totals.discretionary_usd)} is money the firms themselves allocate.`,
    },
    {
      heading: "The money already arrived without the law",
      body: `Schwab says its clients hold roughly 20 percent of all US crypto ETP assets. Against spot bitcoin and ether ETP totals that works out to about $18B, and Schwab's own stated figure on a 2025 call was closer to $25B. Appetite was never the constraint. The constraint is which products a compliance committee will approve.`,
    },
    {
      heading: "Floor time decides this, not lobbying",
      body: `${calendar.august_window} It returns ${calendar.return_date}, and senators are out for nearly all of October ahead of the November 3 midterms, leaving roughly ${calendar.post_election_days} session days after that. The blocking issue is three gaps in the ethics section, which is political rather than technical, so industry support has almost no purchase on it.`,
    },
  ];

  return (
    <section className="border-t border-border bg-bg-card/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-amber">
            {meta.status}
          </span>
          {daysToRecess !== null && daysToRecess > 0 && (
            <span className="text-xs font-mono text-text-tertiary">
              {daysToRecess} days to the August recess window
            </span>
          )}
        </div>

        <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tighter text-text-primary">
          The CLARITY Act is the biggest open catalyst in US crypto, and most of
          the market is reading it backwards
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-text-secondary">
          {meta.one_liner}
        </p>

        {latest && (
          <div className="mt-8 rounded-lg border border-border bg-bg-card p-5">
            <div className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Latest update, {latest.date}
            </div>
            <div className="mt-2 text-base font-semibold text-text-primary">
              {latest.title}
            </div>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-text-secondary">
              {latest.detail}
            </p>
          </div>
        )}

        <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-bg-card p-5">
              <dd className="text-3xl font-semibold tracking-tighter text-text-primary">
                {s.value}
              </dd>
              <dt className="mt-2 text-sm font-medium text-text-secondary">
                {s.label}
              </dt>
              <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                {s.sub}
              </p>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {insights.map((ins) => (
            <div key={ins.heading}>
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                {ins.heading}
              </h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
                {ins.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/clarity-act"
            className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:bg-amber-hover hover:-translate-y-0.5"
          >
            Open the tracker
          </Link>
          <Link
            href="/clarity-act/clarity-act-token-classification-risk"
            className="text-sm text-text-secondary underline decoration-border underline-offset-4 hover:text-text-primary"
          >
            See which tokens sit in the exposed band
          </Link>
        </div>
      </div>
    </section>
  );
}
