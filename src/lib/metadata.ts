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
  description:
    "Sortable, filterable table of pre-mainstream asymmetric opportunities scored 0-100 by the 8-Signal Pattern Filter. Compare composite scores, signal breakdowns, and catalyst timelines across crypto, deep tech, and emerging markets.",
  keywords: [
    "asymmetric opportunities",
    "8-signal pattern filter",
    "crypto opportunity tracker",
    "pre-mainstream investing",
    "opportunity scoring",
  ],
  openGraph: {
    title: `Opportunities | ${SITE_NAME}`,
    description:
      "Sortable, filterable table of pre-mainstream opportunities scored by the 8-Signal Pattern Filter with signal breakdowns.",
    url: `${SITE_URL}/opportunities`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Opportunities | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Opportunities | ${SITE_NAME}`,
    description:
      "Sortable, filterable table of pre-mainstream opportunities scored by the 8-Signal Pattern Filter.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/opportunities` },
};

export const methodologyPageMetadata: Metadata = {
  title: "Methodology",
  description:
    "The 8-Signal Pattern Filter explained: Working Code (20%), Dev Activity (15%), Smart Money (10%), Community (10%), Catalyst (15%), Narrative (5%), Valuation Gap (15%), Obscurity (10%). Each signal scored 0-100 from verifiable on-chain and off-chain data sources.",
  keywords: [
    "8-signal pattern filter",
    "opportunity scoring methodology",
    "crypto signal analysis",
    "composite score calculation",
    "smart money tracking methodology",
  ],
  openGraph: {
    title: `Methodology | ${SITE_NAME}`,
    description:
      "The 8-Signal Pattern Filter: eight weighted dimensions scored 0-100 to identify pre-mainstream asymmetric setups.",
    url: `${SITE_URL}/methodology`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Methodology | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Methodology | ${SITE_NAME}`,
    description:
      "The 8-Signal Pattern Filter: eight weighted dimensions scored 0-100 to identify pre-mainstream asymmetric setups.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/methodology` },
};

/** Metadata for the graveyard page. */
export const graveyardPageMetadata: Metadata = {
  title: "Opportunity Graveyard",
  description:
    "Transparent post-mortem archive of failed theses and invalidated opportunities. Each entry includes the original composite score, what signals failed, and the specific lesson extracted. No other tracker publishes its failures.",
  keywords: [
    "failed crypto theses",
    "investment post-mortem",
    "opportunity graveyard",
    "transparent investing",
    "crypto failure analysis",
  ],
  openGraph: {
    title: `Opportunity Graveyard | ${SITE_NAME}`,
    description:
      "Transparent post-mortem archive: original scores, failed signals, and lessons from every dead thesis.",
    url: `${SITE_URL}/graveyard`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Opportunity Graveyard | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Opportunity Graveyard | ${SITE_NAME}`,
    description:
      "Transparent post-mortem archive: original scores, failed signals, and lessons from every dead thesis.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/graveyard` },
};

/** Metadata for the pricing page. */
export const pricingPageMetadata: Metadata = {
  title: "Pricing",
  description:
    "Free tier with 8-Signal Pattern Filter scores and opportunity listings. Premium unlocks full signal breakdowns, smart money flow data, catalyst timelines, and analysis research across 154+ protocols.",
  openGraph: {
    title: `Pricing | ${SITE_NAME}`,
    description:
      "Free tier with scores and listings. Premium unlocks full signal breakdowns, smart money data, and analysis research.",
    url: `${SITE_URL}/pricing`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Pricing | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Pricing | ${SITE_NAME}`,
    description:
      "Free tier with scores and listings. Premium unlocks full signal breakdowns and analysis research.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/pricing` },
};

/** Metadata for the blog listing page. */
export const blogPageMetadata: Metadata = {
  title: "Blog",
  description:
    "Research notes, market analysis, and deep dives into asymmetric opportunities. Covers convergence events, airdrop performance data, tokenless protocol TVL, and smart money flow breakdowns.",
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description:
      "Research notes, market analysis, and deep dives into asymmetric opportunities from Early Thunder.",
    url: `${SITE_URL}/blog`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Blog | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${SITE_NAME}`,
    description:
      "Research notes, market analysis, and deep dives into asymmetric opportunities.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/blog` },
};

