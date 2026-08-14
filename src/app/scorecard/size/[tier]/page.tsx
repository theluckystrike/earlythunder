import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScorecardGroupHub from "@/components/ScorecardGroupHub";
import { Prose } from "@/components/PageChrome";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { getScorecardMeta } from "@/lib/scorecard-analytics";
import {
  getAllTiers,
  getTier,
  tierRange,
  tierPricingReading,
} from "@/lib/scorecard-tiers";

interface PageParams {
  readonly params: Promise<{ readonly tier: string }>;
}

/**
 * What each band is for. Written here because these are statements about how
 * to use a size bracket, not measurements of the tokens inside one.
 */
const TIER_MEANING: Record<string, string> = {
  "mega-cap":
    "The assets an allocator can size a real position in without moving the price. Liquidity and regulated access are effectively solved here, so the framework is mostly measuring what is left: whether the protocol earns anything and whether anyone still builds on it.",
  "large-cap":
    "Established enough to be listed everywhere and small enough that a good quarter still changes the price. Score and market cap disagree more usefully here than in any other band.",
  "mid-cap":
    "Large enough to have a real product and a real user base, small enough that a single catalyst can reprice the asset. Depth starts to matter here, and the framework scores it.",
  "small-cap":
    "Small enough that most of these are one failed quarter from irrelevance and one working product from a rerating. The distribution of scores inside this band is wider than in any band above it.",
  "micro-cap":
    "The bottom of the rated universe by size. Most of these fail the framework, which is the honest finding. The reason to publish the band is that the handful that do not are invisible from anywhere else.",
};

export function generateStaticParams(): { tier: string }[] {
  const tiers = getAllTiers();
  if (tiers.length === 0) return [];
  return tiers.map((tier) => ({ tier: tier.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { tier: slug } = await params;
  const tier = getTier(slug);
  if (tier === null) return { title: "Size Band Not Found" };

  const meta = getScorecardMeta();
  const title = `Best ${tier.name} Crypto by Fundamentals`;
  const description =
    `All ${tier.count} rated tokens valued ${tierRange(tier)}, scored on the same 25 fundamental ` +
    `variables and ranked against each other. Median ${tier.median_score} of ${meta.max_score}, ` +
    `from ${tier.bottom_score} to ${tier.top_score}. Strongest collectively on ` +
    `${tier.strongest_variables[0]?.label}, weakest on ${tier.weakest_variables[0]?.label}.`;
  const url = `${SITE_URL}/scorecard/size/${tier.slug}`;

  return {
    title,
    description,
    keywords: [
      `best ${tier.name.toLowerCase()} crypto`,
      `${tier.name.toLowerCase()} altcoins ranked`,
      `top ${tier.name.toLowerCase()} cryptocurrencies by fundamentals`,
      `undervalued ${tier.name.toLowerCase()} crypto`,
      "altcoin scorecard by market cap",
    ],
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
    alternates: { canonical: url },
  };
}

export default async function TierHubPage({ params }: PageParams) {
  const { tier: slug } = await params;
  const tier = getTier(slug);
  if (tier === null) notFound();

  const meta = getScorecardMeta();
  const meaning =
    TIER_MEANING[tier.slug] ??
    `Every rated token with a market capitalisation of ${tierRange(tier)}.`;

  const intro =
    `${meaning} Across the ${tier.count} tokens in this band the median composite is ` +
    `${tier.median_score} of ${meta.max_score}, running from ${tier.bottom_score} to ` +
    `${tier.top_score}. Size is the only thing every member has in common, which is what makes ` +
    `the spread of scores inside it worth looking at.`;

  return (
    <ScorecardGroupHub
      group={tier}
      kindPath="size"
      title={`Best ${tier.name.toLowerCase()} crypto by fundamentals`}
      lead={`Every rated token valued ${tierRange(tier)}, scored on the same 25 variables and ranked against each other rather than against the whole market.`}
      intro={intro}
      insight={<Prose>{tierPricingReading(tier)}</Prose>}
    />
  );
}
