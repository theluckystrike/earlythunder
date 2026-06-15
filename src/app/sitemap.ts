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
} from "@/lib/constants";
import { getAllOpportunities, getAllBlogPosts, getAllGuides } from "@/lib/data";

export const dynamic = "force-static";

const DEFAULT_PRIORITY = 0.5;
const MAX_ENTRIES = 50000;

/** Pages that update daily (interactive dashboards, live data). */
const DAILY_PAGES = new Set(["/", "/intelligence", "/deadlines", "/earnings", "/opportunities", "/discoveries", "/scorecard"]);

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
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(
    (page) => ({
      url: `${SITE_URL}${page === "/" ? "" : page}`,
      lastModified: now,
      changeFrequency: getChangeFrequency(page),
      priority: PRIORITY_MAP[page] ?? DEFAULT_PRIORITY,
    }),
  );

  const opportunities = getAllOpportunities();
  const opportunityEntries: MetadataRoute.Sitemap = opportunities
    .slice(0, MAX_ENTRIES)
    .map((opp) => ({
      url: `${SITE_URL}/opportunities/${opp.slug}`,
      lastModified: opp.updated_at ? new Date(opp.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: OPPORTUNITY_PRIORITY,
    }));

  const blogPosts = getAllBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = blogPosts
    .slice(0, MAX_ENTRIES)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_at
        ? new Date(post.published_at)
        : now,
      changeFrequency: "monthly" as const,
      priority: BLOG_POST_PRIORITY,
    }));

  const guides = getAllGuides();
  const guideEntries: MetadataRoute.Sitemap = guides
    .slice(0, MAX_ENTRIES)
    .map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.published_at
        ? new Date(guide.published_at)
        : now,
      changeFrequency: "monthly" as const,
      priority: GUIDE_PRIORITY,
    }));

  const researchEntries: MetadataRoute.Sitemap = RESEARCH_SLUGS.map(
    (slug) => ({
      url: `${SITE_URL}/research/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: RESEARCH_ARTICLE_PRIORITY,
    }),
  );

  return [
    ...staticEntries,
    ...opportunityEntries,
    ...blogEntries,
    ...guideEntries,
    ...researchEntries,
  ];
}
