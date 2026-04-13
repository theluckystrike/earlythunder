import type { Opportunity, BlogPost } from "./types";
import opportunitiesData from "../../data/opportunities.json";
import blogData from "../../data/blog.json";

/** Validate that a score is within the 0-100 range. */
function isValidScore(score: number): boolean {
  return typeof score === "number" && score >= 0 && score <= 100;
}

/** Coerce a nullable number field: returns the number if valid, else null. */
function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value)) return value;
  return null;
}

/** Validate an opportunity object has required fields and valid scores. */
function isValidOpportunity(item: unknown): item is Opportunity {
  if (typeof item !== "object" || item === null) return false;
  const opp = item as Record<string, unknown>;
  if (
    typeof opp.slug !== "string" ||
    opp.slug.length === 0 ||
    typeof opp.name !== "string" ||
    typeof opp.composite_score !== "number" ||
    !isValidScore(opp.composite_score)
  ) {
    return false;
  }
  // Default nullable market data fields if missing
  opp.current_price_usd = toNullableNumber(opp.current_price_usd);
  opp.market_cap_usd = toNullableNumber(opp.market_cap_usd);
  opp.volume_24h_usd = toNullableNumber(opp.volume_24h_usd);
  return true;
}

const MAX_OPPORTUNITIES = 500;
const MAX_BLOG_POSTS = 200;

/**
 * Returns all valid opportunities, sorted by composite score descending.
 * Filters out any malformed entries.
 */
export function getAllOpportunities(): readonly Opportunity[] {
  const raw: unknown[] = Array.isArray(opportunitiesData)
    ? opportunitiesData
    : [];
  const validated = raw
    .slice(0, MAX_OPPORTUNITIES)
    .filter(isValidOpportunity);

  if (validated.length === 0) {
    console.warn("No valid opportunities found in data file.");
  }

  return validated.sort((a, b) => b.composite_score - a.composite_score);
}

/** Returns only active (non-graveyard) opportunities. */
export function getActiveOpportunities(): readonly Opportunity[] {
  const all = getAllOpportunities();
  return all.filter((opp) => !opp.is_graveyard);
}

/** Returns only graveyard opportunities. */
export function getGraveyardOpportunities(): readonly Opportunity[] {
  const all = getAllOpportunities();
  return all.filter((opp) => opp.is_graveyard);
}

/** Returns a single opportunity by slug, or null if not found. */
export function getOpportunityBySlug(
  slug: string,
): Opportunity | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const all = getAllOpportunities();
  return all.find((opp) => opp.slug === slug) ?? null;
}

/** Returns related opportunities for a given opportunity. */
export function getRelatedOpportunities(
  opportunity: Opportunity,
): readonly Opportunity[] {
  if (!opportunity || !Array.isArray(opportunity.related_slugs)) {
    return [];
  }
  const all = getAllOpportunities();
  return opportunity.related_slugs
    .slice(0, 10)
    .map((slug) => all.find((opp) => opp.slug === slug))
    .filter((opp): opp is Opportunity => opp !== undefined);
}

/** Validate a blog post has required fields. */
function isValidBlogPost(item: unknown): item is BlogPost {
  if (typeof item !== "object" || item === null) return false;
  const post = item as Record<string, unknown>;
  return (
    typeof post.slug === "string" &&
    post.slug.length > 0 &&
    typeof post.title === "string" &&
    typeof post.content === "string"
  );
}

/** Returns all valid blog posts, sorted by date descending. */
export function getAllBlogPosts(): readonly BlogPost[] {
  const raw: unknown[] = Array.isArray(blogData) ? blogData : [];
  const validated = raw
    .slice(0, MAX_BLOG_POSTS)
    .filter(isValidBlogPost);

  return validated.sort(
    (a, b) =>
      new Date(b.published_at).getTime() -
      new Date(a.published_at).getTime(),
  );
}

/** Returns a single blog post by slug, or null if not found. */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  const all = getAllBlogPosts();
  return all.find((post) => post.slug === slug) ?? null;
}
