import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHeader, SectionLabel, Prose, EyebrowLabel, Section } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import type { ScorecardGroup } from "@/lib/scorecard-analytics";
import { getScorecardMeta } from "@/lib/scorecard-analytics";
import { ordinal, formatUsd, formatDate } from "@/lib/scorecard-insight";
import { getBreadcrumbListSchema } from "@/lib/structured-data";

/** Structured data lists are bounded so a large group cannot bloat the head. */
const MAX_SCHEMA_ITEMS = 50;

interface Props {
  readonly group: ScorecardGroup;
  /** Path segment under /scorecard, either "verdict" or "chain". */
  readonly kindPath: string;
  /** Human label for the breadcrumb, e.g. "Verdict". */
  readonly kindLabel: string;
  /** Page title, e.g. "Tokens rated PASS". */
  readonly title: string;
  /** One-sentence lead under the title. */
  readonly lead: string;
  /** Opening paragraph explaining what the group means. */
  readonly intro: string;
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
 * Shared renderer for the scorecard hub pages. Both verdict bands and chains
 * answer the same question, which tokens belong to this group and how do they
 * rank, so they share one layout and one set of computed aggregates.
 */
export default function ScorecardGroupHub({
  group,
  kindPath,
  kindLabel,
  title,
  lead,
  intro,
}: Props) {
  if (!group || !Array.isArray(group.members) || group.members.length === 0) return null;

  const meta = getScorecardMeta();
  const path = `/scorecard/${kindPath}/${group.slug}`;
  const url = `${SITE_URL}${path}`;

  const breadcrumbs = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Scorecard", path: "/scorecard" },
    { name: group.name, path },
  ]);

  const listSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description: lead,
    url,
    numberOfItems: group.members.length,
    itemListElement: group.members.slice(0, MAX_SCHEMA_ITEMS).map((member, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${member.name} (${member.symbol})`,
      url: `${SITE_URL}/scorecard/${member.slug}`,
    })),
  };

  const shareOfUniverse = Math.round((group.count / meta.universe_size) * 100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={listSchema} />

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-tertiary">
        <Link href="/" className="hover:text-text-secondary">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/scorecard" className="hover:text-text-secondary">
          Scorecard
        </Link>
        <span className="px-2">/</span>
        <span className="text-text-secondary">
          {kindLabel}: {group.name}
        </span>
      </nav>

      <PageHeader
        title={title}
        lead={lead}
        meta={`${group.count} of ${meta.universe_size} rated tokens (${shareOfUniverse}%). Scoring pass ${formatDate(meta.source_updated_at)}.`}
      />

      <Section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">Tokens</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-text-primary">{group.count}</div>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Median score
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold text-text-primary">
              {group.median_score}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">of {meta.max_score}</div>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">Best</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-positive">{group.top_score}</div>
            <div className="mt-1 text-xs text-text-tertiary">{group.members[0].symbol}</div>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">Weakest</div>
            <div className="mt-2 font-mono text-2xl font-semibold text-negative">
              {group.bottom_score}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">
              {group.members[group.members.length - 1].symbol}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionLabel number="01" title="What this group has in common" />
        <Prose>{intro}</Prose>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-bg-card p-6">
            <EyebrowLabel>Collectively strongest on</EyebrowLabel>
            <ul className="space-y-2">
              {group.strongest_variables.map((variable) => (
                <li key={variable.key} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{variable.label}</span>
                  <span className="font-mono text-positive">{variable.mean}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-6">
            <EyebrowLabel>Collectively weakest on</EyebrowLabel>
            <ul className="space-y-2">
              {group.weakest_variables.map((variable) => (
                <li key={variable.key} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{variable.label}</span>
                  <span className="font-mono text-negative">{variable.mean}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-text-tertiary">
          Figures are the mean 1-to-10 score across all {group.count} members of the group, so they
          describe the group as a whole rather than any single token.
        </p>
      </Section>

      <Section>
        <SectionLabel number="02" title="Ranked members" />
        <Prose>
          Ordered by composite score. The rank column is the position across the whole{" "}
          {meta.universe_size}-token universe, not within this group, so it shows where each member
          stands against everything else that was rated.
        </Prose>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full font-mono text-sm">
            <caption className="sr-only">
              {group.count} tokens in the {group.name} group, ranked by composite score
            </caption>
            <thead>
              <tr className="border-b border-border bg-bg-card text-left">
                <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
                  Rank
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
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary"
                >
                  Market cap
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary"
                >
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
              {group.members.map((member) => (
                <tr key={member.symbol} className="border-b border-border/40 align-top hover:bg-bg-card/50">
                  <td className="px-3 py-2.5 text-text-tertiary">{member.rank_overall}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/scorecard/${member.slug}`}
                      className="font-semibold text-info hover:underline"
                    >
                      {member.symbol}
                    </Link>
                    <div className="text-xs text-text-tertiary">{member.name}</div>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-text-primary">{member.score}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${verdictTone(member.verdict_color)}`}
                    >
                      {member.verdict}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary">
                    {member.market_cap === null ? "-" : formatUsd(member.market_cap)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-secondary">
                    {member.dilution_x === null ? "-" : `${member.dilution_x}x`}
                  </td>
                  <td className="hidden max-w-md whitespace-normal px-3 py-2.5 text-xs leading-snug text-text-secondary lg:table-cell">
                    {member.one_liner}
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

      <Section divider>
        <EyebrowLabel>Keep reading</EyebrowLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/scorecard"
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              All {meta.universe_size} rated tokens
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              The full ranking and the method behind the 25 variables.
            </span>
          </Link>
          <Link
            href={`/scorecard/${group.members[0].slug}`}
            className="block rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="block text-sm font-semibold text-text-primary">
              {group.members[0].name} ({group.members[0].symbol}), the group leader
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
              {group.members[0].score} of {meta.max_score}, {ordinal(group.members[0].rank_overall)}{" "}
              across the whole universe.
            </span>
          </Link>
        </div>
      </Section>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-text-tertiary">
        This is research and analysis, not investment advice. {SITE_NAME} scores are one framework
        applied consistently across {meta.universe_size} tokens, not a prediction of price.
      </p>
    </div>
  );
}
