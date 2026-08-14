import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import {
  getAllSignals,
  getSignalsByMarketPricing,
  getSignalsMeta,
  signalSlug,
  type SignalRecord,
} from "@/lib/scorecard-signals";
import { getSignalDefinition } from "@/lib/signal-definitions";
import { formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

/** Themes the 25 variables are grouped into, in framework order. */
const GROUP_ORDER = ["Cash flow", "Supply", "Ownership", "Traction", "Position", "Risk"] as const;

/** Above this two variables are close to the same measurement. */
const TWIN_R = 0.8;
/** At or below this the market shows no consistent preference. */
const IGNORED_RHO = 0.15;

const TITLE = "Which crypto fundamentals the market actually pays for";

/**
 * Built rather than hardcoded: the correlations move when the daily job reruns,
 * and a description that names the wrong variable is worse than a generic one.
 */
export function generateMetadata(): Metadata {
  const byPricing = getSignalsByMarketPricing();
  const meta = getSignalsMeta();
  const strongest = byPricing[0];
  const weakest = byPricing[byPricing.length - 1];
  const ignored = byPricing.filter((s) => (s.mcap_rho ?? 1) <= IGNORED_RHO).length;
  const description =
    `All ${meta.count} scored variables ranked by how strongly each correlates with market ` +
    `capitalisation across ${meta.universe_size} rated tokens. ${strongest.label} leads at ` +
    `${strongest.mcap_rho}, ${weakest.label} trails at ${weakest.mcap_rho}, and ${ignored} variables ` +
    `sit at ${IGNORED_RHO} or below, meaning the market does not price them at all.`;

  return {
    title: "Which crypto fundamentals the market actually pays for",
    description,
    keywords: [
      "which crypto fundamentals matter",
      "crypto valuation factors",
      "do tokenomics affect price",
      "altcoin fundamental analysis variables",
      "crypto factor analysis",
    ],
    openGraph: {
      title: `${TITLE} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/scorecard/signal`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: `${TITLE} | ${SITE_NAME}`, description },
    alternates: { canonical: `${SITE_URL}/scorecard/signal` },
  };
}

/** Every near-duplicate variable pair the framework contains, deduplicated. */
function findTwins(signals: readonly SignalRecord[]): { a: string; b: string; r: number }[] {
  if (!Array.isArray(signals) || signals.length === 0) return [];
  const seen = new Set<string>();
  const out: { a: string; b: string; r: number }[] = [];
  for (let i = 0; i < signals.length && i < 60; i += 1) {
    for (let j = 0; j < signals[i].peers.length && j < 6; j += 1) {
      const peer = signals[i].peers[j];
      if (Math.abs(peer.r) < TWIN_R) continue;
      const key = [signals[i].key, peer.key].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a: signals[i].label, b: peer.label, r: peer.r });
    }
  }
  out.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  return out;
}

/** Mean market correlation per theme, strongest theme first. */
function buildThemeMeans(
  signals: readonly SignalRecord[],
): { group: string; mean: number; count: number }[] {
  if (!Array.isArray(signals) || signals.length === 0) return [];
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < signals.length && i < 60; i += 1) {
    const rho = signals[i].mcap_rho;
    if (rho === null) continue;
    const list = buckets.get(signals[i].group) ?? [];
    list.push(rho);
    buckets.set(signals[i].group, list);
  }
  const out: { group: string; mean: number; count: number }[] = [];
  for (const [group, values] of buckets) {
    const sum = values.reduce((acc, v) => acc + v, 0);
    out.push({ group, mean: Math.round((sum / values.length) * 100) / 100, count: values.length });
  }
  out.sort((a, b) => b.mean - a.mean);
  return out;
}

