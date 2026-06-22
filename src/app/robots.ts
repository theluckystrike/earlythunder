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

  // Explicitly allow every known AI / answer-engine crawler so Early Thunder
  // stays in the retrieval pool for GEO (AI citations), not just classic search.
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Google-Extended",
    "PerplexityBot",
    "Perplexity-User",
    "ClaudeBot",
    "Claude-User",
    "anthropic-ai",
    "Applebot-Extended",
    "cohere-ai",
    "Bytespider",
    "Meta-ExternalAgent",
    "Amazonbot",
    "DuckAssistBot",
    "YouBot",
    "CCBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-research.xml`,
    ],
  };
}
