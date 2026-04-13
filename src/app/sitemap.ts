import type { MetadataRoute } from "next";
import {
  SITE_URL,
  STATIC_PAGES,
  PRIORITY_MAP,
  OPPORTUNITY_PRIORITY,
  BLOG_POST_PRIORITY,
} from "@/lib/constants";
import { getAllOpportunities, getAllBlogPosts } from "@/lib/data";

export const dynamic = "force-static";

const DEFAULT_PRIORITY = 0.5;
const MAX_ENTRIES = 50000;

/**
 * Generates the sitemap.xml at build time.
 * Reads opportunity and blog data to produce dynamic entries.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(
    (page) => ({
      url: `${SITE_URL}${page === "/" ? "" : page}`,
      lastModified: now,
      changeFrequency: page === "/" ? "daily" : "weekly",
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

  return [...staticEntries, ...opportunityEntries, ...blogEntries];
}
