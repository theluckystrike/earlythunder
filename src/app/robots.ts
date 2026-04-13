import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-static";

/**
 * Generates robots.txt at build time.
 * Allows all crawlers and points to sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  if (typeof SITE_URL !== "string" || SITE_URL.length === 0) {
    throw new Error("SITE_URL constant is not configured.");
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
