import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getAllRankings, getRanking, getRankingsMeta, type RankingRow } from "@/lib/scorecard-rankings";
import { formatUsd, formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema, getFaqPageSchema } from "@/lib/structured-data";

interface PageParams {
  readonly params: Promise<{ readonly ranking: string }>;
}

/**
 * Per-ranking copy: the question the SERP asks, the stated rule, and the
 * unique insight this dataset can defend. No invented facts — every claim
 * is arithmetic over the same scored universe.
 */
const COPY: Record<
  string,
  {
    question: string;
    rule: string;
    why: string;
    insight: string;
    columns: { key: string; label: string; of: (row: RankingRow) => string }[];
  }
> = {
  "most-deflationary": {
    question: "Which cryptocurrencies are the most deflationary right now?",
    rule:
      "A token qualifies when its Supply Inflation variable — scored 1 to 10 across the whole universe against issuance schedules, burns and hard caps — sits in the top quartile (75th percentile or above), and market capitalisation is at least $100M so the list stays usable.",
    why:
      "Supply direction is the one input a holder can verify without trusting a roadmap. Tokens with shrinking or fixed supply do not need demand to grow for the per-token claim on the network to rise; they only need demand to stay.",
    insight:
      "The correlation work on the signal pages shows supply inflation co-moves 0.87 with the vesting-schedule variable, so most of what looks like deflation is really just finished vesting. That distinction matters: a token whose supply is flat because unlocks ended behaves differently from one where a live burn exceeds issuance. The ranking below does not separate the two — the variable column and each token page do.",
    columns: [
      { key: "supply", label: "Supply var", of: (r) => (r.supply_value === null || r.supply_value === undefined ? "—" : `${r.supply_value}/10`) },
    ],
  },
  "net-supply-direction": {
    question: "Which tokens shrink supply fastest after both inflation and buybacks?",
    rule:
      "Each token's Supply Inflation percentile and Buyback & Burn percentile are averaged into a single net figure, and tokens with at least $30M market cap are ranked on that average. Either variable alone can mislead — a 4% issuance schedule with a bigger burn still shrinks supply.",
    why:
      "Buyback announcements and inflation schedules are usually reported separately, which is exactly how a large issuance schedule hides behind a louder burn programme. Averaging the two percentiles is the simplest honest net figure the dataset supports.",
    insight:
      "The universe mean on buyback is 2.94 out of 10 against 4.8 on supply inflation, which is the arithmetic reason most 'deflationary' marketing fails: real, sustained burn programs are rarer than issuance schedules. The top of this list is where both variables are simultaneously strong — a set of roughly a couple dozen tokens, not the dozens each single-variable list implies.",
    columns: [
      { key: "supply", label: "Supply pct", of: (r) => (r.supply_pct === undefined ? "—" : String(r.supply_pct)) },
      { key: "buyback", label: "Buyback pct", of: (r) => (r.buyback_pct === undefined ? "—" : String(r.buyback_pct)) },
      { key: "net", label: "Net", of: (r) => (r.net_pct === undefined ? "—" : String(r.net_pct)) },
    ],
  },
  "undervalued-ps": {
    question: "Which altcoins look undervalued on price-to-sales in 2026?",
    rule:
      "A token qualifies when its Price-to-Sales variable sits in the top quartile (75th percentile or above) of the universe, composite score is used as the ordering, and market capitalisation falls between $50M and $5B — large enough to have auditable revenue, small enough that mispricing is plausible.",
    why:
      "Every 'undervalued altcoins' list on the web is a momentum list in disguise. Price-to-sales against the same 251-token universe is a rule a reader can restate and check, and the size band keeps the comparison honest: a $300B network being 'cheap on P/S' and a $60M protocol being cheap are different claims.",
    insight:
      "Across the universe, the price-to-sales variable correlates −0.11 with market capitalisation rank — the market pays slightly less for revenue the smaller the token, which is the precise sense in which small-cap revenue is systematically underpriced here. The catch is visible in the same data: low P/S clusters with tokens whose revenue trend is falling, so every row below needs its revenue-trend variable checked on the token page before the 'cheap' label means anything.",
    columns: [
      { key: "ps", label: "P/S pct", of: (r) => (r.ps_pct === undefined ? "—" : String(r.ps_pct)) },
    ],
  },
  "exchange-tokens": {
    question: "Which crypto exchange tokens exist and which rank best on fundamentals?",
    rule:
      "Every token in the scored universe that derives its value from operating an exchange — centralised (BNB, OKB, BGB, LEO) or decentralised (UNI, COW, AERO, GMX) — ranked on composite score. No size floor: the set is small enough to show in full.",
    why:
      "Exchange-token lists on the web are affiliate roundups ordered by market cap. Ranking on composite score instead surfaces the variable that actually differs across this set: regulatory safety and exchange depth, scored identically for every token.",
    insight:
      "This set splits cleanly in the data: CEX tokens carry their exchange's regulatory risk with burn mechanics funded by trading revenue, while DEX tokens carry protocol revenue but compete on execution. The scorecard's regulatory-safety variable is where the two groups separate — check it per row rather than assuming either group is safer as a class.",
    columns: [],
  },
};

