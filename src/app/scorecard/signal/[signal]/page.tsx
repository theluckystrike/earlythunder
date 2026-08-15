import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import {
  getAllSignals,
  getSignal,
  getSignalLeaders,
  getSignalsMeta,
  buildSignalFindings,
  buildSignalFaqs,
  signalSlug,
  type SignalRecord,
} from "@/lib/scorecard-signals";
import { getSignalDefinition } from "@/lib/signal-definitions";
import { ordinal, formatUsd, formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

/** Rows shown with a one-line thesis before the table turns compact. */
const NARRATED_ROWS = 10;
/** Hard ceiling on rendered leaderboard rows. */
const MAX_ROWS = 300;
const HISTOGRAM_BUCKETS = 10;

interface PageParams {
  readonly params: Promise<{ readonly signal: string }>;
}

/** One static route per scored variable. */
export function generateStaticParams(): { signal: string }[] {
  const signals = getAllSignals();
  if (signals.length === 0) return [];
  return signals.map((signal) => ({ signal: signalSlug(signal.key) }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { signal: slug } = await params;
  const signal = getSignal(slug);
  if (signal === null) return { title: "Signal Not Found" };

  const meta = getSignalsMeta();
  const definition = getSignalDefinition(signal.key);
  const top = signal.leaders.slice(0, 3).map((l) => l.symbol).join(", ");
  const title = `${signal.label}, all ${meta.universe_size} tokens ranked`;
  const description =
    `Every one of ${meta.universe_size} rated tokens ranked on ${signal.label}, scored 1 to 10. ` +
    `${top} lead. Median ${signal.median}/10` +
    (signal.mcap_rho === null
      ? "."
      : `, and the variable correlates ${signal.mcap_rho} with market capitalisation, so ` +
        `${signal.mcap_rho <= 0.15 ? "the market is not paying for it" : "the market prices part of it"}.`);

  return {
    title,
    description,
    keywords: [
      definition ? definition.question.toLowerCase().replace("?", "") : `${signal.label.toLowerCase()} crypto`,
      `crypto ranked by ${signal.label.toLowerCase()}`,
      `best ${signal.label.toLowerCase()} crypto`,
      `${signal.label.toLowerCase()} comparison altcoins`,
      "altcoin scorecard",
    ],
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/scorecard/signal/${signalSlug(signal.key)}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    alternates: { canonical: `${SITE_URL}/scorecard/signal/${signalSlug(signal.key)}` },
  };
}

/** Colour for a 1-10 variable score. Matches the token pages. */
function scoreTone(value: number | null): string {
  if (value === null) return "text-text-tertiary";
  if (value >= 7) return "text-positive";
  if (value >= 4) return "text-warning";
  return "text-negative";
}

/** A single headline statistic. */
function Stat({
  label,
  value,
  note,
}: {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-text-primary">{value}</div>
      {note && <div className="mt-1 text-xs leading-snug text-text-tertiary">{note}</div>}
    </div>
  );
}

/** How many tokens sit at each score from 1 to 10. */
function Histogram({ signal }: { readonly signal: SignalRecord }) {
  const counts = signal.histogram.slice(0, HISTOGRAM_BUCKETS);
  const peak = counts.reduce((max, n) => (n > max ? n : max), 1);

  return (
    <div className="mt-8 max-w-3xl">
      <div className="flex items-end gap-2" style={{ height: "140px" }}>
        {counts.map((count, index) => (
          <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span className="font-mono text-[11px] text-text-tertiary">{count}</span>
            <div
              className={`w-full rounded-t ${index + 1 >= 7 ? "bg-positive/70" : index + 1 >= 4 ? "bg-warning/70" : "bg-negative/70"}`}
              style={{ height: `${Math.max(2, (count / peak) * 100)}px` }}
            />
            <span className="font-mono text-[11px] text-text-tertiary">{index + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        Tokens at each score from 1 to 10. The shape matters: a variable where almost everything
        clusters at 3 is telling you the whole category fails it, not that one token is unusual.
      </p>
    </div>
  );
}

export default async function SignalPage({ params }: PageParams) {
  const { signal: slug } = await params;
  const signal = getSignal(slug);
  if (signal === null) notFound();

  const meta = getSignalsMeta();
  const definition = getSignalDefinition(signal.key);
  const leaders = getSignalLeaders(signal).slice(0, MAX_ROWS);
  // The page is a leaderboard. With no rows there is nothing to publish.
  if (leaders.length === 0) notFound();
  const findings = buildSignalFindings(signal);
  const faqs = buildSignalFaqs(signal, meta.universe_size);
  const url = `${SITE_URL}/scorecard/signal/${signalSlug(signal.key)}`;

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Signals", path: "/scorecard/signal" },
    { name: signal.label, path: `/scorecard/signal/${signalSlug(signal.key)}` },
  ]);
  const faqSchema = getFaqPageSchema(faqs);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${signal.label} scores for ${leaders.length} crypto tokens`,
    description:
      `Every rated token scored 1 to 10 on ${signal.label}, with rank and percentile against the ` +
      `${meta.universe_size}-token universe.`,
    url,
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isAccessibleForFree: true,
    variableMeasured: {
      "@type": "PropertyValue",
      name: signal.label,
      description: definition ? definition.measures : undefined,
      minValue: 1,
      maxValue: 10,
      median: signal.median,
    },
    temporalCoverage: meta.market_fetched_at ?? undefined,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Crypto tokens ranked by ${signal.label}`,
    numberOfItems: leaders.length,
    itemListElement: leaders.slice(0, 20).map((leader, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${leader.name} (${leader.symbol})`,
      url: `${SITE_URL}/scorecard/${leader.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={datasetSchema} />
      <JsonLd data={itemListSchema} />
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
        <Link href="/scorecard/signal" className="hover:text-text-secondary">
          Signals
        </Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">{signal.label}</span>
      </nav>

      <PageHeader
        eyebrow={signal.group}
        title={`${signal.label}, ranked`}
        lead={
          definition
            ? definition.measures
            : `Every rated token scored 1 to 10 on ${signal.label} and ranked against the full universe.`
        }
        meta={`One of the 25 variables in the framework. ${meta.universe_size} tokens rated. Scoring pass ${formatDate(meta.source_updated_at)}.`}
      />

      <Section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Median" value={`${signal.median}/10`} note={`mean ${signal.mean}`} />
          <Stat
            label="Scoring 9 or 10"
            value={String(signal.extremes.at_nine_or_ten)}
            note={`of ${leaders.length} rated`}
          />
          <Stat
            label="Composite link"
            value={signal.score_r === null ? "n/a" : String(signal.score_r)}
            note="correlation with total score"
          />
          <Stat
            label="Market link"
            value={signal.mcap_rho === null ? "n/a" : String(signal.mcap_rho)}
            note={`rank correlation with market cap, n=${signal.mcap_n}`}
          />
        </div>
      </Section>

      {definition && (
        <Section>
          <SectionLabel number="01" title="What this variable measures" />
          <Prose>{definition.measures}</Prose>
          <Prose>{definition.scale}</Prose>
          <Prose>{definition.matters}</Prose>
        </Section>
      )}

      <Section>
        <SectionLabel number="02" title="What the universe says" />
        <div className="mt-8 max-w-3xl space-y-7">
          {findings.map((finding) => (
            <p key={finding.label} className="text-[1.0625rem] leading-[1.8] text-text-secondary">
              {finding.text}
            </p>
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel number="03" title="Distribution across the universe" />
        <Histogram signal={signal} />
      </Section>

      <Section>
        <SectionLabel number="04" title={`All ${leaders.length} tokens ranked`} />
        <Prose>
          Sorted by score on this variable alone, so a token can lead here and rank poorly overall.
          That disagreement is the useful part: it is where a single-variable screen finds something
          the composite averages away.
        </Prose>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {leaders.length} crypto tokens ranked by {signal.label}, scored 1 to 10
            </caption>
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3 text-right">{signal.label}</th>
                <th className="px-4 py-3 text-right">Composite</th>
                <th className="px-4 py-3 text-right">Market cap</th>
                <th className="px-4 py-3">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => (
                <tr key={leader.slug} className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-text-tertiary">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/scorecard/${leader.slug}`}
                      className="font-mono text-sm font-semibold text-text-primary hover:text-info"
                    >
                      {leader.symbol}
                    </Link>
                    <span className="ml-2 text-xs text-text-tertiary">{leader.name}</span>
                    {index < NARRATED_ROWS && leader.one_liner && (
                      <span className="mt-1.5 line-clamp-2 max-w-md font-sans text-xs leading-relaxed text-text-secondary">
                        {leader.one_liner}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${scoreTone(leader.value)}`}>
                    {leader.value === null ? "n/a" : `${leader.value}/10`}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                    {leader.score}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                    {formatUsd(leader.market_cap)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-tertiary">{leader.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Scores come from the research pass dated {formatDate(meta.source_updated_at)} and do not move
          with price. Market capitalisation is from the live snapshot fetched{" "}
          {formatDate(meta.market_fetched_at)}, so the two columns are stamped at different times on
          purpose.
        </p>
      </Section>

      {signal.peers.length > 0 && (
        <Section>
          <SectionLabel number="05" title="Variables that move with this one" />
          <Prose>
            Correlations across all {leaders.length} rated tokens. A number near 1 means the two
            variables are close to the same measurement, which is worth knowing before treating a
            second high score as independent confirmation of the first.
          </Prose>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {signal.peers.map((peer) => (
              <Link
                key={peer.key}
                href={`/scorecard/signal/${signalSlug(peer.key)}`}
                className="block rounded-2xl border border-border bg-bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
              >
                <div className="font-mono text-xl font-semibold text-text-primary">{peer.r}</div>
                <div className="mt-1 text-sm text-text-secondary">{peer.label}</div>
                <div className="mt-2 font-mono text-[11px] text-text-tertiary">
                  {Math.abs(peer.r) >= 0.8 ? "near duplicate" : Math.abs(peer.r) >= 0.6 ? "strongly linked" : "loosely linked"}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section>
          <SectionLabel number="06" title="Common questions" />
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
      )}

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/scorecard/signal"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">All 25 variables</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Every variable ranked by how much the market actually pays for it.
            </span>
          </Link>
          <Link
            href={`/scorecard/${leaders[0].slug}`}
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              {leaders[0].name} full scorecard
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              The leader on this variable, scored across all 25 and ranked{" "}
              {ordinal(leaders[0].rank ?? 1)} of {leaders.length} here.
            </span>
          </Link>
          <Link
            href="/scorecard"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              All {meta.universe_size} rated tokens
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              The full ranking table and the method behind the 25 variables.
            </span>
          </Link>
        </div>
      </Section>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-text-tertiary">
        Research and analysis, not investment advice. Correlations describe the rated universe at one
        point in time and are not predictions.
      </p>
    </div>
  );
}