/** Metadata for the intelligence dashboard page. */
export const intelligencePageMetadata: Metadata = {
  title: "Intelligence Dashboard",
  description:
    "Interactive real-time convergence signal tracker scanning 154+ protocols. Monitor 8-signal pattern scores, smart money flows updated every 6 hours, airdrop calibration engine with 200+ historical distributions, and catalyst countdown timelines.",
  keywords: [
    "crypto intelligence",
    "convergence signals",
    "smart money tracker",
    "DeFi dashboard",
    "airdrop calibration",
    "catalyst timeline",
    "signal analysis",
    "real-time crypto data",
  ],
  openGraph: {
    title: `Intelligence Dashboard | ${SITE_NAME}`,
    description:
      "Interactive real-time convergence signal tracker. Smart money flows, airdrop calibration, and catalyst countdown timelines across 154+ protocols.",
    url: `${SITE_URL}/intelligence`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Intelligence Dashboard | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Intelligence Dashboard | ${SITE_NAME}`,
    description:
      "Interactive real-time convergence signal tracker. Smart money flows, airdrop calibration, and catalyst countdown timelines.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/intelligence` },
};

/** Metadata for the research hub page. */
export const researchPageMetadata: Metadata = {
  title: "Research",
  description:
    "analysis research library with forensic exploit breakdowns, airdrop ROI data across 200+ distributions, tokenless protocol TVL tracking, and quantified opportunity theses with cited on-chain sources.",
  keywords: [
    "crypto research",
    "DeFi analysis",
    "airdrop performance",
    "tokenless protocols",
    "TVL analysis",
    "smart money research",
    "crypto exploit analysis",
    "on-chain data research",
  ],
  openGraph: {
    title: `Research | ${SITE_NAME}`,
    description:
      "analysis research library: exploit forensics, airdrop ROI data, tokenless protocol TVL, and quantified opportunity theses.",
    url: `${SITE_URL}/research`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Research | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Research | ${SITE_NAME}`,
    description:
      "analysis research library: exploit forensics, airdrop ROI data, tokenless protocol TVL, and quantified opportunity theses.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/research` },
};

/** Metadata for the discoveries (1000x dashboard) page. */
export const discoveriesPageMetadata: Metadata = {
  title: "1000x Discoveries",
  description:
    "Interactive 1000x Discovery Dashboard: 4-scanner pipeline monitoring new contract deployments, VC wallet movements, elite developer migrations across 161 devs and 17 orgs, and DEX liquidity events in real-time. Filter and sort by composite conviction score.",
  keywords: [
    "1000x opportunities",
    "crypto discovery engine",
    "VC wallet tracker",
    "developer migration tracker",
    "DEX liquidity scanner",
    "contract scanner",
    "alpha discovery",
  ],
  openGraph: {
    title: `1000x Discoveries | ${SITE_NAME}`,
    description:
      "Interactive 4-scanner pipeline: contract deployments, VC wallet movements, developer migrations, and DEX liquidity events.",
    url: `${SITE_URL}/discoveries`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `1000x Discoveries | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `1000x Discoveries | ${SITE_NAME}`,
    description:
      "Interactive 4-scanner pipeline: contract deployments, VC wallet movements, developer migrations, and DEX liquidity events.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/discoveries` },
};

