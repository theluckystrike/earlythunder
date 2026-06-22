import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  OG_IMAGE_PATH,
  AUTHOR_NAME,
} from "./constants";
import type { Opportunity, BlogPost } from "./types";

/** Maximum items rendered in any JSON-LD list to prevent unbounded output. */
const MAX_LIST_ITEMS = 50;

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

/** JSON-LD Article schema for a guide. */
export function getGuideArticleSchema(
  guide: BlogPost,
): Record<string, unknown> {
  if (!guide || typeof guide.slug !== "string") {
    throw new Error("Valid guide is required for article schema.");
  }
  if (typeof guide.title !== "string" || guide.title.length === 0) {
    throw new Error("Guide title is required.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    url: `${SITE_URL}/guides/${guide.slug}`,
    datePublished: guide.published_at,
    author: {
      "@type": "Organization",
      name: guide.author || AUTHOR_NAME,
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
      "@id": `${SITE_URL}/guides/${guide.slug}`,
    },
    keywords: [...guide.tags].join(", "),
  };
}

/** JSON-LD ItemList schema for the guides listing page. */
export function getGuideListSchema(
  guides: readonly BlogPost[],
): Record<string, unknown> {
  if (!Array.isArray(guides) || guides.length === 0) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${SITE_NAME} Guides`,
      numberOfItems: 0,
      url: `${SITE_URL}/guides`,
      itemListElement: [],
    };
  }

  const bounded = guides.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} Guides`,
    description:
      "Actionable guides for crypto portfolio execution, security, DeFi strategies, and autonomous intelligence.",
    numberOfItems: bounded.length,
    url: `${SITE_URL}/guides`,
    itemListElement: bounded.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `${SITE_URL}/guides/${guide.slug}`,
    })),
  };
}

/** JSON-LD WebApplication schema for the intelligence dashboard. */
export function getIntelligenceDashboardSchema(): Record<string, unknown> {
  if (typeof SITE_URL !== "string" || SITE_URL.length === 0) {
    throw new Error("SITE_URL is required for intelligence dashboard schema.");
  }
  if (typeof SITE_NAME !== "string" || SITE_NAME.length === 0) {
    throw new Error("SITE_NAME is required for intelligence dashboard schema.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${SITE_NAME} Intelligence Dashboard`,
    url: `${SITE_URL}/intelligence`,
    description:
      "Real-time convergence signal tracker across crypto, DeFi, and emerging markets. Monitor 8-signal pattern scores, smart money flows, and catalyst timelines.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    featureList: [
      "Convergence signal monitoring",
      "Smart money flow tracking",
      "Airdrop calibration engine",
      "Catalyst timeline alerts",
      "8-Signal Pattern Filter scoring",
    ],
  };
}

/** JSON-LD DataCatalog schema for the research library. */
export function getResearchCatalogSchema(): Record<string, unknown> {
  if (typeof SITE_URL !== "string" || SITE_URL.length === 0) {
    throw new Error("SITE_URL is required for research catalog schema.");
  }
  if (typeof AUTHOR_NAME !== "string" || AUTHOR_NAME.length === 0) {
    throw new Error("AUTHOR_NAME is required for research catalog schema.");
  }

  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: `${SITE_NAME} Research Library`,
    url: `${SITE_URL}/research`,
    description:
      "analysis research articles covering DeFi exploits, airdrop performance, tokenless protocol analysis, and asymmetric opportunity breakdowns.",
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    provider: {
      "@type": "Organization",
      name: AUTHOR_NAME,
    },
    keywords: [
      "crypto research",
      "DeFi analysis",
      "airdrop data",
      "tokenless protocols",
      "smart money signals",
    ],
  };
}

