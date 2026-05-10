import type { Metadata } from "next";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  TWITTER_HANDLE,
} from "./constants";
import type { Opportunity, BlogPost } from "./types";

const DEFAULT_KEYWORDS = [
  "crypto opportunities", "asymmetric investing", "pre-mainstream",
  "digital assets", "deep tech", "emerging markets", "signal analysis",
  "smart money", "opportunity tracker", "early thunder",
] as const;

const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`;

/** Root layout metadata with template support. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: `${SITE_NAME} | ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/** Metadata for the opportunities listing page. */
export const opportunitiesPageMetadata: Metadata = {
  title: "Opportunities",
  description: "Explore pre-mainstream asymmetric opportunities scored by the 8-Signal Pattern Filter across crypto, deep tech, and emerging markets.",
  openGraph: {
    title: `Opportunities | ${SITE_NAME}`,
    description: "Explore pre-mainstream asymmetric opportunities scored by the 8-Signal Pattern Filter.",
    url: `${SITE_URL}/opportunities`,
  },
  alternates: { canonical: `${SITE_URL}/opportunities` },
};

export const methodologyPageMetadata: Metadata = {
  title: "Methodology",
  description:
    "How the 8-Signal Pattern Filter evaluates opportunities across eight dimensions to identify asymmetric setups before the crowd.",
  openGraph: {
    title: `Methodology | ${SITE_NAME}`,
    description:
      "The 8-Signal Pattern Filter. How Early Thunder scores and ranks pre-mainstream opportunities.",
    url: `${SITE_URL}/methodology`,
  },
  alternates: { canonical: `${SITE_URL}/methodology` },
};

/** Metadata for the graveyard page. */
export const graveyardPageMetadata: Metadata = {
  title: "Opportunity Graveyard",
  description:
    "Transparent record of failed theses and invalidated opportunities with full post-mortems. Every miss contains a lesson.",
  openGraph: {
    title: `Opportunity Graveyard | ${SITE_NAME}`,
    description:
      "Every dead thesis contains a lesson. A transparent record of what went wrong and why.",
    url: `${SITE_URL}/graveyard`,
  },
  alternates: { canonical: `${SITE_URL}/graveyard` },
};

/** Metadata for the pricing page. */
export const pricingPageMetadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the plan that fits your investment research needs. Free tier available with full signal breakdowns on premium plans.",
  openGraph: {
    title: `Pricing | ${SITE_NAME}`,
    description:
      "Access pre-mainstream opportunity intelligence. Free and premium plans available.",
    url: `${SITE_URL}/pricing`,
  },
  alternates: { canonical: `${SITE_URL}/pricing` },
};

/** Metadata for the blog listing page. */
export const blogPageMetadata: Metadata = {
  title: "Blog",
  description:
    "Research notes, market analysis, and deep dives into asymmetric opportunities from Early Thunder.",
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description:
      "Research notes, market analysis, and deep dives from Early Thunder.",
    url: `${SITE_URL}/blog`,
  },
  alternates: { canonical: `${SITE_URL}/blog` },
};

/** Metadata for the intelligence dashboard page. */
export const intelligencePageMetadata: Metadata = {
  title: "Intelligence Dashboard",
  description:
    "Real-time convergence signal tracker. Monitor 8-signal pattern scores, smart money flows, airdrop calibration, and catalyst timelines across crypto and DeFi.",
  keywords: [
    "crypto intelligence",
    "convergence signals",
    "smart money tracker",
    "DeFi dashboard",
    "airdrop calibration",
    "catalyst timeline",
    "signal analysis",
  ],
  openGraph: {
    title: `Intelligence Dashboard | ${SITE_NAME}`,
    description:
      "Real-time convergence signal tracker. Monitor smart money flows, airdrop calibration, and catalyst timelines.",
    url: `${SITE_URL}/intelligence`,
  },
  alternates: { canonical: `${SITE_URL}/intelligence` },
};

/** Metadata for the research hub page. */
export const researchPageMetadata: Metadata = {
  title: "Research",
  description:
    "Deep-dive research articles covering DeFi exploits, airdrop performance data, tokenless protocol TVL analysis, and asymmetric opportunity breakdowns.",
  keywords: [
    "crypto research",
    "DeFi analysis",
    "airdrop performance",
    "tokenless protocols",
    "TVL analysis",
    "smart money research",
  ],
  openGraph: {
    title: `Research | ${SITE_NAME}`,
    description:
      "Deep-dive research articles on DeFi, airdrops, tokenless protocols, and asymmetric opportunities.",
    url: `${SITE_URL}/research`,
  },
  alternates: { canonical: `${SITE_URL}/research` },
};

