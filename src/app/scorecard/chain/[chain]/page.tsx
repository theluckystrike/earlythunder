import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScorecardGroupHub from "@/components/ScorecardGroupHub";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getScorecardGroups, getScorecardGroup, getScorecardMeta } from "@/lib/scorecard-analytics";

interface PageParams {
  readonly params: Promise<{ readonly chain: string }>;
}

export function generateStaticParams(): { chain: string }[] {
  const groups = getScorecardGroups("chain");
  if (groups.length === 0) return [];
  return groups.map((group) => ({ chain: group.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { chain } = await params;
  const group = getScorecardGroup("chain", chain);
  if (group === null) return { title: "Chain Not Found" };

  const meta = getScorecardMeta();
  const title = `${group.name} Tokens Ranked by Fundamentals`;
  const description =
    `All ${group.count} ${group.name} tokens in the 25-variable fundamental scorecard, ranked by ` +
    `composite score. Median ${group.median_score} of ${meta.max_score}, best ${group.top_score}. ` +
    `The ${group.name} set scores highest on ${group.strongest_variables[0]?.label} and lowest on ${group.weakest_variables[0]?.label}.`;
  const url = `${SITE_URL}/scorecard/chain/${group.slug}`;

  return {
    title,
    description,
    keywords: [
      `best ${group.name} tokens`,
      `${group.name} token fundamentals`,
      `${group.name} altcoins ranked`,
      `${group.name} tokenomics comparison`,
      "crypto fundamental analysis",
    ],
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    alternates: { canonical: url },
  };
}

export default async function ChainHubPage({ params }: PageParams) {
  const { chain } = await params;
  const group = getScorecardGroup("chain", chain);
  if (group === null) notFound();

  const meta = getScorecardMeta();
  const share = Math.round((group.count / meta.universe_size) * 100);

  const intro =
    `These are the ${group.count} tokens issued on ${group.name} that carry a full 25-variable score, ` +
    `${share}% of the rated universe. Grouping by chain surfaces something a single token page cannot: ` +
    `tokens sharing a settlement layer tend to share its constraints, its regulatory treatment and its ` +
    `liquidity conditions, so the variables where this group collectively wins or loses say as much ` +
    `about ${group.name} as they do about any individual token on it. The median composite here is ` +
    `${group.median_score} of ${meta.max_score}, against a range of ${group.bottom_score} to ${group.top_score}.`;

  return (
    <ScorecardGroupHub
      group={group}
      kindPath="chain"
      kindLabel="Chain"
      title={`${group.name} tokens by fundamentals`}
      lead={`The ${group.count} ${group.name} tokens carrying a full 25-variable score, ranked against the whole ${meta.universe_size}-token universe.`}
      intro={intro}
    />
  );
}
