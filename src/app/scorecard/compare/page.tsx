import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getScorecardMeta, getScorecardToken } from "@/lib/scorecard-analytics";
import { getAllPairs, type PairRef } from "@/lib/scorecard-pairs";
import { formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

/** The three ways a pair earns a page, in the order they are listed. */
const REASONS = [
  {
    key: "market-cap",
    title: "Market-cap peers",
    blurb:
      "The largest rated tokens against the others closest to them in size. These are the comparisons a buyer is usually choosing between in practice.",
  },
  {
    key: "profile",
    title: "Similar fundamental profiles",
    blurb:
      "Pairs whose 25-variable shapes match after overall quality is removed, so they share a pattern of strengths and weaknesses rather than a similar market cap.",
  },
  {
    key: "chain",
    title: "Same network",
    blurb:
      "The strongest rated tokens on each network, compared against each other. Useful when the network is the decision already made.",
  },
] as const;

const TITLE = "Crypto head-to-head comparisons";

export const metadata: Metadata = {
  title: "Compare any two crypto tokens on 25 variables",
  description:
    "Curated head-to-head comparisons across the rated universe. Two tokens, 25 fundamental variables, every gap between them, with market cap, dilution and drawdown side by side.",
  keywords: [
    "crypto comparison",
    "compare crypto tokens",
    "altcoin vs altcoin",
    "which crypto is better",
    "crypto fundamentals comparison",
  ],
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: "Two tokens, 25 fundamental variables, every gap between them.",
    url: `${SITE_URL}/scorecard/compare`,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: `${TITLE} | ${SITE_NAME}` },
  alternates: { canonical: `${SITE_URL}/scorecard/compare` },
};

/**
 * Buckets pairs under their first token so 1,034 links read as a directory
 * rather than one undifferentiated wall. Every pair still appears exactly once.
 */
function groupByLead(pairs: readonly PairRef[]): [string, PairRef[]][] {
  const buckets = new Map<string, PairRef[]>();
  for (let i = 0; i < pairs.length && i < 2000; i += 1) {
    const lead = pairs[i].a;
    const list = buckets.get(lead) ?? [];
    list.push(pairs[i]);
    buckets.set(lead, list);
  }
  return [...buckets.entries()].sort((x, y) => x[0].localeCompare(y[0]));
}

export default function CompareIndexPage() {
  const meta = getScorecardMeta();
  const pairs = getAllPairs();
  const covered = new Set<string>();
  for (let i = 0; i < pairs.length && i < 2000; i += 1) {
    covered.add(pairs[i].a);
    covered.add(pairs[i].b);
  }

  const faqs = [
    {
      question: "How are these crypto comparisons chosen?",
      answer:
        `Three rules, applied to the ${meta.universe_size}-token rated universe. The market-cap head is ` +
        `paired within a bounded span of places, every token is paired with its nearest fundamental ` +
        `profiles, and the strongest members of each network are paired with each other. That produces ` +
        `${pairs.length} comparisons covering ${covered.size} tokens. Nothing is paired at random.`,
    },
    {
      question: "What does each comparison show?",
      answer:
        "All 25 scored variables side by side with the gap on each one called, the running count of " +
        "variables each token wins, price, market cap, circulating share, dilution to full supply, " +
        "distance from the all-time high and the return needed to recover it, plus the catalyst and " +
        "principal risk recorded for each side.",
    },
    {
      question: "Does a higher score mean the token will outperform?",
      answer:
        "No. The score is one framework applied consistently across every rated token, measured at the " +
        "last scoring pass. It ranks fundamentals as recorded, not future price.",
    },
  ];

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Compare", path: "/scorecard/compare" },
  ]);
  const faqSchema = getFaqPageSchema(faqs);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/scorecard" className="hover:text-text-secondary">
          Scorecard
        </Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">Compare</span>
      </nav>

      <PageHeader
        eyebrow={`${pairs.length} comparisons`}
        title={TITLE}
        lead={`Two tokens, the same 25 variables, scored in the same pass against the same ${meta.universe_size}-token universe. Covering ${covered.size} tokens.`}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Market snapshot ${formatDate(meta.market_data.fetched_at)}.`}
      />

      <Section>
        <SectionLabel number="01" title="Why a comparison says more than two pages" />
        <Prose>
          A single scorecard tells you a token scores 7 on developer activity. It cannot tell you
          whether that is better or worse than the asset you would otherwise hold. Both sides here
          were scored by the same framework in the same pass, so the gap between them is a real
          measurement rather than two readings taken with different rulers.
        </Prose>
        <Prose>
          Every pair on this page earned its place by one of three rules. None of them is popularity,
          because a comparison is only worth reading when the two assets are genuine substitutes for
          each other.
        </Prose>
      </Section>

      {REASONS.map((reason, index) => {
        const members = pairs.filter((p) => p.reason === reason.key);
        if (members.length === 0) return null;
        return (
          <Section key={reason.key}>
            <SectionLabel number={`0${index + 2}`} title={`${reason.title} (${members.length})`} />
            <Prose>{reason.blurb}</Prose>
            <div className="mt-8 space-y-7">
              {groupByLead(members).map(([lead, group]) => (
                <div key={lead}>
                  <h3 className="mb-2.5 flex items-baseline gap-3 font-mono text-xs uppercase tracking-wider text-text-tertiary">
                    <span className="text-text-secondary">{lead.toUpperCase()}</span>
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    <span>{group.length}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.map((pair) => {
                      const a = getScorecardToken(pair.a);
                      const b = getScorecardToken(pair.b);
                      const other = pair.a === lead ? pair.b : pair.a;
                      const leadScore = pair.a === lead ? a?.score : b?.score;
                      const otherScore = pair.a === lead ? b?.score : a?.score;
                      const otherWins =
                        leadScore !== undefined && otherScore !== undefined && otherScore > leadScore;
                      return (
                        <Link
                          key={pair.slug}
                          href={`/scorecard/compare/${pair.slug}`}
                          className="inline-flex items-baseline gap-2 rounded-full border border-border bg-bg-card px-3.5 py-1.5 font-mono text-xs text-text-secondary transition-colors duration-200 hover:border-border-active hover:text-text-primary"
                        >
                          <span>vs {other.toUpperCase()}</span>
                          {otherScore !== undefined && (
                            <span className={otherWins ? "text-positive" : "text-text-tertiary"}>
                              {otherScore}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      })}

      <Section>
        <SectionLabel number="05" title="Common questions" />
        <dl className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-[1.0625rem] font-semibold text-text-primary">{faq.question}</dt>
              <dd className="mt-2 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/scorecard"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              All {meta.universe_size} rated tokens
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              The full ranking table, by composite score.
            </span>
          </Link>
          <Link
            href="/scorecard/signal"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              The 25 variables, ranked
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Which of them the market pays for, and which it ignores.
            </span>
          </Link>
          <Link
            href="/methodology"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">How the scoring works</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Where the inputs come from and how they are checked.
            </span>
          </Link>
        </div>
      </Section>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-text-tertiary">
        Research and analysis, not investment advice.
      </p>
    </div>
  );
}
