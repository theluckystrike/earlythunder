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
