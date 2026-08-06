import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import {
  getAllScorecardTokens,
  getScorecardGroups,
  getScorecardMeta,
} from "@/lib/scorecard-analytics";
import { formatUsd, formatDate, ordinal } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

/** Bounded so the index cannot grow unbounded as the universe expands. */
const MAX_SCHEMA_ITEMS = 50;

export const metadata: Metadata = {
  title: "Altcoin Scorecard, 251 Tokens Scored on 25 Variables",
  description:
    "Every one of 251 altcoins scored 1-10 on 25 fundamental variables covering protocol revenue, supply and vesting, ownership, traction, competitive position and risk. Each token has its own page with per-variable rankings against the full universe.",
  keywords: [
    "altcoin scorecard",
    "crypto fundamental analysis",
    "token rankings",
    "altcoin hold or sell",
    "crypto tokenomics comparison",
    "which altcoins to sell",
  ],
  alternates: { canonical: `${SITE_URL}/scorecard` },
};

/** Colour for a verdict badge, keyed off the verdict_color in the dataset. */
function verdictTone(color: string): string {
  const map: Record<string, string> = {
    green: "border-positive/30 bg-positive-bg text-positive",
    blue: "border-info/30 bg-[rgba(59,130,246,0.10)] text-info",
    yellow: "border-warning/30 bg-warning-bg text-warning",
    orange: "border-warning/40 bg-warning-bg text-warning",
    red: "border-negative/30 bg-negative-bg text-negative",
  };
  return map[color] ?? map.yellow;
}