/** Metadata for the performance page. */
export const performancePageMetadata: Metadata = {
  title: "Performance",
  description:
    "Full track record of the 1000x Discovery System: signal history with verdicts (DEEP ALPHA, MONITOR, NOISE), pipeline stats across 161 elite devs and 17 orgs, scanner operational status, and cross-reference scoring methodology.",
  keywords: [
    "crypto signal performance",
    "discovery system track record",
    "alpha signal history",
    "pipeline statistics",
    "scanner status",
  ],
  openGraph: {
    title: `Performance | ${SITE_NAME}`,
    description:
      "Full track record: signal verdicts, pipeline stats, scanner status, and cross-reference scoring from the 1000x Discovery System.",
    url: `${SITE_URL}/performance`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `Performance | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Performance | ${SITE_NAME}`,
    description:
      "Full track record: signal verdicts, pipeline stats, and scanner status from the 1000x Discovery System.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/performance` },
};

/** Metadata for the how-it-works page. */
export const howItWorksPageMetadata: Metadata = {
  title: "How It Works",
  description:
    "Three-stage pipeline: Scout (50+ sources including on-chain data, GitHub, arXiv, SEC filings), Score (8-Signal Pattern Filter with weighted dimensions), and Track (weekly score updates, catalyst monitoring, and graveyard post-mortems). Covers digital assets, public equities, and private markets.",
  keywords: [
    "opportunity pipeline",
    "signal detection",
    "investment intelligence pipeline",
    "crypto scouting",
    "asset scoring system",
  ],
  openGraph: {
    title: `How It Works | ${SITE_NAME}`,
    description:
      "Three-stage pipeline: Scout 50+ sources, Score with 8-Signal Pattern Filter, Track with weekly updates and post-mortems.",
    url: `${SITE_URL}/how-it-works`,
    images: [{ url: OG_IMAGE_URL, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: `How It Works | ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `How It Works | ${SITE_NAME}`,
    description:
      "Three-stage pipeline: Scout 50+ sources, Score with 8-Signal Pattern Filter, Track with weekly updates and post-mortems.",
    images: [OG_IMAGE_URL],
    creator: TWITTER_HANDLE,
  },
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

/** Research article title/description map for metadata generation. */
const RESEARCH_META: Record<
  string,
  { readonly title: string; readonly description: string }
> = {
  "kelp-exploit-analysis": {
    title: "Kelp Exploit Analysis",
    description:
      "Forensic breakdown of the Kelp DeFi exploit, attack vectors, fund flows, and lessons for protocol security.",
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
      "analysis into Liquity v2 value accrual mechanics, protocol revenue, token utility changes, and valuation gap assessment.",
  },
  "crypto-intelligence-brief-week-of-2026-05-09": {
    title: "Crypto Intelligence Brief, Week of May 9, 2026",
    description:
      "Weekly intelligence brief covering market-moving signals, convergence events, and asymmetric setups for the week of May 9, 2026.",
  },
  "commonware-analysis-potential-1000x-2500x-roi-opportunity": {
    title: "Commonware Analysis: 1000x-2500x ROI Opportunity",
    description:
      "Full-stack analysis of Commonware, architecture review, team assessment, and quantified ROI thesis for early participants.",
  },
  "gains-network-analysis-smart-money-score-86-with-40-tvl-surge": {
    title: "Gains Network: Smart Money Score 86 with 40% TVL Surge",
    description:
      "Gains Network analysis, smart money score 86/100, 40% TVL surge analysis, and decentralized perpetuals market positioning.",
  },
  "commonware-deep-alpha": {
    title: "Commonware Deep Alpha",
    description:
      "Extended alpha research on Commonware, technical architecture analysis, competitive moat analysis, and conviction-level thesis.",
  },
  "the-23-billion-divergence": {
    title: "The $23 Billion Divergence",
    description:
      "Analysis of the $23B divergence between DeFi fundamentals and token valuations, where the gap is widest and how to position.",
  },
  "genius-act-countdown": {
    title: "GENIUS Act Countdown",
    description:
      "Regulatory intelligence on the GENIUS Act, timeline, market impact scenarios, and which crypto sectors benefit most.",
  },
  "ai-crypto-convergence": {
    title: "AI-Crypto Convergence",
    description:
      "Mapping the intersection of artificial intelligence and crypto, infrastructure plays, data markets, and the convergence trade thesis.",
  },
  "rwa-tokenization-tripled": {
    title: "RWA Tokenization Tripled",
    description:
      "Real World Asset tokenization has tripled, sector breakdown, protocol comparison, and the institutional capital pipeline driving growth.",
  },
  "infrastructure-monopoly-map": {
    title: "Infrastructure Monopoly Map",
    description:
      "Visual mapping of crypto infrastructure monopolies, who controls the critical layers and where challenger opportunities exist.",
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
