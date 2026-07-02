import type { Metadata } from "next";
import Link from "next/link";
import deadlinesData from "../../../data/deadlines.json";
import { formatDate } from "@/lib/format";
import { getBreadcrumbListSchema } from "@/lib/structured-data";

/* ─── Types ─── */

interface Deadline {
  readonly protocol: string;
  readonly event: string;
  readonly end_date: string | null;
  readonly estimated_end: string | null;
  readonly urgency: string;
  readonly status: string;
  readonly note?: string;
  readonly source?: string;
  readonly is_estimated?: boolean;
}

const DEADLINES = deadlinesData as readonly Deadline[];

export const metadata: Metadata = {
  title: "Crypto Deadline Tracker 2026: Token Unlocks, ETF Rulings, Mainnet Launches",
  description:
    "Live countdown tracker for the crypto deadlines that move markets: token unlocks, SEC ETF decisions, mainnet upgrades, governance votes, and the MiCA regulation deadline. Sorted by date, with sources.",
  keywords: [
    "crypto deadlines 2026",
    "token unlock schedule",
    "crypto ETF decision dates",
    "MiCA deadline",
    "mainnet launch calendar",
    "crypto catalyst calendar",
    "upcoming token unlocks",
  ],
  alternates: { canonical: "/deadlines" },
  openGraph: {
    type: "website",
    title: "Crypto Deadline Tracker 2026: Unlocks, ETF Rulings, Mainnet Launches",
    description:
      "Live countdown to the crypto deadlines that move markets, sorted by date with sources.",
    url: "/deadlines",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Deadline Tracker 2026",
    description:
      "Token unlocks, ETF rulings, mainnet launches, and the MiCA deadline. Sorted by date.",
  },
};

/* ─── Date helpers (computed at build time) ─── */

const DAY_MS = 86_400_000;

function effectiveDate(d: Deadline): string | null {
  return d.end_date ?? d.estimated_end ?? null;
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / DAY_MS));
}

function sortByDate(list: readonly Deadline[]): Deadline[] {
  return [...list].sort((a, b) => {
    const da = new Date(effectiveDate(a) ?? "2100-01-01").getTime();
    const db = new Date(effectiveDate(b) ?? "2100-01-01").getTime();
    return da - db;
  });
}

/* ─── Urgency styling ─── */

function urgencyClasses(urgency: string): string {
  switch (urgency) {
    case "CRITICAL":
      return "border-negative/40 bg-negative-bg text-negative";
    case "HIGH":
      return "border-warning/40 bg-warning-bg text-warning";
    default:
      return "border-border bg-bg-card text-text-secondary";
  }
}

function daysColor(n: number | null): string {
  if (n === null) return "text-text-tertiary";
  if (n <= 3) return "text-negative";
  if (n <= 14) return "text-warning";
  return "text-text-primary";
}

/* ─── Page ─── */

export default function DeadlinesPage() {
  const upcoming = sortByDate(DEADLINES.filter((d) => d.status !== "ENDED"));
  const next = upcoming[0];
  const nextDays = next ? daysLeft(effectiveDate(next)) : null;

  const breadcrumb = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Deadlines", path: "/deadlines" },
  ]);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Crypto Deadline Tracker 2026",
    numberOfItems: upcoming.length,
    itemListElement: upcoming.slice(0, 30).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${d.protocol}: ${d.event}`,
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <nav className="font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        {" / "}
        <span className="text-text-secondary">Deadlines</span>
      </nav>

      <h1 className="mt-6 text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Crypto Deadline Tracker
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
        The dates that move markets, in one place. Token unlocks, SEC ETF
        decisions, mainnet upgrades, governance votes, and regulation deadlines.
        Sorted soonest first, each with a source. {upcoming.length} active
        countdowns.
      </p>

      {next && (
        <div className={`mt-8 rounded-xl border p-5 ${urgencyClasses(next.urgency)}`}>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">
            Next up
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-semibold">{next.protocol}</span>
            <span className="text-sm opacity-90">{next.event}</span>
          </div>
          <div className="mt-2 font-mono text-sm">
            {nextDays} days left {" "}
            <span className="opacity-70">
              ({formatDate(effectiveDate(next) ?? "")}{next.is_estimated ? ", estimated" : ""})
            </span>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-3">
        {upcoming.map((d) => {
          const dl = daysLeft(effectiveDate(d));
          const dateStr = effectiveDate(d);
          return (
            <div
              key={`${d.protocol}-${d.event}`}
              className="rounded-xl border border-border bg-bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-text-primary">{d.protocol}</span>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${urgencyClasses(d.urgency)}`}
                    >
                      {d.urgency}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{d.event}</p>
                  {d.note && (
                    <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{d.note}</p>
                  )}
                  {d.source && (
                    <a
                      href={d.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-mono text-xs text-text-secondary underline hover:text-text-primary"
                    >
                      Source
                    </a>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className={`font-mono text-2xl font-semibold ${daysColor(dl)}`}>
                    {dl ?? "-"}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
                    days left
                  </div>
                  <div className="mt-1 font-mono text-xs text-text-secondary">
                    {dateStr ? formatDate(dateStr) : "TBD"}
                    {d.is_estimated ? " (est)" : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-text-tertiary">
        Token unlock USD values are approximate and move with price. Dates marked
        estimated are inferred from regulatory timelines and may shift. This is
        research, not investment advice. {" "}
        <Link href="/disclaimer" className="underline hover:text-text-secondary">Full disclaimer</Link>.
      </p>
    </div>
  );
}