export default function SignalIndexPage() {
  const meta = getSignalsMeta();
  const signals = getAllSignals();
  const byPricing = getSignalsByMarketPricing();
  const twins = findTwins(signals);

  const priced = byPricing.filter((s) => (s.mcap_rho ?? 0) > IGNORED_RHO);
  const ignored = byPricing.filter((s) => (s.mcap_rho ?? 1) <= IGNORED_RHO);
  // Every figure below reads from these two lists. If a data pass ever produced
  // no measurable correlations the page would render nothing rather than crash
  // the whole build.
  if (byPricing.length === 0 || signals.length === 0) return null;
  const strongest = byPricing[0];
  const weakest = byPricing[byPricing.length - 1];
  const themeMeans = buildThemeMeans(byPricing);
  if (themeMeans.length === 0) return null;

  const faqs = [
    {
      question: "Which crypto fundamentals correlate with market cap?",
      answer:
        `${strongest.label} correlates most strongly at ${strongest.mcap_rho}, followed by the rest of the ` +
        `positioning variables. ${ignored.length} of the ${signals.length} variables sit at ${IGNORED_RHO} or ` +
        `below, meaning the market shows no consistent preference for them at all.`,
    },
    {
      question: "Do tokenomics affect a crypto token's price?",
      answer:
        `On this universe of ${meta.universe_size} rated tokens, barely. The supply variables average ` +
        `${themeMeans[themeMeans.length - 1].mean} against market capitalisation, the weakest of any theme ` +
        `in the framework, while the positioning variables average ${themeMeans[0].mean}. That is a ` +
        `statement about what the market currently charges for, not about what determines a long-term return.`,
    },
    {
      question: "How many independent fundamental variables are there?",
      answer:
        `Fewer than 25. ${twins.length} variable pairs correlate at ${TWIN_R} or above across the universe, ` +
        `which means they are close to restating each other and should be read as one position rather than ` +
        `two confirmations.`,
    },
  ];

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Signals", path: "/scorecard/signal" },
  ]);
  const faqSchema = getFaqPageSchema(faqs);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The 25 scored fundamental variables",
    numberOfItems: signals.length,
    itemListElement: signals.map((signal, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: signal.label,
      url: `${SITE_URL}/scorecard/signal/${signalSlug(signal.key)}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
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
        <span className="text-text-secondary">Signals</span>
      </nav>

      <PageHeader
        eyebrow={`${signals.length} variables`}
        title={TITLE}
        lead={`Each of the ${signals.length} scored variables ranked against live market capitalisation across ${meta.universe_size} tokens. The gap between what the framework rewards and what the market pays for is the whole opportunity set.`}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Market snapshot ${formatDate(meta.market_fetched_at)}.`}
      />

      <Section>
        <SectionLabel number="01" title="What the market charges for" />
        <Prose>
          The right-hand column is a rank correlation between a variable and market capitalisation.
          High means the market already pays up for tokens that score well, so the score is mostly in
          the price. Near zero means the market is indifferent, which is where a variable can still be
          worth something to somebody willing to hold the disagreement.
        </Prose>
        <Prose>
          {strongest.label} is the most priced variable in the set at {strongest.mcap_rho}, and{" "}
          {weakest.label} the least at {weakest.mcap_rho}. {priced.length} of {signals.length}{" "}
          variables clear {IGNORED_RHO}; the other {ignored.length} show no consistent preference at
          all. Read down the bottom of this table and you are looking at every input the market is
          currently not charging for.
        </Prose>
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {themeMeans.map((theme) => (
            <div key={theme.group} className="rounded-2xl border border-border bg-bg-card p-4">
              <div className="font-mono text-xl font-semibold text-text-primary">{theme.mean}</div>
              <div className="mt-1 text-xs leading-snug text-text-secondary">{theme.group}</div>
              <div className="mt-1 font-mono text-[11px] text-text-tertiary">
                {theme.count} variables
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Mean correlation with market capitalisation by theme. The spread between the top theme and
          the bottom one is the single most useful number on this page: it says the market is paying
          for {themeMeans[0].group.toLowerCase()} and not for {themeMeans[themeMeans.length - 1].group.toLowerCase()}.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              25 fundamental variables ranked by rank correlation with market capitalisation
            </caption>
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Variable</th>
                <th className="px-4 py-3">Theme</th>
                <th className="px-4 py-3 text-right">Median</th>
                <th className="px-4 py-3 text-right">Composite r</th>
                <th className="px-4 py-3 text-right">Market cap</th>
              </tr>
            </thead>
            <tbody>
              {byPricing.map((signal, index) => (
                <tr key={signal.key} className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-text-tertiary">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/scorecard/signal/${signalSlug(signal.key)}`}
                      className="text-sm font-semibold text-text-primary hover:text-info"
                    >
                      {signal.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-tertiary">{signal.group}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                    {signal.median}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
                    {signal.score_r}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-sm font-semibold ${(signal.mcap_rho ?? 0) > IGNORED_RHO ? "text-positive" : "text-text-tertiary"}`}
                  >
                    {signal.mcap_rho}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Rank correlation (Spearman) against market capitalisation, computed over the tokens with a
          matched live market row. Composite r is Pearson against the total score. Correlation
          describes this universe at this moment. It is not a claim about cause.
        </p>
      </Section>

      {twins.length > 0 && (
        <Section>
          <SectionLabel number="02" title="Variables that say the same thing twice" />
          <Prose>
            {twins.length} pairs correlate at {TWIN_R} or above across the {meta.universe_size} rated
            tokens. Any framework built by hand accumulates these, and knowing where they are stops a
            reader treating one finding as two.
          </Prose>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {twins.map((twin) => (
              <div key={`${twin.a}-${twin.b}`} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="font-mono text-xl font-semibold text-warning">{twin.r}</div>
                <div className="mt-1 text-sm text-text-secondary">
                  {twin.a} and {twin.b}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <SectionLabel number="03" title="All 25 variables by theme" />
        <Prose>
          Each variable has its own ranking of every rated token, so a single-variable screen is one
          click away: the cheapest tokens on cash flow, the cleanest on supply, the deepest on
          liquidity.
        </Prose>
        <div className="mt-8 space-y-10">
          {GROUP_ORDER.map((group) => {
            const members = signals.filter((s) => s.group === group);
            if (members.length === 0) return null;
            return (
              <div key={group}>
                <EyebrowLabel>{group}</EyebrowLabel>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((signal) => {
                    const definition = getSignalDefinition(signal.key);
                    return (
                      <Link
                        key={signal.key}
                        href={`/scorecard/signal/${signalSlug(signal.key)}`}
                        className="block rounded-2xl border border-border bg-bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
                      >
                        <span className="block text-sm font-semibold text-text-primary">
                          {signal.label}
                        </span>
                        <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
                          {definition ? definition.question : `Every token ranked on ${signal.label}.`}
                        </span>
                        <span className="mt-3 block font-mono text-[11px] text-text-tertiary">
                          median {signal.median}/10
                          {signal.leaders.length > 0 && ` · ${signal.leaders[0].symbol} leads`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <SectionLabel number="04" title="Common questions" />
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
            href="/scorecard/compare"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">Head-to-head comparisons</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Two tokens, 25 variables, every gap between them.
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
        Research and analysis, not investment advice. Correlations describe the rated universe at one
        point in time.
      </p>
    </div>
  );
}
