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

/**
 * Per-ranking copy: the question the SERP asks, the stated rule, and the
 * unique insight this dataset can defend. No invented facts; every claim
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
      "A token qualifies when its Supply Inflation variable (scored 1 to 10 across the whole universe against issuance schedules, burns and hard caps) sits in the top quartile (75th percentile or above), and market capitalisation is at least $100M so the list stays usable.",
    why:
      "Supply direction is the one input a holder can verify without trusting a roadmap. Tokens with shrinking or fixed supply do not need demand to grow for the per-token claim on the network to rise; they only need demand to stay.",
    insight:
      "The correlation work on the signal pages shows supply inflation co-moves 0.87 with the vesting-schedule variable, so most of what looks like deflation is really just finished vesting. That distinction matters: a token whose supply is flat because unlocks ended behaves differently from one where a live burn exceeds issuance. The ranking below does not separate the two. The variable column and each token page do.",
    columns: [
      { key: "supply", label: "Supply var", of: (r) => (r.supply_value === null || r.supply_value === undefined ? "n/a" : `${r.supply_value}/10`) },
    ],
  },
  "net-supply-direction": {
    question: "Which tokens shrink supply fastest after both inflation and buybacks?",
    rule:
      "Each token's Supply Inflation percentile and Buyback & Burn percentile are averaged into a single net figure, and tokens with at least $30M market cap are ranked on that average. Either variable alone can mislead. A 4% issuance schedule with a bigger burn still shrinks supply.",
    why:
      "Buyback announcements and inflation schedules are usually reported separately, which is exactly how a large issuance schedule hides behind a louder burn programme. Averaging the two percentiles is the simplest honest net figure the dataset supports.",
    insight:
      "The universe mean on buyback is 2.94 out of 10 against 4.8 on supply inflation, which is the arithmetic reason most 'deflationary' marketing fails: real, sustained burn programs are rarer than issuance schedules. The top of this list is where both variables are simultaneously strong. On the full universe, 77 tokens sit in the top quartile on both, before the $30M market-cap floor and composite-score ordering narrow it to the rows below.",
    columns: [
      { key: "supply", label: "Supply pct", of: (r) => (r.supply_pct === undefined ? "n/a" : String(r.supply_pct)) },
      { key: "buyback", label: "Buyback pct", of: (r) => (r.buyback_pct === undefined ? "n/a" : String(r.buyback_pct)) },
      { key: "net", label: "Net", of: (r) => (r.net_pct === undefined ? "n/a" : String(r.net_pct)) },
    ],
  },
  "undervalued-ps": {
    question: "Which altcoins look undervalued on price-to-sales in 2026?",
    rule:
      "A token qualifies when its Price-to-Sales variable sits in the top quartile (75th percentile or above) of the universe, composite score is used as the ordering, and market capitalisation falls between $50M and $5B. Large enough to have auditable revenue, small enough that mispricing is plausible.",
    why:
      "Every 'undervalued altcoins' list on the web is a momentum list in disguise. Price-to-sales against the same 251-token universe is a rule a reader can restate and check, and the size band keeps the comparison honest: a $300B network being 'cheap on P/S' and a $60M protocol being cheap are different claims.",
    insight:
      "Across the universe, the price-to-sales variable correlates −0.12 with log market capitalisation. The market pays slightly less for revenue the smaller the token, which is the precise sense in which small-cap revenue is systematically underpriced here. The catch is visible in the same data: low P/S clusters with tokens whose revenue trend is falling, so every row below needs its revenue-trend variable checked on the token page before the 'cheap' label means anything.",
    columns: [
      { key: "ps", label: "P/S pct", of: (r) => (r.ps_pct === undefined ? "n/a" : String(r.ps_pct)) },
    ],
  },
  "exchange-tokens": {
    question: "Which crypto exchange tokens exist and which rank best on fundamentals?",
    rule:
      "Every token in the scored universe that derives its value from operating an exchange, centralised (BNB, OKB, BGB, LEO) or decentralised (UNI, COW, AERO, GMX), ranked on composite score. No size floor because the set is small enough to show in full.",
    why:
      "Exchange-token lists on the web are affiliate roundups ordered by market cap. Ranking on composite score instead surfaces the variable that actually differs across this set: regulatory safety and exchange depth, scored identically for every token.",
    insight:
      "This set splits cleanly in the data. CEX tokens carry their exchange's regulatory risk with burn mechanics funded by trading revenue, while DEX tokens carry protocol revenue but compete on execution. The scorecard's regulatory-safety variable is where the two groups separate. Check it per row rather than assuming either group is safer as a class.",
    columns: [],
  },
  "no-unlock-overhang": {
    question: "Which cryptocurrencies have no unlock overhang?",
    rule:
      "A token qualifies when its Vesting Schedule variable (scored 1 to 10 across the universe on cliff releases, emission transparency, and how much supply is still locked) sits in the top quartile, and market capitalisation is at least $100M.",
    why:
      "Unlock calendars are the most predictable sell-pressure in crypto, and most lists cover them token by token. Ranking the inverse, the tokens with nothing waiting to vest, gives the shortlist of assets where dilution surprises are structurally off the table.",
    insight:
      "The vesting-schedule variable co-moves 0.87 with supply inflation across the universe, so this list overlaps heavily with the most-deflationary ranking, but it is not the same list. Vesting measures the calendar; inflation measures the running issuance rate. A token can have finished vesting and still run high emissions, and the two columns on each row show which case applies. Universe median on the variable is 5 of 10; 58 tokens score 7 or above.",
    columns: [
      { key: "var", label: "Vesting var", of: (r) => (r.var_value === null || r.var_value === undefined ? "n/a" : `${r.var_value}/10`) },
    ],
  },
  "real-staking-yield": {
    question: "Which cryptocurrencies pay a real staking yield?",
    rule:
      "A token qualifies when its Real Staking Yield variable (yield after the token's own inflation, scored 1 to 10) sits in the top quartile, and market capitalisation is at least $100M. Rows are ordered by composite score.",
    why:
      "Headline APRs ignore the emissions that fund them. A 20% APR paid out of 25% inflation is a 5% haircut dressed as income. Ranking on the yield that survives the token's own dilution is the only version of this question worth answering.",
    insight:
      "Real staking yield correlates just 0.03 with the vesting-schedule variable and 0.06 with the circ/FDV ratio, so yield quality is essentially independent of unlock structure, which is why this list looks little like the no-unlock list despite shared big caps at the top. Only 36 of 251 tokens score 6 or above on the variable, which is the arithmetic statement of how rare a genuinely accretive yield is. Universe median is 4 of 10.",
    columns: [
      { key: "var", label: "Yield var", of: (r) => (r.var_value === null || r.var_value === undefined ? "n/a" : `${r.var_value}/10`) },
    ],
  },
  "developer-activity": {
    question: "Which crypto projects ship the most developer activity?",
    rule:
      "A token qualifies when its Developer Activity variable (commit flow, release cadence and shipped upgrades, scored 1 to 10 across the universe) sits in the top quartile, and market capitalisation is at least $100M.",
    why:
      "Github-commit counts are the most gamed metric in the space, which is why most developer-activity lists are noise. The scorecard variable weights shipped releases and upgrade delivery over raw commit volume, and the same definition is applied to all 251 tokens.",
    insight:
      "Developer activity correlates 0.72 with the TVL-trend variable, the strongest pairwise correlation in this set of five lists, and the expected one: chains whose builders ship tend to be chains where value stays. The other side of the number is that 0.72 leaves real room for divergence, so a high-commit/low-TVL row here is exactly the 'GitHub theatre' case the variable is built to catch. Universe median is 5 of 10.",
    columns: [
      { key: "var", label: "Dev var", of: (r) => (r.var_value === null || r.var_value === undefined ? "n/a" : `${r.var_value}/10`) },
    ],
  },
  "smart-money-accumulation": {
    question: "Which crypto tokens are smart money accumulating?",
    rule:
      "A token qualifies when its Smart Money variable (fund wallets, known accumulators and insider buy-side behaviour, scored 1 to 10) sits in the top quartile, and market capitalisation is at least $100M.",
    why:
      "On-chain smart-money dashboards show raw wallet flows with no context. Here the same signal is scored against the whole universe with the same rubric, then ordered by composite score so a wallet-flow headline cannot outrank a token with broken fundamentals.",
    insight:
      "Smart money correlates only 0.41 with the insider-selling variable, which is the honest caveat for this whole list: accumulation and insider distribution are related but distinct signals, and 0.41 means plenty of tokens score well on one and badly on the other. Read the insider-selling variable on each token page before treating an accumulation signal as a one-sided story. Universe median is 4 of 10; 25 tokens score 7 or above.",
    columns: [
      { key: "var", label: "Smart $ var", of: (r) => (r.var_value === null || r.var_value === undefined ? "n/a" : `${r.var_value}/10`) },
    ],
  },
  "institutional-adoption": {
    question: "Which crypto tokens have real institutional adoption?",
    rule:
      "A token qualifies when its Institutional Adoption variable (ETFs, corporate treasuries, custody coverage and regulated market access, scored 1 to 10) sits in the top quartile, and market capitalisation is at least $100M.",
    why:
      "Institutional adoption lists on the web are usually ETF-filing news recycled into a table. This ranking applies one scored definition of regulated access, custody and treasury holdings across all 251 tokens, so the small-cap rows have met the same bar as the ETF names.",
    insight:
      "Institutional adoption correlates 0.56 with exchange depth, which is mostly mechanical: regulated access products need deep markets to route into. The useful consequence runs the other way, because tokens with thin exchange depth are structurally excluded from institutional flows regardless of fundamentals, so check the exchange-depth variable on the token page before expecting an adoption signal to translate into liquidity. Universe median is 3 of 10, the lowest of the five single-variable lists here.",
    columns: [
      { key: "var", label: "Inst. var", of: (r) => (r.var_value === null || r.var_value === undefined ? "n/a" : `${r.var_value}/10`) },
    ],
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
          <div className="mt-6 rounded-2xl border border-border bg-bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">The rule</p>
            <p className="mt-2 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">{copy.rule}</p>
          </div>
          <Prose>{copy.why}</Prose>
        </Section>
      )}

      {copy && (
        <Section>
          <SectionLabel number="02" title="The insight this dataset adds" />
          <div className="mt-6 border-l-2 border-info/40 pl-5">
            <Prose>{copy.insight}</Prose>
          </div>
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
                      {m.name}
                      <span aria-hidden="true" className="ml-1.5 font-mono text-xs text-text-tertiary">{m.symbol}</span>
                      <span className="sr-only">{" "}{m.symbol}</span>
                    </Link>
                  </td>
                  {copy?.columns.map((c) => (
                    <td key={c.key} className="py-3 pr-3 font-mono text-xs text-text-secondary">{c.of(m)}</td>
                  ))}
                  <td className="py-3 pr-3 font-mono text-text-primary">{m.score}/250</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${verdictTone(m.verdict_color)}`}
                    >
                      {m.verdict}
                    </span>
                  </td>
                  <td className={`py-3 pr-3 font-mono text-xs ${m.market_cap === null ? "text-text-tertiary" : "text-text-secondary"}`}>
                    {m.market_cap === null ? "n/a" : formatUsd(m.market_cap)}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-text-tertiary">
                    {m.dilution_x === null ? "n/a" : `${m.dilution_x}x`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
          Scores are from the research pass dated {formatDate(meta.source_updated_at)} and do not move
          with price. Market caps are from the snapshot fetched {formatDate(meta.market_fetched_at)}.
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
        <SectionLabel number={copy ? "05" : "03"} title="Sources" />
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
            All 25-variable scores and percentiles, pass dated {formatDate(meta.source_updated_at)}.
          </li>
          <li className="text-text-tertiary">
            Each token page carries its own claim-level source list, including sources whose links have
            gone dead (marked unverified, not dropped).
          </li>
        </ul>
      </Section>

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getAllRankings()
            .filter((r) => r.slug !== ranking.slug)
            .slice(0, 3)
            .map((r) => (
              <Link
                key={r.slug}
                href={`/rankings/${r.slug}`}
                className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-info/40"
              >
                <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                <p className="mt-1 font-mono text-xs text-text-tertiary">{r.count} tokens</p>
              </Link>
            ))}
          <Link
            href="/scorecard/screen"
            className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-info/40"
          >
            <p className="text-sm font-semibold text-text-primary">Crypto screens</p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">Same universe, question-driven</p>
          </Link>
        </div>
      </Section>
    </div>
  );
}
