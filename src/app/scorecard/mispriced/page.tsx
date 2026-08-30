import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import ScreenTable from "@/components/ScreenTable";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getMispricing, getScreensMeta } from "@/lib/scorecard-screens";
import { formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

const TITLE = "Where the market and the fundamentals disagree";

export function generateMetadata(): Metadata {
  const m = getMispricing();
  if (m === null) return { title: "Mispricing" };
  const top = m.underpriced.slice(0, 3).map((r) => r.symbol).join(", ");
  const description =
    `${m.universe} rated tokens ranked twice inside their own size band, once on 25 fundamental ` +
    `variables and once by market capitalisation. ${m.underpriced_total} rank at least ${m.min_gap} ` +
    `percentile points higher on fundamentals than on size, led by ${top}. ${m.overpriced_total} rank ` +
    `the same distance the other way.`;
  return {
    title: "Undervalued and Overvalued Crypto by Fundamental Rank",
    description,
    keywords: [
      "undervalued crypto",
      "overvalued crypto",
      "crypto mispricing",
      "undervalued altcoins by fundamentals",
      "which crypto is overpriced",
    ],
    openGraph: { title: `${TITLE} | ${SITE_NAME}`, description, url: `${SITE_URL}/scorecard/mispriced`, type: "article" },
    twitter: { card: "summary_large_image", title: `${TITLE} | ${SITE_NAME}`, description },
    alternates: { canonical: `${SITE_URL}/scorecard/mispriced` },
  };
}

export default function MispricedPage() {
  const m = getMispricing();
  const meta = getScreensMeta();
  if (m === null) return null;

  const faqs = [
    {
      question: "Which crypto tokens are undervalued?",
      answer:
        `On this measure ${m.underpriced.slice(0, 6).map((r) => `${r.name} (${r.symbol})`).join(", ")} sit ` +
        `furthest above their market-cap rank on fundamentals. That is a statement about the gap between ` +
        `two rankings, not a price target.`,
    },
    {
      question: "Which crypto tokens are overvalued?",
      answer:
        `${m.overpriced.slice(0, 6).map((r) => `${r.name} (${r.symbol})`).join(", ")} carry the widest gap ` +
        `the other way, ranking far higher by market capitalisation than by fundamentals.`,
    },
    {
      question: "How is the gap calculated?",
      answer:
        `Each token is ranked twice against the others in its own size band, once by composite score ` +
        `across the 25 variables and once by market capitalisation. The gap is the market-cap rank minus ` +
        `the fundamental rank, converted to percentile points of that band so the bands compare. A ` +
        `token ranking 2nd on fundamentals and 50th by size in a 56-member band carries +86.`,
    },
    {
      question: "Why does this gap mean anything?",
      answer:
        `Because inside a size band score and capitalisation do not move together. Across the whole ` +
        `universe larger tokens score higher, which is why ranking everything at once produces a list of ` +
        `small tokens and nothing else. Inside a band the correlation collapses to roughly zero, so a ` +
        `wide gap there is a real disagreement rather than an artefact of size.`,
    },
  ];

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Mispriced", path: "/scorecard/mispriced" },
  ]);
  const faqSchema = getFaqPageSchema(faqs);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        <span className="px-2">/</span>
        <Link href="/scorecard" className="hover:text-text-secondary">Scorecard</Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">Mispriced</span>
      </nav>

      <PageHeader
        eyebrow={`${m.universe} tokens ranked twice`}
        title={TITLE}
        lead={`Each token is ranked twice inside its own size band, once on 25 fundamental variables and once by market capitalisation. The gap between those two ranks, in percentile points, is the only number on this page.`}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Market snapshot ${formatDate(meta.market_fetched_at)}.`}
      />

      <Section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Ranked" value={String(m.universe)} note={`across ${m.bands} size bands`} />
          <Stat label="Priced below score" value={String(m.underpriced_total)} note={`${m.min_gap}+ percentile points`} />
          <Stat label="Priced above score" value={String(m.overpriced_total)} note={`${m.min_gap}+ percentile points`} />
          <Stat
            label="Widest gap"
            value={`+${m.underpriced[0]?.gap ?? 0}`}
            note={`${m.underpriced[0]?.symbol} in ${m.underpriced[0]?.band?.toLowerCase()}`}
          />
        </div>
      </Section>

      <Section>
        <SectionLabel number="01" title="Why the gap carries information" />
        <Prose>
          Across the whole universe, bigger tokens do score better. Median composite falls from 157 in
          the mega-cap band to 95 in the micro-cap band. Ranking the whole set at once therefore
          measures size, not mispricing. We tried it: the resulting list of bargains came out entirely
          below $100M with a median of $14.7M, while the list of expensive names had a median of
          $211.7M. That is arithmetic restating what everyone already knows.
        </Prose>
        <Prose>
          Inside a single band it stops. Composite score and market capitalisation correlate about
          0.03 among small caps and minus 0.11 among mid caps. Once the size bracket is fixed, being
          larger says almost nothing about scoring better. So each token is ranked only against others
          its own size, and the gap is converted to percentile points of its band, because a
          109-member band allows a gap of 108 and a 28-member band allows 27.
        </Prose>
      </Section>

      <Section>
        <SectionLabel number="02" title="What is held out, and why" />
        <Prose>
          A rank is only worth reading if every row is a live, distinct, researched asset. Three
          filters run before the ranking, and each was added because the unfiltered version published
          something wrong.
        </Prose>
        <Prose>
          Protocols their own page reports as offline or wound down are removed, because a score
          written before the event does not describe what is there now. Retired tickers and wrapped
          duplicates are removed, because POL and MATIC resolve to one asset and were counted twice.
          And {m.excluded_low_confidence} tokens are held out for low confidence: their 25 variables
          sit mostly on 4 and 5, which is the pattern an analyst produces with no information rather
          than a measurement. Ranking those against researched names turns missing research into a
          buy signal.
        </Prose>
      </Section>

      <Section>
        <SectionLabel number="03" title={`${m.underpriced_total} ranked higher on fundamentals than on size`} />
        <Prose>
          Sorted by the widest gap. A token here ranks well on the 25 variables and is priced as
          though it does not. That is a disagreement to investigate, not a verdict: the market may be
          pricing something the framework does not measure, and often is.
        </Prose>
        <ScreenTable
          rows={m.underpriced}
          caption="Crypto tokens ranked higher on fundamentals than by market capitalisation"
          gapOf={(r) => `+${r.gap}`}
          gapLabel="Gap"
          gapTone="text-positive"
        />
        {m.excluded_impaired.length > 0 && (
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-warning">
            {m.excluded_impaired.join(", ")} would otherwise appear near the top of this table and{" "}
            {m.excluded_impaired.length === 1 ? "has been excluded" : "have been excluded"}. Their
            scores predate an event their own page now reports, so a strong score no longer describes
            a live protocol. The overpriced table below applies no such exclusion.
          </p>
        )}
      </Section>

      <Section>
        <SectionLabel number="04" title={`${m.overpriced_total} ranked higher by size than on fundamentals`} />
        <Prose>
          The same arithmetic the other way. These rank far higher by market capitalisation than the
          framework ranks them, which usually means the market is paying for something the 25
          variables do not capture. Attention is the most common answer.
        </Prose>
        <ScreenTable
          rows={m.overpriced}
          caption="Crypto tokens ranked higher by market capitalisation than on fundamentals"
          gapOf={(r) => String(r.gap)}
          gapLabel="Gap"
          gapTone="text-negative"
        />
      </Section>

      <Section>
        <SectionLabel number="05" title="Common questions" />
        <dl className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-[1.0625rem] font-semibold text-text-primary">{faq.question}</dt>
              <dd className="mt-2 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/scorecard/screen" className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active">
            <span className="block text-sm font-semibold text-text-primary">Ten screens</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Filters for revenue, vesting, buybacks, yield, moat and more.
            </span>
          </Link>
          <Link href="/scorecard/signal" className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active">
            <span className="block text-sm font-semibold text-text-primary">What the market pays for</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              All 25 variables ranked by correlation with market capitalisation.
            </span>
          </Link>
          <Link href="/scorecard/size/small-cap" className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active">
            <span className="block text-sm font-semibold text-text-primary">Read it by size band</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              Where score stops tracking size, and what that leaves.
            </span>
          </Link>
        </div>
      </Section>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-text-tertiary">
        Research and analysis, not investment advice. A rank gap is a disagreement between two
        measurements, not a forecast that either one will converge.
      </p>
    </div>
  );
}

/** A single headline statistic. */
function Stat({ label, value, note }: { readonly label: string; readonly value: string; readonly note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-text-primary">{value}</div>
      {note && <div className="mt-1 text-xs leading-snug text-text-tertiary">{note}</div>}
    </div>
  );
}
