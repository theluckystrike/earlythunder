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
    "Claude-SearchBot",
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

  // Classic search and on-demand user agents that had no group of their own.
  // Applebot comes after Applebot-Extended: the extended (training) token is
  // the more specific match, so it is listed first.
  const searchCrawlers = ["Googlebot", "Bingbot", "Applebot"];

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
      ...searchCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-research.xml`,
    ],
  };
}
