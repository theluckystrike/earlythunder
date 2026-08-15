import type { MetadataRoute } from "next";
import {
  SITE_URL,
  STATIC_PAGES,
  PRIORITY_MAP,
  OPPORTUNITY_PRIORITY,
  BLOG_POST_PRIORITY,
  GUIDE_PRIORITY,
  RESEARCH_SLUGS,
  RESEARCH_ARTICLE_PRIORITY,
  CLARITY_TOPIC_PRIORITY,
  SCORECARD_TOKEN_PRIORITY,
  SCORECARD_HUB_PRIORITY,
  SCORECARD_SIGNAL_PRIORITY,
  SCORECARD_COMPARE_PRIORITY,
  SCORECARD_SCREEN_PRIORITY,
} from "@/lib/constants";
import { getAllOpportunities, getAllBlogPosts, getAllGuides } from "@/lib/data";
import { getAllClarityTopics } from "@/lib/clarity";
import {
  getAllScorecardTokens,
  getScorecardGroups,
  getScorecardMeta,
} from "@/lib/scorecard-analytics";
import { getAllSignals, signalSlug } from "@/lib/scorecard-signals";
import { getAllPairs } from "@/lib/scorecard-pairs";
import { getAllTiers } from "@/lib/scorecard-tiers";
import { getAllScreens } from "@/lib/scorecard-screens";

export const dynamic = "force-static";

const DEFAULT_PRIORITY = 0.5;
const MAX_ENTRIES = 50000;

/** Pages that update daily (interactive dashboards, live data). */
const DAILY_PAGES = new Set(["/", "/intelligence", "/deadlines", "/earnings", "/opportunities", "/discoveries", "/scorecard", "/clarity-act"]);

/** Returns the appropriate changeFrequency for a static page path. */
function getChangeFrequency(
  page: string,
): "daily" | "weekly" | "monthly" {
  if (DAILY_PAGES.has(page)) {
    return "daily";
  }
  if (page === "/terms" || page === "/privacy" || page === "/disclaimer") {
    return "monthly";
  }
  return "weekly";
}

/**
 * Generates the sitemap.xml at build time.
 * Reads opportunity, blog, and research data to produce dynamic entries.
 */
/** Static routes, priced from the priority map. */
function staticEntries(now: Date): MetadataRoute.Sitemap {
  return STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page === "/" ? "" : page}`,
    lastModified: now,
    changeFrequency: getChangeFrequency(page),
    priority: PRIORITY_MAP[page] ?? DEFAULT_PRIORITY,
  }));
}

/** Long-form content: opportunity notes, blog posts, guides, research. */
function contentEntries(now: Date): MetadataRoute.Sitemap {
  return [
    ...getAllOpportunities().slice(0, MAX_ENTRIES).map((opp) => ({
      url: `${SITE_URL}/opportunities/${opp.slug}`,
      lastModified: opp.updated_at ? new Date(opp.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: OPPORTUNITY_PRIORITY,
    })),
    ...getAllBlogPosts().slice(0, MAX_ENTRIES).map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: BLOG_POST_PRIORITY,
    })),
    ...getAllGuides().slice(0, MAX_ENTRIES).map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.published_at ? new Date(guide.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: GUIDE_PRIORITY,
    })),
    ...RESEARCH_SLUGS.map((slug) => ({
      url: `${SITE_URL}/research/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: RESEARCH_ARTICLE_PRIORITY,
    })),
    ...getAllClarityTopics().map((topic) => ({
      url: `${SITE_URL}/clarity-act/${topic.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: CLARITY_TOPIC_PRIORITY,
    })),
  ];
}

/**
 * Everything derived from a scoring pass. These carry the pass date rather than
 * the build date, so a rebuild does not claim the research changed.
 */
function scorecardEntries(passDate: Date): MetadataRoute.Sitemap {
  const hubs = [
    ...getScorecardGroups("verdict").map((g) => `/scorecard/verdict/${g.slug}`),
    ...getScorecardGroups("chain").map((g) => `/scorecard/chain/${g.slug}`),
    ...getAllTiers().map((t) => `/scorecard/size/${t.slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: passDate,
    changeFrequency: "monthly" as const,
    priority: SCORECARD_HUB_PRIORITY,
  }));

  const screens = getAllScreens().map((screen) => ({
    url: `${SITE_URL}/scorecard/screen/${screen.slug}`,
    lastModified: passDate,
    changeFrequency: "monthly" as const,
    priority: SCORECARD_SCREEN_PRIORITY,
  }));

  const signals = getAllSignals().map((signal) => ({
    url: `${SITE_URL}/scorecard/signal/${signalSlug(signal.key)}`,
    lastModified: passDate,
    changeFrequency: "monthly" as const,
    priority: SCORECARD_SIGNAL_PRIORITY,
  }));

  const tokens = getAllScorecardTokens().slice(0, MAX_ENTRIES).map((token) => ({
    url: `${SITE_URL}/scorecard/${token.slug}`,
    lastModified: passDate,
    changeFrequency: "monthly" as const,
    priority: SCORECARD_TOKEN_PRIORITY,
  }));

  const compares = getAllPairs().slice(0, MAX_ENTRIES).map((pair) => ({
    url: `${SITE_URL}/scorecard/compare/${pair.slug}`,
    lastModified: passDate,
    changeFrequency: "monthly" as const,
    priority: SCORECARD_COMPARE_PRIORITY,
  }));

  return [...hubs, ...screens, ...signals, ...tokens, ...compares];
}

/**
 * Generates the sitemap.xml at build time.
 * Reads opportunity, blog, and research data to produce dynamic entries.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const meta = getScorecardMeta();
  const passDate = meta.source_updated_at ? new Date(meta.source_updated_at) : now;

  return [
    ...staticEntries(now),
    ...contentEntries(now),
    ...scorecardEntries(passDate),
  ];
}
