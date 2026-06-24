import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides, getGuideBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getGuideArticleSchema, getBreadcrumbListSchema } from "@/lib/structured-data";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  const guides = getAllGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Not Found" };

  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return <NotFoundFallback />;
  }

  const articleSchema = getGuideArticleSchema(guide);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BackLink />
      <PostHeader
        title={guide.title}
        date={guide.published_at}
        author={guide.author}
        tags={guide.tags}
      />
      <PostContent content={guide.content} />
      <PostFooter />
    </article>
  );
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Guide Not Found
      </h1>
      <p className="mt-2 text-text-secondary">
        This guide does not exist or has been removed.
      </p>
      <Link
        href="/guides"
        className="mt-4 inline-block text-sm text-text-secondary hover:text-text-primary"
      >
        Back to guides
      </Link>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/guides"
      className="text-xs font-mono text-text-tertiary hover:text-text-secondary"
    >
      Guides
    </Link>
  );
}

function PostHeader({
  title,
  date,
  author,
  tags,
}: {
  readonly title: string;
  readonly date: string;
  readonly author: string;
  readonly tags: readonly string[];
}) {
  if (typeof title !== "string" || title.length === 0) return null;

  return (
    <header className="mt-6">
      <h1 className="text-4xl font-semibold tracking-tighter leading-tight text-text-primary">
        {title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
        <span>{author}</span>
        <span className="text-border">|</span>
        <time>{formatDate(date)}</time>
      </div>
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="divider mt-8" />
    </header>
  );
}

function PostContent({ content }: { readonly content: string }) {
  if (typeof content !== "string" || content.length === 0) return null;

  const paragraphs = content.split("\n\n").slice(0, 100);

  return (
    <div className="mt-8 space-y-6">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-base leading-relaxed text-text-secondary">
          {para}
        </p>
      ))}
    </div>
  );
}

function PostFooter() {
  return (
    <div className="mt-16 border-t border-border pt-8 text-center">
      <p className="text-sm text-text-tertiary">
        Want more Early Thunder research?
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-block rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:bg-amber-hover hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(245,166,35,0.28)]"
      >
        Get Premium Access
      </Link>
    </div>
  );
}
