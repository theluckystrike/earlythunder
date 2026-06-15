import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";
import { getGuideListSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Actionable guides for crypto portfolio execution, DeFi strategies, security, and autonomous intelligence pipeline methodology.",
};

export default function GuidesPage() {
  const guides = getAllGuides();
  const listSchema = guides.length > 0 ? getGuideListSchema(guides) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      {listSchema !== null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
        />
      )}
      <PageHeader count={guides.length} />
      {guides.length > 0 ? (
        <GuideGrid guides={guides} />
      ) : (
        <EmptyState />
      )}
      <RelatedResourcesSection />
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Guides
      </h1>
      <p className="mt-4 text-xl text-text-secondary">
        Actionable playbooks for crypto execution, security, and DeFi strategies.{" "}
        <span className="text-text-tertiary">
          {count} guide{count !== 1 ? "s" : ""} published.
        </span>
      </p>
    </div>
  );
}

function GuideGrid({ guides }: { readonly guides: readonly BlogPost[] }) {
  if (!Array.isArray(guides)) return null;

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {guides.map((guide) => (
        <GuideCard key={guide.slug} guide={guide} />
      ))}
    </div>
  );
}

function GuideCard({ guide }: { readonly guide: BlogPost }) {
  if (!guide || typeof guide.slug !== "string") return null;

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:border-border-hover">
      <Link href={`/guides/${guide.slug}`} className="flex flex-1 flex-col">
        <time className="text-xs text-text-tertiary">
          {formatDate(guide.published_at)}
        </time>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-text-primary">
          {guide.title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
          {guide.excerpt}
        </p>
        <TagList tags={guide.tags} />
        <span className="mt-4 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
          Read guide &rarr;
        </span>
      </Link>
    </article>
  );
}

function TagList({ tags }: { readonly tags: readonly string[] }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-text-tertiary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 py-12 text-center">
      <p className="text-text-secondary">
        No guides published yet. Check back soon.
      </p>
    </div>
  );
}

function RelatedResourcesSection() {
  return (
    <section className="mt-16 border-t border-border pt-8">
      <h3 className="text-sm font-mono uppercase tracking-wider text-text-tertiary mb-4">
        Also Explore
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="/scorecard"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Token Scorecard
          <span className="block mt-1 font-normal text-text-secondary">
            25-variable scoring framework results
          </span>
        </a>
        <a
          href="/research/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Research Library
          <span className="block mt-1 font-normal text-text-secondary">
            analysis analysis and data reports
          </span>
        </a>
        <a
          href="/blog"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Blog
          <span className="block mt-1 font-normal text-text-secondary">
            Research notes and methodology updates
          </span>
        </a>
      </div>
    </section>
  );
}