/** Research article title/description map for metadata generation. */
const RESEARCH_META: Record<
  string,
  { readonly title: string; readonly description: string }
> = {
  "kelp-exploit-analysis": {
    title: "Kelp Exploit Analysis",
    description:
      "Forensic breakdown of the Kelp DeFi exploit — attack vectors, fund flows, and lessons for protocol security.",
  },
  "airdrop-performance-data": {
    title: "Airdrop Performance Data",
    description:
      "Historical airdrop ROI analysis across 200+ token distributions with expected-value calculations and farming strategy insights.",
  },
  "tokenless-protocols-tvl-2026": {
    title: "Tokenless Protocols TVL 2026",
    description:
      "Comprehensive TVL tracker for protocols without tokens in 2026. Identify the highest-potential airdrop targets by capital flows.",
  },
  "lqty-v2-value-break": {
    title: "LQTY v2 Value Break Analysis",
    description:
      "Deep-dive into Liquity v2 value accrual mechanics — protocol revenue, token utility changes, and valuation gap assessment.",
  },
  "crypto-intelligence-brief-week-of-2026-05-09": {
    title: "Crypto Intelligence Brief — Week of May 9, 2026",
    description:
      "Weekly intelligence brief covering market-moving signals, convergence events, and asymmetric setups for the week of May 9, 2026.",
  },
  "commonware-analysis-potential-1000x-2500x-roi-opportunity": {
    title: "Commonware Analysis: 1000x-2500x ROI Opportunity",
    description:
      "Full-stack analysis of Commonware — architecture review, team assessment, and quantified ROI thesis for early participants.",
  },
  "gains-network-analysis-smart-money-score-86-with-40-tvl-surge": {
    title: "Gains Network: Smart Money Score 86 with 40% TVL Surge",
    description:
      "Gains Network deep-dive — smart money score 86/100, 40% TVL surge analysis, and decentralized perpetuals market positioning.",
  },
  "commonware-deep-alpha": {
    title: "Commonware Deep Alpha",
    description:
      "Extended alpha research on Commonware — technical architecture deep-dive, competitive moat analysis, and conviction-level thesis.",
  },
  "the-23-billion-divergence": {
    title: "The $23 Billion Divergence",
    description:
      "Analysis of the $23B divergence between DeFi fundamentals and token valuations — where the gap is widest and how to position.",
  },
  "genius-act-countdown": {
    title: "GENIUS Act Countdown",
    description:
      "Regulatory intelligence on the GENIUS Act — timeline, market impact scenarios, and which crypto sectors benefit most.",
  },
  "ai-crypto-convergence": {
    title: "AI-Crypto Convergence",
    description:
      "Mapping the intersection of artificial intelligence and crypto — infrastructure plays, data markets, and the convergence trade thesis.",
  },
  "rwa-tokenization-tripled": {
    title: "RWA Tokenization Tripled",
    description:
      "Real World Asset tokenization has tripled — sector breakdown, protocol comparison, and the institutional capital pipeline driving growth.",
  },
  "infrastructure-monopoly-map": {
    title: "Infrastructure Monopoly Map",
    description:
      "Visual mapping of crypto infrastructure monopolies — who controls the critical layers and where challenger opportunities exist.",
  },
};

/** Generate metadata for an individual research article page. */
export function getResearchArticleMetadata(slug: string): Metadata {
  const meta = RESEARCH_META[slug];
  if (!meta) {
    return { title: "Research Article Not Found" };
  }

  const url = `${SITE_URL}/research/${slug}`;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
    },
    alternates: { canonical: url },
  };
}

/** Generate metadata for an individual opportunity page. */
export function getOpportunityMetadata(opp: Opportunity): Metadata {
  if (!opp || typeof opp.slug !== "string") {
    return { title: "Opportunity Not Found" };
  }

  const title = opp.ticker
    ? `${opp.name} (${opp.ticker})`
    : opp.name;
  const description = opp.one_liner;
  const url = `${SITE_URL}/opportunities/${opp.slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    alternates: { canonical: url },
  };
}

/** Generate metadata for an individual blog post page. */
export function getBlogPostMetadata(post: BlogPost): Metadata {
  if (!post || typeof post.slug !== "string") {
    return { title: "Post Not Found" };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const description = post.excerpt;

  return {
    title: post.title,
    description,
    authors: [{ name: post.author }],
    openGraph: {
      title: `${post.title} | ${SITE_NAME}`,
      description,
      url,
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author],
      tags: [...post.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${SITE_NAME}`,
      description,
    },
    alternates: { canonical: url },
  };
}
