import type { MetadataRoute } from "next";
import {
  SITE_URL,
  STATIC_PAGES,
  PRIORITY_MAP,
  OPPORTUNITY_PRIORITY,
  BLOG_POST_PRIORITY,
  RESEARCH_SLUGS,
  RESEARCH_ARTICLE_PRIORITY,
} from "@/lib/constants";
import { getAllOpportunities, getAllBlogPosts } from "@/lib/data";

export const dynamic = "force-static";

const DEFAULT_PRIORITY = 0.5;
const MAX_ENTRIES = 50000;

/** Returns the appropriate changeFrequency for a static page path. */
function getChangeFrequency(
  page: string,
): "daily" | "weekly" | "monthly" {
  if (page === "/" || page === "/intelligence") {
    return "daily";
  }
  if (page === "/research") {
    return "weekly";
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
    ...researchEntries,
  ];
}
