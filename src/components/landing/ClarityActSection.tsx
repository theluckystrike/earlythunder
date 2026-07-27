import Link from "next/link";
import {
  getClarityMeta,
  getClarityTimeline,
  getClarityReadiness,
  getBackerTotals,
  getClarityCalendar,
} from "@/lib/clarity";
import type { ClarityTimelineEntry } from "@/lib/clarity";
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
interface StatCell {
  readonly value: string;
  readonly label: string;
  readonly sub: string;
}

interface Insight {
  readonly heading: string;
  readonly body: string;
}

/** Builds the four size stats from the cited dataset and the live scorecard. */
function buildStats(): readonly StatCell[] {
  const readiness = getClarityReadiness();
  const totals = getBackerTotals();
  const exposed = readiness.bands.find((b) => b.band === "exposed");
  const clear = readiness.bands.find((b) => b.band === "clear");

  return [
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
      value: exposed ? formatUsdScale(exposed.market_cap_usd) : "-",
      label: "Market cap in the exposed band",
      sub: exposed ? `${exposed.count} tokens scoring below 35` : "",
    },
    {
      value: clear ? String(clear.count) : "-",
      label: "Tokens with a clear path",
      sub: "Out of 251. Bitcoin and ether carry the band",
    },
  ];
}

/** The four investor-facing reads, each tied to a number on the tracker. */
function buildInsights(): readonly Insight[] {
  const totals = getBackerTotals();
  const calendar = getClarityCalendar();

  return [
    {
      heading: "Passage is not uniformly bullish",
      body: `Strip out bitcoin and ether and 32 percent of the altcoin market cap we track sits in the band a written framework would hurt, not help. BNB carries $88.7B of it and TRON another $35.5B. The tokens with the most to gain are the ones that already had the least classification uncertainty.`,
    },
    {
      heading: "The capital behind it is smaller than the headline",
      body: `Coverage puts more than $30 trillion behind the bill. The four largest named backers report ${formatUsdScale(totals.headline_usd)} between them, but that adds discretionary assets under management to custodial client assets to assets under supervision. Only ${formatUsdScale(totals.discretionary_usd)} is money the firms themselves allocate, and only one of the four issued a public statement urging passage.`,
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
}

/**
 * Homepage block for the CLARITY Act tracker.
 * Server Component. Every number is read from the cited dataset or derived
 * from the scorecard, so it moves when the underlying data moves.
 */
export default function ClarityActSection() {
  const meta = getClarityMeta();
  const timeline = getClarityTimeline();
  const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <section className="border-t border-border bg-bg-card/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading meta={meta} />
        {latest && <LatestUpdate entry={latest} />}
        <StatGrid stats={buildStats()} />
        <InsightGrid insights={buildInsights()} />
        <SectionActions />
      </div>
    </section>
  );
}

function SectionHeading({ meta }: { readonly meta: ReturnType<typeof getClarityMeta> }) {
  console.assert(meta && typeof meta.status === "string", "SectionHeading: meta required");
  if (!meta || typeof meta.status !== "string") return null;

  const daysToRecess = daysUntil("2026-08-07");

  return (
    <>
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
      <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tighter text-text-primary md:text-4xl">
        The CLARITY Act is the biggest open catalyst in US crypto, and most of
        the market is reading it backwards
      </h2>
      <p className="mt-4 max-w-2xl text-xl leading-relaxed text-text-secondary">
        {meta.one_liner}
      </p>
    </>
  );
}

function LatestUpdate({ entry }: { readonly entry: ClarityTimelineEntry }) {
  console.assert(entry && typeof entry.date === "string", "LatestUpdate: entry required");
  if (!entry || typeof entry.date !== "string") return null;

  return (
    <div className="mt-8 max-w-3xl rounded-2xl border border-border bg-bg-card p-6">
      <div className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        Latest update, {entry.date}
      </div>
      <div className="mt-2 text-base font-semibold text-text-primary">{entry.title}</div>
      <p className="mt-2.5 text-[1.0625rem] leading-[1.75] text-text-secondary">{entry.detail}</p>
    </div>
  );
}

function StatGrid({ stats }: { readonly stats: readonly StatCell[] }) {
  console.assert(Array.isArray(stats), "StatGrid: stats array required");
  if (!Array.isArray(stats) || stats.length === 0) return null;

  return (
    <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg-card p-6">
          <dd className="text-3xl font-semibold tracking-tighter text-text-primary">{s.value}</dd>
          <dt className="mt-2 text-sm font-medium text-text-secondary">{s.label}</dt>
          <p className="mt-1 text-xs leading-relaxed text-text-tertiary">{s.sub}</p>
        </div>
      ))}
    </dl>
  );
}

function InsightGrid({ insights }: { readonly insights: readonly Insight[] }) {
  console.assert(Array.isArray(insights), "InsightGrid: insights array required");
  if (!Array.isArray(insights) || insights.length === 0) return null;

  return (
    <div className="mt-14 grid gap-10 md:grid-cols-2">
      {insights.map((ins) => (
        <div key={ins.heading}>
          <h3 className="text-lg font-semibold tracking-tight text-text-primary">{ins.heading}</h3>
          <p className="mt-3 max-w-prose text-[1.0625rem] leading-[1.75] text-text-secondary">{ins.body}</p>
        </div>
      ))}
    </div>
  );
}

function SectionActions() {
  return (
    <div className="mt-12 flex flex-wrap items-center gap-4">
      <Link
        href="/clarity-act"
        className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-[0_4px_14px_rgba(245,166,35,0.28)]"
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
  );
}
