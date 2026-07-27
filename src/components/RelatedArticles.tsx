import Link from "next/link";
import type { BlogPost } from "@/lib/types";

interface RelatedArticlesProps {
  readonly items: readonly BlogPost[];
  readonly basePath: string;
  readonly heading: string;
}

/**
 * Tag-ranked internal links rendered under an article.
 * Feeds crawl depth to neighbouring long-tail pages instead of dead-ending.
 */
export default function RelatedArticles({
  items,
  basePath,
  heading,
}: RelatedArticlesProps) {
  console.assert(typeof basePath === "string" && basePath.length > 0, "RelatedArticles: basePath");
  if (!Array.isArray(items) || items.length === 0) return null;
  if (typeof basePath !== "string" || basePath.length === 0) return null;

  return (
    <nav aria-label={heading} className="mt-16 border-t border-border pt-8">
      <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        {heading}
      </h2>
      <ul className="mt-5 space-y-5">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`${basePath}/${item.slug}`} className="group block">
              <span className="text-base font-semibold leading-snug text-text-primary group-hover:text-amber">
                {item.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-text-tertiary">
                {item.excerpt}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
