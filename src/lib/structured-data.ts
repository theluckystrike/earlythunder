import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  OG_IMAGE_PATH,
  AUTHOR_NAME,
} from "./constants";
import type { Opportunity, BlogPost } from "./types";

/** JSON-LD Organization schema for Early Thunder. */
export function getOrganizationSchema(): Record<string, unknown> {
  if (typeof SITE_URL !== "string" || SITE_URL.length === 0) {
    throw new Error("SITE_URL is required for structured data.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${OG_IMAGE_PATH}`,
    description: SITE_DESCRIPTION,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${SITE_URL}/pricing`,
    },
  };
}

/** JSON-LD WebSite schema with search action. */
export function getWebsiteSchema(): Record<string, unknown> {
  if (typeof SITE_NAME !== "string" || SITE_NAME.length === 0) {
    throw new Error("SITE_NAME is required for structured data.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/opportunities?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD Article schema for a blog post. */
export function getArticleSchema(
  post: BlogPost,
): Record<string, unknown> {
  if (!post || typeof post.slug !== "string") {
    throw new Error("Valid BlogPost is required for article schema.");
  }
  if (typeof post.title !== "string" || post.title.length === 0) {
    throw new Error("BlogPost title is required.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.published_at,
    author: {
      "@type": "Organization",
      name: post.author || AUTHOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}${OG_IMAGE_PATH}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: [...post.tags].join(", "),
  };
}

/** JSON-LD Product schema for an opportunity. */
export function getOpportunitySchema(
  opp: Opportunity,
): Record<string, unknown> {
  if (!opp || typeof opp.slug !== "string") {
    throw new Error(
      "Valid Opportunity is required for product schema.",
    );
  }
  if (typeof opp.name !== "string" || opp.name.length === 0) {
    throw new Error("Opportunity name is required.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opp.ticker ? `${opp.name} (${opp.ticker})` : opp.name,
    description: opp.one_liner,
    url: `${SITE_URL}/opportunities/${opp.slug}`,
    category: opp.category,
    brand: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: opp.composite_score,
        bestRating: 100,
        worstRating: 0,
      },
      author: {
        "@type": "Organization",
        name: AUTHOR_NAME,
      },
    },
  };
}
