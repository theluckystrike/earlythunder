import type { Metadata } from "next";
import Link from "next/link";
import {
  getClarityMeta,
  getClarityBill,
  getClarityTimeline,
  getClarityBackers,
  getClarityBlockers,
  getClarityProvisions,
  getClarityCalendar,
  getClarityReadiness,
  getBackerTotals,
  getAllClarityTopics,
} from "@/lib/clarity";
import type {
  ClarityTopic,
  ClarityBacker,
  ClarityBlocker,
  ClarityProvision,
  ClarityTimelineEntry,
  ClarityReadiness,
} from "@/lib/clarity";
import { formatUsdScale } from "@/lib/format";
import {
  SITE_NAME,
  SITE_URL,
  AUTHOR_NAME,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  TWITTER_HANDLE,
} from "@/lib/constants";
import {
  getBreadcrumbListSchema,
  getFaqPageSchema,
} from "@/lib/structured-data";

const PAGE_TITLE = "CLARITY Act Tracker, Status and Latest Updates";
const PAGE_DESCRIPTION =
  "Live CLARITY Act tracker with every dated update, the real capital behind the bill, and 251 tokens scored against its 20 percent control test.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "clarity act",
    "clarity act news",
    "clarity act update",
    "clarity act crypto",
    "clarity act 2026",
    "clarity act senate",
    "crypto market structure bill",
    "digital asset market clarity act",
    "hr 3633",
    "clarity act tracker",
  ],
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/clarity-act`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}${OG_IMAGE_PATH}`,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [`${SITE_URL}${OG_IMAGE_PATH}`],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/clarity-act` },
};

const HUB_FAQS = [
  {
    question: "Has the CLARITY Act passed?",
    answer:
      "Not yet. The House passed H.R. 3633 by 294-134 on July 17 2025 and the Senate Banking Committee advanced it 15-9 on May 14 2026. It sits on the Senate Legislative Calendar as Calendar No. 423 with no floor vote scheduled and no cloture motion filed.",
  },
  {
    question: "What does the CLARITY Act do?",
    answer:
      "It gives the CFTC spot market oversight of digital commodities and leaves securities regulation with the SEC. A mature blockchain system is one not controlled by any person or group under common control, and the operational criteria add two separate 20 percent limits. One caps any single person at 20 percent of voting power. The other caps the issuer, related persons and affiliated persons at 20 percent of total units in aggregate, so insider supply is what the rule targets rather than any large holder.",
  },
  {
    question: "Who supports the CLARITY Act?",
    answer:
      "Press coverage names BlackRock, Charles Schwab, Fidelity, Goldman Sachs and Grayscale, and aggregates their assets into a figure above $30 trillion. Two things are wrong with that. The number mixes discretionary assets under management with custodial client assets and assets under supervision, and only Fidelity issued an explicit public statement urging passage. There was no joint endorsement.",
  },
  {
    question: "Was the CLARITY Act the first crypto market structure bill to pass a chamber?",
    answer:
      "No. FIT21, H.R. 4763, passed the House 279-136 on May 22 2024 in the 118th Congress with the same SEC and CFTC split, then died without a Senate floor vote. The CLARITY Act has gone furthest because it also cleared a Senate committee.",
  },
  {
    question: "Which tokens are most exposed if the CLARITY Act passes?",
    answer:
      "Early Thunder scored 251 tokens on the research variables that approximate what the bill measures. Six clear the top band and the median is 45 of 100. Excluding bitcoin and ether, 32 percent of tracked altcoin market cap sits in the most exposed band, led by BNB and TRON.",
  },
];

type Meta = ReturnType<typeof getClarityMeta>;
type Bill = ReturnType<typeof getClarityBill>;
type Calendar = ReturnType<typeof getClarityCalendar>;

/**
 * CLARITY Act hub. Composition only, so each section stays independently
 * reviewable and every function stays under the 60-line ceiling.
 */
export default function ClarityActHubPage() {
  const meta = getClarityMeta();
  const bill = getClarityBill();
  const readiness = getClarityReadiness();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <HubSchemas bill={bill} />
      <HubHeader meta={meta} />
      <BillSnapshot bill={bill} />
      <TopicIndex topics={getAllClarityTopics()} />
      <BackersTable backers={getClarityBackers()} totals={getBackerTotals()} />
      <ReadinessTable readiness={readiness} />
      <BlockersList blockers={getClarityBlockers()} />
      <CalendarBlock calendar={getClarityCalendar()} />
      <TimelineList timeline={getClarityTimeline()} />
      <ProvisionsList provisions={getClarityProvisions()} />
      <HubFaq />
      <HubFooter />
    </div>
  );
}

/** Legislation, FAQ and breadcrumb JSON-LD for the hub. */
function HubSchemas({ bill }: { readonly bill: Bill }) {
  console.assert(bill && typeof bill.house_number === "string", "HubSchemas: bill required");
  if (!bill || typeof bill.house_number !== "string") return null;

  const faqSchema = getFaqPageSchema(HUB_FAQS);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "CLARITY Act", path: "/clarity-act" },
  ]);
  const legislationSchema = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: bill.house_title,
    alternateName: "CLARITY Act",
    legislationIdentifier: bill.house_number,
    legislationJurisdiction: "United States",
    legislationType: "Bill",
    legislationDate: bill.introduced,
    legislationLegalForce: "NotInForce",
    creator: { "@type": "Person", name: bill.sponsor },
    url: `${SITE_URL}/clarity-act`,
    sameAs: bill.sources.map((s) => s.url),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(legislationSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

function HubHeader({ meta }: { readonly meta: Meta }) {
  console.assert(meta && typeof meta.status === "string", "HubHeader: meta required");
  if (!meta || typeof meta.updated_at !== "string") return null;

  return (
    <header>
      <div className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-amber">
        {meta.status}
      </div>
      <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tighter text-text-primary">
        The CLARITY Act tracker
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
        {meta.one_liner}
      </p>
      <p className="mt-4 text-sm text-text-tertiary">
        {AUTHOR_NAME}. Updated {meta.updated_at.slice(0, 10)}. {meta.disclaimer}
      </p>
    </header>
  );
}

function BillSnapshot({ bill }: { readonly bill: Bill }) {
  console.assert(bill && typeof bill.house_vote === "string", "BillSnapshot: bill required");
  if (!bill || typeof bill.house_vote !== "string") return null;

  return (
    <section className="mt-14">
      <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        Bill snapshot
      </h2>
      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <Snapshot label="Bill" value={bill.house_number} />
        <Snapshot label="House vote" value={bill.house_vote} />
        <Snapshot label="Senate committee" value={bill.senate_committee_vote} />
        <Snapshot label="Votes needed" value={String(bill.votes_needed)} />
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-text-tertiary">
        {bill.house_title}. Introduced {bill.introduced} by {bill.sponsor}. House
        passage {bill.house_passed}, {bill.house_vote_detail} Senate Banking
        reported it {bill.senate_committee_date} and it now sits at{" "}
        {bill.senate_calendar_number}. Any final text also has to be reconciled
        with {bill.companion_bill}. {bill.votes_needed_note}{" "}
        {bill.precedent_note}
      </p>
    </section>
  );
}

function TopicIndex({ topics }: { readonly topics: readonly ClarityTopic[] }) {
  console.assert(Array.isArray(topics), "TopicIndex: topics array required");
  if (!Array.isArray(topics) || topics.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        The analysis
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/clarity-act/${t.slug}`}
              className="group block h-full rounded-lg border border-border bg-bg-card p-5 transition-colors hover:border-amber/50"
            >
              <span className="block text-base font-semibold leading-snug text-text-primary group-hover:text-amber">
                {t.h1}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-text-tertiary">
                {t.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BackersTable({
  backers,
  totals,
}: {
  readonly backers: readonly ClarityBacker[];
  readonly totals: { readonly headline_usd: number; readonly discretionary_usd: number };
}) {
  console.assert(Array.isArray(backers), "BackersTable: backers array required");
  if (!Array.isArray(backers) || backers.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Who is backing it, and what their numbers measure
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
        The four largest named backers report {formatUsdScale(totals.headline_usd)}{" "}
        between them. Only {formatUsdScale(totals.discretionary_usd)} of that is
        discretionary, meaning capital the firm itself allocates. The rest is
        custody and supervision, which is a different thing and rarely labelled
        as such in coverage. Only one of the four issued an explicit public
        statement urging passage.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-text-tertiary">
              <th className="py-3 pr-4 font-medium">Firm</th>
              <th className="py-3 pr-4 font-medium">Figure</th>
              <th className="py-3 pr-4 font-medium">What it measures</th>
              <th className="py-3 pr-4 font-medium">How strong the support is</th>
              <th className="py-3 font-medium">As of</th>
            </tr>
          </thead>
          <tbody>
            {backers.map((b) => (
              <tr key={b.firm} className="border-b border-border/60 align-top">
                <td className="py-4 pr-4 font-semibold text-text-primary">{b.firm}</td>
                <td className="py-4 pr-4 font-mono text-text-primary">{b.headline_label}</td>
                <td className="py-4 pr-4 text-text-secondary">
                  {b.what_it_measures}
                  {!b.discretionary && (
                    <span className="mt-1 block text-xs text-text-tertiary">Not discretionary</span>
                  )}
                </td>
                <td className="py-4 pr-4 text-text-secondary">{b.support_strength ?? "-"}</td>
                <td className="py-4 font-mono text-text-tertiary">{b.as_of}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/clarity-act/who-supports-the-clarity-act"
        className="mt-5 inline-block text-sm text-amber hover:underline"
      >
        Full breakdown of the $30 trillion claim
      </Link>
    </section>
  );
}

function ReadinessTable({ readiness }: { readonly readiness: ClarityReadiness }) {
  console.assert(readiness && Array.isArray(readiness.bands), "ReadinessTable: readiness required");
  if (!readiness || !Array.isArray(readiness.bands) || readiness.bands.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        {readiness.total_tokens} tokens scored against the bill
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
        Early Thunder scores every token on its scorecard for regulatory safety,
        holder concentration, and institutional adoption. Those three variables
        approximate what the bill measures, so we combined them into a readiness
        score out of 100. The median across {readiness.total_tokens} tokens is{" "}
        {readiness.median}, which is a weaker distribution than the market
        narrative implies. Treat it as our own heuristic, not a legal opinion.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-text-tertiary">
              <th className="py-3 pr-4 font-medium">Band</th>
              <th className="py-3 pr-4 font-medium">Score</th>
              <th className="py-3 pr-4 font-medium">Tokens</th>
              <th className="py-3 font-medium">Market cap</th>
            </tr>
          </thead>
          <tbody>
            {readiness.bands.map((band) => (
              <tr key={band.band} className="border-b border-border/60">
                <td className="py-3 pr-4 font-semibold text-text-primary">{band.label}</td>
                <td className="py-3 pr-4 font-mono text-text-tertiary">{band.range}</td>
                <td className="py-3 pr-4 font-mono text-text-primary">{band.count}</td>
                <td className="py-3 font-mono text-text-primary">{formatUsdScale(band.market_cap_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/clarity-act/clarity-act-token-classification-risk"
        className="mt-5 inline-block text-sm text-amber hover:underline"
      >
        Which tokens sit in the exposed band
      </Link>
    </section>
  );
}

function BlockersList({ blockers }: { readonly blockers: readonly ClarityBlocker[] }) {
  console.assert(Array.isArray(blockers), "BlockersList: blockers array required");
  if (!Array.isArray(blockers) || blockers.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        What is blocking it
      </h2>
      <div className="mt-6 space-y-6">
        {blockers.map((b) => (
          <div key={b.id} className="rounded-lg border border-border bg-bg-card p-5">
            <h3 className="text-base font-semibold text-text-primary">{b.title}</h3>
            <p className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">{b.detail}</p>
            <p className="mt-3 text-xs font-mono text-text-tertiary">{b.who}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalendarBlock({ calendar }: { readonly calendar: Calendar }) {
  console.assert(calendar && typeof calendar.return_date === "string", "CalendarBlock: calendar required");
  if (!calendar || typeof calendar.return_date !== "string") return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        The floor-time problem
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
        {calendar.august_window} It returns {calendar.return_date}.{" "}
        {calendar.october} Election Day is {calendar.election_day}.{" "}
        {calendar.post_election_detail} {calendar.note}
      </p>
      <Link
        href="/clarity-act/clarity-act-passage-odds"
        className="mt-4 inline-block text-sm text-amber hover:underline"
      >
        The full calendar arithmetic
      </Link>
    </section>
  );
}

function TimelineList({ timeline }: { readonly timeline: readonly ClarityTimelineEntry[] }) {
  console.assert(Array.isArray(timeline), "TimelineList: timeline array required");
  if (!Array.isArray(timeline) || timeline.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Timeline</h2>
      <ol className="mt-6 space-y-7 border-l border-border pl-6">
        {timeline.map((entry) => (
          <li key={`${entry.date}-${entry.title}`} className="relative">
            <span className="absolute -left-[1.6875rem] top-1.5 h-2 w-2 rounded-full bg-amber" />
            <time className="text-xs font-mono text-text-tertiary">{entry.date}</time>
            <h3 className="mt-1 text-base font-semibold text-text-primary">{entry.title}</h3>
            <p className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">{entry.detail}</p>
            <a
              href={entry.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-amber/80 hover:text-amber hover:underline"
            >
              Source
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProvisionsList({ provisions }: { readonly provisions: readonly ClarityProvision[] }) {
  console.assert(Array.isArray(provisions), "ProvisionsList: provisions array required");
  if (!Array.isArray(provisions) || provisions.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        The definitions that decide everything
      </h2>
      <dl className="mt-6 space-y-6">
        {provisions.map((p) => (
          <div key={p.id}>
            <dt className="text-base font-semibold text-text-primary">{p.title}</dt>
            {p.document && (
              <div className="mt-1 text-xs font-mono text-text-tertiary">{p.document}</div>
            )}
            <dd className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
              {p.plain_english} {p.why_it_matters}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HubFaq() {
  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Common questions
      </h2>
      <dl className="mt-6 space-y-7">
        {HUB_FAQS.map((faq) => (
          <div key={faq.question}>
            <dt className="text-base font-semibold text-text-primary">{faq.question}</dt>
            <dd className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HubFooter() {
  return (
    <div className="mt-16 border-t border-border pt-8 text-center">
      <p className="text-sm text-text-tertiary">
        Every figure on this page carries a primary source. Research and
        analysis, not investment or legal advice.
      </p>
      <Link
        href="/deadlines"
        className="mt-4 inline-block rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:bg-amber-hover hover:-translate-y-0.5"
      >
        See every catalyst deadline
      </Link>
    </div>
  );
}

function Snapshot({ label, value }: { readonly label: string; readonly value: string }) {
  console.assert(typeof label === "string" && label.length > 0, "Snapshot: label required");
  if (typeof label !== "string" || typeof value !== "string") return null;

  return (
    <div className="bg-bg-card p-4">
      <dt className="text-xs font-mono uppercase tracking-wider text-text-tertiary">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{value}</dd>
    </div>
  );
}