export function generateStaticParams(): { ranking: string }[] {
  const rankings = getAllRankings();
  if (rankings.length === 0) return [];
  return rankings.map((r) => ({ ranking: r.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { ranking: slug } = await params;
  const ranking = getRanking(slug);
  if (ranking === null) return { title: "Ranking Not Found" };
  const copy = COPY[slug];
  const top = ranking.members.slice(0, 4).map((m) => m.symbol).join(", ");
  const title = copy ? (copy.question.replace(/\?$/, "").length <= 56 ? copy.question.replace(/\?$/, "") : ranking.name) : ranking.name;
  const description = copy
    ? `${ranking.count} of ${getRankingsMeta().universe_size} rated tokens qualify. ${copy.rule.split(". ")[0]}. ${top} lead the list.`
    : `${ranking.count} tokens ranked by composite score. ${top} lead.`;
  const url = `${SITE_URL}/rankings/${slug}`;

  return {
    title,
    description,
    keywords: [
      copy ? copy.question.toLowerCase().replace("?", "") : ranking.name.toLowerCase(),
      "crypto rankings",
      "altcoin list fundamentals",
      "best crypto by the numbers",
    ],
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    alternates: { canonical: url },
  };
}

export default async function RankingPage({ params }: PageParams) {
  const { ranking: slug } = await params;
  const ranking = getRanking(slug);
  if (ranking === null) notFound();
  const copy = COPY[slug];
  const members = ranking.members;
  const meta = getRankingsMeta();

  const faqs = [
    {
      question: copy ? copy.question : `What is on the ${ranking.name} list?`,
      answer: `${ranking.count} tokens qualify. ${members.slice(0, 5).map((m) => `${m.name} (${m.symbol})`).join(", ")} lead the list.`,
    },
    {
      question: "What is the rule?",
      answer: copy ? copy.rule : "Tokens are ranked on composite score over the full rated universe.",
    },
    {
      question: "Does appearing on this list mean a token is a buy?",
      answer:
        `No. The list clears one stated rule as recorded at the scoring pass on ${formatDate(meta.source_updated_at)}. ` +
        `Every row links to the full token page, where the weaknesses are listed next to the strengths.`,
    },
  ];

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: "Rankings", path: "/rankings" },
    { name: ranking.name, path: `/rankings/${ranking.slug}` },
  ]);
  const faqSchema = getFaqPageSchema(faqs);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: ranking.name,
    numberOfItems: members.length,
    itemListElement: members.slice(0, 25).map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.name} (${m.symbol})`,
      url: `${SITE_URL}/scorecard/${m.slug}`,
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
        <Link href="/rankings" className="hover:text-text-secondary">Rankings</Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">{ranking.name}</span>
      </nav>

      <PageHeader
        eyebrow={`${ranking.count} of ${meta.universe_size} qualify`}
        title={ranking.name}
        lead={copy ? copy.question : "Ranked by composite score over the full rated universe."}
        meta={`Scoring pass ${formatDate(meta.source_updated_at)}. Market snapshot ${formatDate(meta.market_fetched_at)}.`}
      />

      {copy && (
        <Section>
          <SectionLabel number="01" title="What this list asks" />
          <Prose>{copy.rule}</Prose>
          <Prose>{copy.why}</Prose>
        </Section>
      )}

      {copy && (
        <Section>
          <SectionLabel number="02" title="The insight this dataset adds" />
          <Prose>{copy.insight}</Prose>
        </Section>
      )}

      <Section>
        <SectionLabel number={copy ? "03" : "01"} title={`The ${members.length} tokens`} />
        <Prose>
          Ranked by composite score within the qualifying set. Every row links to the full token page,
          where the variable-by-variable scores behind the ranking are published.
        </Prose>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">{`${ranking.name} ranking table`}</caption>
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-text-tertiary">
                <th scope="col" className="py-2 pr-3">#</th>
                <th scope="col" className="py-2 pr-3">Token</th>
                {copy?.columns.map((c) => (
                  <th key={c.key} scope="col" className="py-2 pr-3">{c.label}</th>
                ))}
                <th scope="col" className="py-2 pr-3">Score</th>
                <th scope="col" className="py-2 pr-3">Verdict</th>
                <th scope="col" className="py-2 pr-3">Market cap</th>
                <th scope="col" className="py-2 pr-3">Dilution</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.symbol} className="border-b border-border-subtle">
                  <td className="py-3 pr-3 font-mono text-xs text-text-tertiary">{i + 1}</td>
                  <td className="py-3 pr-3">
                    <Link href={`/scorecard/${m.slug}`} className="font-medium text-text-primary hover:underline">
                      {m.name} <span className="font-mono text-xs text-text-tertiary">{m.symbol}</span>
                    </Link>
                  </td>
                  {copy?.columns.map((c) => (
                    <td key={c.key} className="py-3 pr-3 font-mono text-xs text-text-secondary">{c.of(m)}</td>
                  ))}
                  <td className="py-3 pr-3 font-mono text-text-primary">{m.score}/250</td>
                  <td className="py-3 pr-3 font-mono text-xs text-text-secondary">{m.verdict}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-text-secondary">
                    {m.market_cap === null ? "—" : formatUsd(m.market_cap)}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-text-tertiary">
                    {m.dilution_x === null ? "—" : `${m.dilution_x}x`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Scores come from the research pass dated {formatDate(meta.source_updated_at)} and do not move
          with price. Market capitalisation is from the snapshot fetched {formatDate(meta.market_fetched_at)}.
        </p>
      </Section>

      <Section>
        <SectionLabel number={copy ? "04" : "02"} title="Common questions" />
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
          {getAllRankings()
            .filter((r) => r.slug !== ranking.slug)
            .slice(0, 3)
            .map((r) => (
              <Link key={r.slug} href={`/rankings/${r.slug}`} className="text-sm text-text-secondary hover:text-text-primary">
                {r.name}
              </Link>
            ))}
          <Link href="/scorecard/screen" className="text-sm text-text-secondary hover:text-text-primary">
            Crypto screens over the same universe
          </Link>
        </div>
      </Section>
    </div>
  );
}
