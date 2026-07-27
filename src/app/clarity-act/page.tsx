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

const PAGE_TITLE = "CLARITY Act Tracker";
const PAGE_DESCRIPTION =
  "Live tracker for the Digital Asset Market Clarity Act. Dated timeline, who is backing it and what their AUM figures really measure, and 251 tokens scored against the bill's control test.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "clarity act",
    "clarity act tracker",
    "digital asset market clarity act",
    "crypto market structure bill",
    "h.r. 3633",
    "sec cftc crypto jurisdiction",
    "clarity act senate vote",
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
      "It splits US digital asset oversight between the CFTC and the SEC. Assets tied to a mature blockchain system become digital commodities under CFTC jurisdiction. Everything else stays with the SEC. A system counts as mature when it is functional, open source, rule-based, and not controlled by any person or group holding 20 percent or more of the tokens.",
  },
  {
    question: "Who supports the CLARITY Act?",
    answer:
      "BlackRock, Charles Schwab, Fidelity, Goldman Sachs, and Grayscale are among the firms backing it. Press coverage aggregates their assets into a figure above $30 trillion, but that number mixes discretionary assets under management with custodial client assets and assets under supervision.",
  },
  {
    question: "Which tokens are most exposed if the CLARITY Act passes?",
    answer:
      "Early Thunder scored 251 tokens against the bill's control and regulatory tests. Six clear the top band. Excluding bitcoin and ether, 32 percent of tracked altcoin market cap sits in the most exposed band, led by BNB and TRON.",
  },
];

export default function ClarityActHubPage() {
  const meta = getClarityMeta();
  const bill = getClarityBill();
  const timeline = getClarityTimeline();
  const backers = getClarityBackers();
  const blockers = getClarityBlockers();
  const provisions = getClarityProvisions();
  const calendar = getClarityCalendar();
  const readiness = getClarityReadiness();
  const totals = getBackerTotals();
  const topics = getAllClarityTopics();

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
    <div className="mx-auto max-w-4xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legislationSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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

      {/* Bill vitals */}
      <section className="mt-14">
        <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
          Bill vitals
        </h2>
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          <Vital label="Bill" value={bill.house_number} />
          <Vital label="House vote" value={bill.house_vote} />
          <Vital label="Senate committee" value={bill.senate_committee_vote} />
          <Vital label="Votes needed" value={String(bill.votes_needed)} />
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-text-tertiary">
          {bill.house_title}. Introduced {bill.introduced} by {bill.sponsor}.
          House passage {bill.house_passed}, {bill.house_vote_detail} Senate
          Banking reported it {bill.senate_committee_date} and it now sits at{" "}
          {bill.senate_calendar_number}. Any final text also has to be reconciled
          with {bill.companion_bill}.
        </p>
      </section>

      {/* Long-tail topic index */}
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

      {/* Who is backing it */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Who is backing it, and what their numbers measure
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
          The four largest backers report {formatUsdScale(totals.headline_usd)}{" "}
          between them. Only {formatUsdScale(totals.discretionary_usd)} of that
          is discretionary, meaning capital the firm itself allocates. The rest
          is custody and supervision, which is a different thing and rarely
          labelled as such in coverage.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-mono uppercase tracking-wider text-text-tertiary">
                <th className="py-3 pr-4 font-medium">Firm</th>
                <th className="py-3 pr-4 font-medium">Figure</th>
                <th className="py-3 pr-4 font-medium">What it measures</th>
                <th className="py-3 font-medium">As of</th>
              </tr>
            </thead>
            <tbody>
              {backers.map((b) => (
                <tr key={b.firm} className="border-b border-border/60 align-top">
                  <td className="py-4 pr-4 font-semibold text-text-primary">
                    {b.firm}
                  </td>
                  <td className="py-4 pr-4 font-mono text-text-primary">
                    {b.headline_label}
                  </td>
                  <td className="py-4 pr-4 text-text-secondary">
                    {b.what_it_measures}
                    {!b.discretionary && (
                      <span className="mt-1 block text-xs text-text-tertiary">
                        Not discretionary
                      </span>
                    )}
                  </td>
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

      {/* Classification readiness */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          {readiness.total_tokens} tokens scored against the bill
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
          Early Thunder scores every token on its scorecard for regulatory
          safety, holder concentration, and institutional adoption. Those three
          variables map onto what the CLARITY Act measures, so we combined them
          into a readiness score out of 100. The median across{" "}
          {readiness.total_tokens} tokens is {readiness.median}, which is a
          weaker distribution than the market narrative implies. Treat it as our own
          heuristic, not a legal opinion.
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
                  <td className="py-3 pr-4 font-semibold text-text-primary">
                    {band.label}
                  </td>
                  <td className="py-3 pr-4 font-mono text-text-tertiary">
                    {band.range}
                  </td>
                  <td className="py-3 pr-4 font-mono text-text-primary">
                    {band.count}
                  </td>
                  <td className="py-3 font-mono text-text-primary">
                    {formatUsdScale(band.market_cap_usd)}
                  </td>
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

      {/* What is blocking it */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          What is blocking it
        </h2>
        <div className="mt-6 space-y-6">
          {blockers.map((b) => (
            <div key={b.id} className="rounded-lg border border-border bg-bg-card p-5">
              <h3 className="text-base font-semibold text-text-primary">
                {b.title}
              </h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
                {b.detail}
              </p>
              <p className="mt-3 text-xs font-mono text-text-tertiary">{b.who}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          The floor-time problem
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-[1.8] text-text-secondary">
          {calendar.august_window} It returns {calendar.return_date}.{" "}
          {calendar.october} Election Day is {calendar.election_day}.{" "}
          {calendar.note}
        </p>
        <Link
          href="/clarity-act/clarity-act-passage-odds"
          className="mt-4 inline-block text-sm text-amber hover:underline"
        >
          The full calendar arithmetic
        </Link>
      </section>

      {/* Timeline */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Timeline
        </h2>
        <ol className="mt-6 space-y-7 border-l border-border pl-6">
          {timeline.map((entry) => (
            <li key={`${entry.date}-${entry.title}`} className="relative">
              <span className="absolute -left-[1.6875rem] top-1.5 h-2 w-2 rounded-full bg-amber" />
              <time className="text-xs font-mono text-text-tertiary">
                {entry.date}
              </time>
              <h3 className="mt-1 text-base font-semibold text-text-primary">
                {entry.title}
              </h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
                {entry.detail}
              </p>
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

      {/* Glossary */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          The definitions that decide everything
        </h2>
        <dl className="mt-6 space-y-6">
          {provisions.map((p) => (
            <div key={p.id}>
              <dt className="text-base font-semibold text-text-primary">
                {p.title}
              </dt>
              <dd className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
                {p.plain_english} {p.why_it_matters}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Common questions
        </h2>
        <dl className="mt-6 space-y-7">
          {HUB_FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="text-base font-semibold text-text-primary">
                {faq.question}
              </dt>
              <dd className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

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
    </div>
  );
}

function Vital({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="bg-bg-card p-4">
      <dt className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
        {value}
      </dd>
    </div>
  );
}
