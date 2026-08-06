import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScorecardGroupHub from "@/components/ScorecardGroupHub";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getScorecardGroups, getScorecardGroup, getScorecardMeta } from "@/lib/scorecard-analytics";

interface PageParams {
  readonly params: Promise<{ readonly verdict: string }>;
}

/**
 * What each verdict band means. Written once here rather than derived, because
 * these are definitions of the framework, not measurements of the group.
 */
const VERDICT_MEANING: Record<string, string> = {
  "hold-core":
    "A core position. These tokens clear the framework on cash flow, supply and institutional standing at the same time, which almost nothing in the rated universe does.",
  hold:
    "Worth holding at current weight. The fundamentals stand up across most of the 25 variables, with specific weaknesses that are known and priced rather than hidden.",
  "cautious-hold":
    "Held, but on notice. Enough of the framework still works to justify a position, while at least one variable is deteriorating fast enough to matter.",
  watch:
    "Not a position. Something in the token is genuinely interesting, but the scored fundamentals do not yet support capital, so it earns attention rather than allocation.",
  pass:
    "Screened out. These tokens fail the framework badly enough that no entry price makes the risk sensible on the evidence gathered in this pass.",
};

export function generateStaticParams(): { verdict: string }[] {
  const groups = getScorecardGroups("verdict");
  if (groups.length === 0) return [];
  return groups.map((group) => ({ verdict: group.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { verdict } = await params;
  const group = getScorecardGroup("verdict", verdict);
  if (group === null) return { title: "Verdict Not Found" };

  const meta = getScorecardMeta();
  const title = `Tokens Rated ${group.name}`;
  const description =
    `All ${group.count} of ${meta.universe_size} tokens rated ${group.name} on the 25-variable ` +
    `fundamental framework, ranked by score. Median ${group.median_score} of ${meta.max_score}. ` +
    `Strongest collectively on ${group.strongest_variables[0]?.label}, weakest on ${group.weakest_variables[0]?.label}.`;
  const url = `${SITE_URL}/scorecard/verdict/${group.slug}`;

  return {
    title,
    description,
    keywords: [
      `crypto tokens rated ${group.name.toLowerCase()}`,
      "altcoin scorecard",
      "crypto fundamental analysis",
      "token rankings by fundamentals",
      "which altcoins to sell",
    ],
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    alternates: { canonical: url },
  };
}

export default async function VerdictHubPage({ params }: PageParams) {
  const { verdict } = await params;
  const group = getScorecardGroup("verdict", verdict);
  if (group === null) notFound();

  const meta = getScorecardMeta();
  const meaning =
    VERDICT_MEANING[group.slug] ??
    `Tokens the framework assigned a ${group.name} verdict in the most recent scoring pass.`;

  const intro =
    `${meaning} Across the ${group.count} tokens in this band the median composite is ` +
    `${group.median_score} of ${meta.max_score}, running from ${group.bottom_score} at the bottom to ` +
    `${group.top_score} at the top. The aggregate below shows where the band earns its score and ` +
    `where it consistently falls short, which is usually more informative than any single member.`;

  return (
    <ScorecardGroupHub
      group={group}
      kindPath="verdict"
      title={`Tokens rated ${group.name}`}
      lead={`Every token the 25-variable framework rated ${group.name}, ranked by composite score against the full ${meta.universe_size}-token universe.`}
      intro={intro}
    />
  );
}