/** JSON-LD FAQPage schema for intelligence and research pages. */
export function getResearchFAQSchema(): Record<string, unknown> {
  if (typeof SITE_URL !== "string" || SITE_URL.length === 0) {
    throw new Error("SITE_URL is required for FAQ schema.");
  }
  if (typeof SITE_NAME !== "string" || SITE_NAME.length === 0) {
    throw new Error("SITE_NAME is required for FAQ schema.");
  }

  const faqs = [
    {
      question:
        "What are convergence signals and how does Early Thunder track them?",
      answer:
        "Convergence signals occur when multiple independent indicators, smart money flows, developer activity, catalyst timelines, and valuation gaps, align simultaneously on a single asset. Early Thunder's 8-Signal Pattern Filter scores each dimension 0-100 and flags assets where three or more signals converge above threshold, historically correlating with 5-50x pre-mainstream moves.",
    },
    {
      question:
        "How does the airdrop calibration engine calculate expected value?",
      answer:
        "The airdrop calibration engine analyzes historical airdrop performance data across 200+ token distributions, weighting factors like protocol TVL at snapshot, time-locked vs. immediate vesting, and sector momentum. It produces an expected-value score that accounts for opportunity cost, gas fees, and sybil-resistance difficulty to help users prioritize which airdrops to farm.",
    },
    {
      question:
        "What are tokenless protocols and why does TVL matter for them?",
      answer:
        "Tokenless protocols are blockchain projects that have raised venture capital but have not yet launched a native token. TVL (Total Value Locked) matters because it signals genuine user adoption and capital commitment. Protocols with rapidly growing TVL often launch tokens with generous airdrops to reward early depositors, making TVL tracking a leading indicator for airdrop hunters.",
    },
    {
      question:
        "How often is the intelligence dashboard updated with new data?",
      answer:
        "The intelligence dashboard refreshes convergence scores and signal data daily. Smart money flow data updates every 6 hours from on-chain sources. Catalyst timelines are maintained in real-time as governance votes, token unlocks, and protocol upgrades are announced. Research articles are published weekly with analysis analysis.",
    },
    {
      question:
        "What methodology does Early Thunder use to score asymmetric opportunities?",
      answer:
        "Early Thunder uses a proprietary 8-Signal Pattern Filter that evaluates opportunities across eight dimensions: Working Code (20%), Dev Activity (15%), Smart Money (10%), Community (10%), Catalyst (15%), Narrative (5%), Valuation Gap (15%), and Obscurity (10%). Each signal is scored 0-100 from verifiable data sources, producing a composite score that identifies pre-mainstream asymmetric setups.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** JSON-LD FAQPage schema from a generated question/answer list. */
export function getFaqPageSchema(
  faqs: readonly { readonly question: string; readonly answer: string }[],
): Record<string, unknown> | null {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;
  const items = faqs
    .filter((f) => f && f.question && f.answer)
    .slice(0, MAX_LIST_ITEMS);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
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

  // isBasedOn links every claim to a primary source (the GEO differentiator:
  // AI engines can verify the source chain). Built from the opportunity's citations.
  const isBasedOn = Array.isArray(opp.citations)
    ? opp.citations
        .filter((c) => c && typeof c.url === "string" && c.url.length > 0)
        .slice(0, MAX_LIST_ITEMS)
        .map((c) => ({
          "@type": "CreativeWork",
          name: c.source || c.claim || "Source",
          url: c.url,
        }))
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opp.ticker ? `${opp.name} (${opp.ticker})` : opp.name,
    description: opp.one_liner,
    url: `${SITE_URL}/opportunities/${opp.slug}`,
    category: opp.category,
    ...(isBasedOn.length > 0 ? { isBasedOn } : {}),
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

/**
 * JSON-LD ItemList schema for the opportunities listing page.
 * Renders the top opportunities as a ranked list for rich results.
 */
export function getItemListSchema(
  opportunities: readonly Opportunity[],
): Record<string, unknown> {
  if (!Array.isArray(opportunities)) {
    throw new Error("Opportunities array is required for ItemList schema.");
  }
  if (opportunities.length === 0) {
    throw new Error("At least one opportunity is required for ItemList schema.");
  }

  const bounded = opportunities.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${bounded.length} Asymmetric Opportunities, ${SITE_NAME}`,
    description:
      "Ranked list of pre-mainstream opportunities scored by the 8-Signal Pattern Filter across crypto, deep tech, and emerging markets.",
    numberOfItems: bounded.length,
    url: `${SITE_URL}/opportunities`,
    itemListElement: bounded.map((opp, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: opp.ticker ? `${opp.name} (${opp.ticker})` : opp.name,
      url: `${SITE_URL}/opportunities/${opp.slug}`,
      description: opp.one_liner,
    })),
  };
}

/**
 * JSON-LD ItemList schema for the blog listing page.
 * Renders blog posts as a structured list for rich results.
 */
export function getBlogListSchema(
  posts: readonly BlogPost[],
): Record<string, unknown> {
  if (!Array.isArray(posts)) {
    throw new Error("Posts array is required for blog list schema.");
  }
  if (posts.length === 0) {
    throw new Error("At least one post is required for blog list schema.");
  }

  const bounded = posts.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} Blog`,
    description:
      "Research notes, methodology updates, and analysis from Early Thunder.",
    numberOfItems: bounded.length,
    url: `${SITE_URL}/blog`,
    itemListElement: bounded.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
    })),
  };
}

