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
    <article className="mx-auto max-w-3xl px-6 py-20">
      <BackLink />
      <PostHeader
        title={post.title}
        date={post.published_at}
        author={post.author}
        tags={post.tags}
      />
      <PostContent content={post.content} />
      <PostFooter />
    </article>
  );
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Post Not Found
      </h1>
      <p className="mt-2 text-text-secondary">
        This blog post does not exist or has been removed.
      </p>
      <Link
        href="/blog"
        className="mt-4 inline-block text-sm text-text-secondary hover:text-text-primary"
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
      className="text-xs font-mono text-text-tertiary hover:text-text-secondary"
    >
      Blog
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
        className="mt-4 inline-block rounded-full bg-text-primary px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        Get Premium Access
      </Link>
    </div>
  );
}
