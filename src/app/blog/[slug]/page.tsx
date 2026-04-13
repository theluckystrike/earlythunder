import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return <NotFoundFallback />;
  }

  return (
    <article className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <BackLink />
        <PostHeader
          title={post.title}
          date={post.published_at}
          author={post.author}
          tags={post.tags}
        />
        <PostContent content={post.content} />
        <PostFooter />
      </div>
    </article>
  );
}

function NotFoundFallback() {
  return (
    <div className="px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl">Post Not Found</h1>
      <p className="mt-2 text-text-secondary">
        This blog post does not exist or has been removed.
      </p>
      <Link
        href="/blog"
        className="mt-4 inline-block text-sm text-amber hover:underline"
      >
        Back to blog
      </Link>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/blog"
      className="text-sm text-text-secondary hover:text-amber"
    >
      &larr; All Posts
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
    <header className="mt-4 border-b border-border pb-8">
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span>{author}</span>
        <span className="text-border-light">|</span>
        <time>{formatDate(date)}</time>
      </div>
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

function PostContent({ content }: { readonly content: string }) {
  if (typeof content !== "string" || content.length === 0) return null;

  const paragraphs = content.split("\n\n").slice(0, 100);

  return (
    <div className="prose-custom mt-8 space-y-6">
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
    <div className="mt-12 border-t border-border pt-8 text-center">
      <p className="text-sm text-text-secondary">
        Want more Early Thunder research?
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-block rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-amber-hover"
      >
        Get Premium Access
      </Link>
    </div>
  );
}
