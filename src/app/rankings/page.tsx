import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getAllRankings, getRankingsMeta } from "@/lib/scorecard-rankings";
import { formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

const TITLE = "Crypto rankings built on 25 fundamental variables";

const BLURBS: Record<string, string> = {
  "most-deflationary":
    "Every rated token whose supply variable scores in the top quartile. Issuance at or near zero, burns exceeding issuance, or a fixed cap already mined. Ranked by composite score.",
  "net-supply-direction":
    "The only page that puts supply inflation and buyback burn side by side and ranks on the average of the two. A token can inflate and still shrink supply if the burn is bigger, and this is where that shows.",
  "undervalued-ps":
    "High composite score and a top-quartile price-to-sales percentile, inside $50M-$5B market caps. The undervalued-altcoin question answered with a stated rule instead of a momentum list.",
  "exchange-tokens":
    "Every rated exchange token (CEX and DEX) ranked on composite score. Exchange tokens live or die on volume and regulatory exposure, so the ranking states which side of that trade each one sits on.",
};

export function generateMetadata(): Metadata {
  const rankings = getAllRankings();
  const meta = getRankingsMeta();
  const description =
    `${rankings.length} ranked lists over the same ${meta.universe_size}-token scored universe. ` +
    `Most deflationary crypto, net supply direction, undervalued on price-to-sales, exchange tokens. ` +
    `Each ranking states its rule and lists every token with the numbers behind it.`;
  return {
    title: "Crypto Rankings From First-Party Research Data",
    description,
    keywords: [
      "most deflationary cryptocurrency",
      "buyback and burn crypto list",
      "undervalued altcoins 2026",
      "crypto exchange token list",
      "altcoin inflation rates compared",
    ],
    openGraph: { title: `${TITLE} | ${SITE_NAME}`, description, url: `${SITE_URL}/rankings`, type: "article" },
    twitter: { card: "summary_large_image", title: `${TITLE} | ${SITE_NAME}`, description },
    alternates: { canonical: `${SITE_URL}/rankings` },
  };
}

export default function RankingsIndexPage() {
  const rankings = getAllRankings();
  const meta = getRankingsMeta();
  if (rankings.length === 0) return null;

  const faqs = [
    {
      question: "How is a ranking different from a screen?",
      answer:
        `A screen is a pass/fail filter; a ranking orders the tokens that clear it so the headline ` +
        `order answers the question directly. Both run over the same ${meta.universe_size}-token scored ` +
        `universe with the same 1-to-10 variable definitions.`,
    },
    {
      question: "How current is the data?",
      answer:
        `Member lists come from the research pass dated ${formatDate(meta.source_updated_at)}; market ` +
        `capitalisations from the snapshot fetched ${formatDate(meta.market_fetched_at)}. Scores do not ` +
        `move with price between passes.`,
    },
    {
      question: "Can I trust the order as investment advice?",
      answer:
        "No. Each page restates its rule so you can check it, and every row links to the full token " +
        "page where the weaknesses sit next to the strengths. A ranking is a starting filter, not a verdict.",
    },
  ];

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Rankings", path: "/rankings" },
  ]);
  const faqSchema = getFaqPageSchema(faqs);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Crypto rankings",
    numberOfItems: rankings.length,
    itemListElement: rankings.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.name,
      url: `${SITE_URL}/rankings/${r.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemList} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        <span className="px-2">/</span>
        <Link href="/scorecard" className="hover:text-text-secondary">Scorecard</Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">Rankings</span>
      </nav>

      <PageHeader
        eyebrow={`${rankings.length} ranked lists`}
        title="Rankings over the scored universe"
        lead={`The same ${meta.universe_size} tokens, 25 variables, one rule per list. Every ranking states its threshold and shows the numbers behind each row.`}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Market snapshot ${formatDate(meta.market_fetched_at)}.`}
      />

      <Section>
        <SectionLabel number="01" title="The lists" />
        <div className="mt-6 grid gap-4">
          {rankings.map((r) => (
            <Link
              key={r.slug}
              href={`/rankings/${r.slug}`}
              className="group block rounded-lg border border-border-subtle bg-bg-elevated p-6 transition-colors hover:border-info/40"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-text-secondary">{r.name}</h3>
                <span className="font-mono text-xs text-text-tertiary">{r.count} tokens</span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{BLURBS[r.slug] ?? ""}</p>
              <p className="mt-3 font-mono text-xs text-text-tertiary">
                Top: {r.members.slice(0, 5).map((m) => m.symbol).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionLabel number="02" title="Common questions" />
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
        <SectionLabel number="03" title="Sources" />
        <ul className="mt-6 space-y-2 text-sm text-text-secondary">
          <li>
            <a
              href="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-mono text-xs text-info hover:underline"
            >
              [CoinGecko /coins/markets]
            </a>{" "}
            Market caps, snapshot fetched {formatDate(meta.market_fetched_at)}.
          </li>
          <li>
            <Link href="/scorecard" className="font-mono text-xs text-info hover:underline">
              [Early Thunder scoring pass]
            </Link>{" "}
            All scores and percentiles, pass dated {formatDate(meta.source_updated_at)}.
          </li>
        </ul>
      </Section>

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/scorecard/screen"
            className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-info/40"
          >
            <p className="text-sm font-semibold text-text-primary">Crypto screens</p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">The pass/fail versions of these filters</p>
          </Link>
          <Link
            href="/scorecard"
            className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-info/40"
          >
            <p className="text-sm font-semibold text-text-primary">Scorecard dashboard</p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">All {meta.universe_size} tokens</p>
          </Link>
          <Link
            href="/scorecard/mispriced"
            className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-info/40"
          >
            <p className="text-sm font-semibold text-text-primary">Mispricing view</p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">Fundamentals vs market cap</p>
          </Link>
        </div>
      </Section>
    </div>
  );
}