export default function ScorecardPage() {
  const meta = getScorecardMeta();
  const tokens = getAllScorecardTokens();
  const verdictGroups = getScorecardGroups("verdict");
  const chainGroups = getScorecardGroups("chain");

  const faqs = [
    {
      question: "What does the 25-variable altcoin scorecard measure?",
      answer:
        `Each of ${meta.universe_size} tokens is scored 1 to 10 on 25 separate variables grouped into six themes: cash flow (protocol revenue, revenue trend, P/S multiple, real staking yield), supply (inflation, vesting schedule, circulating to fully diluted ratio, buyback and burn), ownership (smart money flows, insider selling, holder concentration), traction (TVL trend, active users, developer activity, network growth), competitive position (market share, moat, institutional adoption, exchange depth, social mindshare) and risk (regulatory safety, catalyst calendar, BTC alpha, team execution, treasury runway). The composite is the sum, out of ${meta.max_score}.`,
    },
    {
      question: "How is a score of 7 on one token different from a 7 on another?",
      answer:
        `On its own it is not, which is why every token page also carries the rank. A 7 that ranks ${ordinal(15)} of ${meta.universe_size} on protocol revenue is a genuinely scarce result; a 7 that ranks ${ordinal(140)} on exchange depth is ordinary. Raw scores compress, ranks do not, so the per-variable rank against the whole universe is the number worth reading.`,
    },
    {
      question: "What do the verdicts mean?",
      answer: verdictGroups
        .map((group) => `${group.name} covers ${group.count} tokens with a median composite of ${group.median_score}`)
        .join("; ") + `. Verdicts follow the composite and the pattern of the underlying variables, not price action.`,
    },
    {
      question: "How current is the data?",
      answer:
        `The scoring pass is dated ${formatDate(meta.source_updated_at)}. Scores, ranks, supply counts and vesting maths do not change with price. Prices and market caps shown alongside them are labelled with the date they were recorded, and are refreshed daily only for the tokens that also carry a full research note.`,
    },
  ];

  const faqSchema = getFaqPageSchema(faqs);
  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
  ]);

  const datasetSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${SITE_NAME} Altcoin Scorecard`,
    description: `${meta.universe_size} altcoins scored 1-10 across 25 fundamental variables, with per-variable rankings against the full universe.`,
    url: `${SITE_URL}/scorecard`,
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    variableMeasured: meta.variables.map((v) => ({
      "@type": "PropertyValue",
      name: v.label,
      minValue: 1,
      maxValue: 10,
      description: `${v.group}. Universe median ${v.median}, mean ${v.mean}.`,
    })),
  };

  const listSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top rated tokens, ${SITE_NAME} scorecard`,
    url: `${SITE_URL}/scorecard`,
    numberOfItems: Math.min(tokens.length, MAX_SCHEMA_ITEMS),
    itemListElement: tokens.slice(0, MAX_SCHEMA_ITEMS).map((token, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${token.name} (${token.symbol})`,
      url: `${SITE_URL}/scorecard/${token.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={datasetSchema} />
      <JsonLd data={listSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <PageHeader
        title="Altcoin Scorecard"
        lead={`${meta.universe_size} tokens scored 1 to 10 on the same 25 fundamental variables, then ranked against each other on every one of them.`}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Composite range ${meta.score_range.min} to ${meta.score_range.max} out of ${meta.max_score}.`}
      />

      <Section>
        <SectionLabel number="01" title="Read it by verdict" />
        <Prose>
          The framework sorts every rated token into one of five bands. The band pages carry the
          full member list plus the variables that band is collectively strong and weak on, which
          is the part a single token page cannot show you.
        </Prose>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verdictGroups.map((group) => (
            <Link
              key={group.slug}
              href={`/scorecard/verdict/${group.slug}`}
              className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block rounded border px-2 py-0.5 font-mono text-xs font-semibold ${verdictTone(group.members[0].verdict_color)}`}
                >
                  {group.name}
                </span>
                <span className="font-mono text-xs text-text-tertiary">{group.count} tokens</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Median {group.median_score} of {meta.max_score}, from {group.bottom_score} to{" "}
                {group.top_score}. Strongest on {group.strongest_variables[0]?.label}, weakest on{" "}
                {group.weakest_variables[0]?.label}.
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel number="02" title="Read it by chain" />
        <Prose>
          Tokens sharing a settlement layer tend to share its constraints, its regulatory treatment
          and its liquidity. Where a chain&apos;s tokens collectively win or lose says as much about the
          chain as about any one token on it.
        </Prose>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chainGroups.map((group) => (
            <Link
              key={group.slug}
              href={`/scorecard/chain/${group.slug}`}
              className="block rounded-2xl border border-border bg-bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
            >
              <div className="text-sm font-semibold text-text-primary">{group.name}</div>
              <div className="mt-1 font-mono text-xs text-text-tertiary">
                {group.count} tokens &middot; median {group.median_score}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel number="03" title="How the universe scores on each variable" />
        <Prose>
          Median and mean across all {meta.universe_size} rated tokens. The variables with the
          lowest medians are where the asset class as a whole is weak, not where any single token is
          failing.
        </Prose>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full font-mono text-sm">
            <caption className="sr-only">
              Universe-wide distribution of each of the 25 scored variables
            </caption>
            <thead>
              <tr className="border-b border-border bg-bg-card text-left">
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Variable
                </th>
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Theme
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Median
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Mean
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Range
                </th>
              </tr>
            </thead>
            <tbody>
              {[...meta.variables]
                .sort((a, b) => (b.median ?? 0) - (a.median ?? 0))
                .map((variable) => (
                  <tr key={variable.key} className="border-b border-border/40 hover:bg-bg-card/50">
                    <td className="px-3 py-2.5 text-text-primary">{variable.label}</td>
                    <td className="px-3 py-2.5 text-text-tertiary">{variable.group}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-text-primary">
                      {variable.median}
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">{variable.mean}</td>
                    <td className="px-3 py-2.5 text-right text-text-tertiary">
                      {variable.min} to {variable.max}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionLabel number="04" title={`All ${meta.universe_size} rated tokens`} />
        <Prose>
          Ranked by composite score. Every symbol links to its own page carrying the full
          25-variable breakdown, the rank it holds on each variable, its vesting arithmetic and the
          tokens with the closest fundamental profile.
        </Prose>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full font-mono text-sm">
            <caption className="sr-only">
              All {meta.universe_size} rated tokens ordered by composite score
            </caption>
            <thead>
              <tr className="border-b border-border bg-bg-card text-left">
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  #
                </th>
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Token
                </th>
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Score
                </th>
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Verdict
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Market cap
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Circ
                </th>
                <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                  Dilution
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary lg:table-cell"
                >
                  Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.symbol} className="border-b border-border/40 align-top hover:bg-bg-card/50">
                  <td className="px-3 py-2.5 text-text-tertiary">{token.rank_overall}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/scorecard/${token.slug}`}
                      className="font-semibold text-info hover:underline"
                    >
                      {token.symbol}
                    </Link>
                    <div className="text-xs text-text-tertiary">{token.name}</div>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-text-primary">{token.score}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${verdictTone(token.verdict_color)}`}
                    >
                      {token.verdict}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary">
                    {token.market.market_cap === null ? "-" : formatUsd(token.market.market_cap)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary">
                    {token.dilution.circ_pct === null ? "-" : `${token.dilution.circ_pct}%`}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary">
                    {token.dilution.dilution_x === null ? "-" : `${token.dilution.dilution_x}x`}
                  </td>
                  <td className="hidden max-w-md whitespace-normal px-3 py-2.5 text-xs leading-snug text-text-secondary lg:table-cell">
                    {token.one_liner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Dilution is eventual supply divided by circulating supply, derived from supply counts
          rather than from a fully diluted valuation, so it does not move with price. A 1x reading
          means the float is already complete.
        </p>
      </Section>

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
        <EyebrowLabel>Methodology</EyebrowLabel>
        <p className="max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">
          {meta.methodology}
        </p>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          This is research and analysis, not investment advice. Scores are one framework applied
          consistently across {meta.universe_size} tokens, not a prediction of price.
        </p>
      </Section>
    </div>
  );
}