/**
 * JSON-LD ItemList schema for the graveyard page.
 * Lists failed/eliminated opportunities for transparency.
 */
export function getGraveyardListSchema(
  opportunities: readonly Opportunity[],
): Record<string, unknown> {
  if (!Array.isArray(opportunities)) {
    throw new Error("Opportunities array is required for graveyard list schema.");
  }
  if (opportunities.length === 0) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${SITE_NAME} Graveyard, Failed Opportunities`,
      description:
        "Transparent record of opportunities that fell below threshold, with full context on what went wrong.",
      numberOfItems: 0,
      url: `${SITE_URL}/graveyard`,
      itemListElement: [],
    };
  }

  const bounded = opportunities.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} Graveyard, Failed Opportunities`,
    description:
      "Transparent record of opportunities that fell below threshold, with full context on what went wrong.",
    numberOfItems: bounded.length,
    url: `${SITE_URL}/graveyard`,
    itemListElement: bounded.map((opp, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: opp.ticker ? `${opp.name} (${opp.ticker})` : opp.name,
      url: `${SITE_URL}/opportunities/${opp.slug}`,
      description: opp.one_liner,
    })),
  };
}

/** Step definition for the HowTo schema. */
interface HowToStep {
  readonly name: string;
  readonly text: string;
}

/**
 * JSON-LD HowTo schema for the how-it-works page.
 * Describes the Scout -> Score -> Track pipeline as structured steps.
 */
export function getHowToSchema(
  steps: readonly HowToStep[],
): Record<string, unknown> {
  if (!Array.isArray(steps)) {
    throw new Error("Steps array is required for HowTo schema.");
  }
  if (steps.length === 0) {
    throw new Error("At least one step is required for HowTo schema.");
  }

  const bounded = steps.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How ${SITE_NAME} Identifies Asymmetric Opportunities`,
    description:
      "From signal detection to scored opportunity: how the autonomous intelligence pipeline scouts, scores, and tracks pre-mainstream opportunities.",
    url: `${SITE_URL}/how-it-works`,
    totalTime: "P7D",
    step: bounded.map((s, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/how-it-works#step-${index + 1}`,
    })),
  };
}

/**
 * JSON-LD BreadcrumbList schema for hierarchical navigation.
 * Generates breadcrumb trail from path segments.
 */
export function getBreadcrumbListSchema(
  crumbs: readonly { readonly name: string; readonly path: string }[],
): Record<string, unknown> {
  if (!Array.isArray(crumbs)) {
    throw new Error("Breadcrumb array is required.");
  }
  if (crumbs.length === 0) {
    throw new Error("At least one breadcrumb is required.");
  }

  const bounded = crumbs.slice(0, MAX_LIST_ITEMS);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: bounded.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
