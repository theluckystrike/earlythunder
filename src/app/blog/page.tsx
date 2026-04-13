import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Research notes, methodology updates, and analysis from the Early Thunder team.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <PageHeader count={posts.length} />
        {posts.length > 0 ? (
          <PostList posts={posts} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div className="border-b border-border pb-8">
      <h1 className="font-display text-3xl sm:text-4xl">Blog</h1>
      <p className="mt-2 text-text-secondary">
        Research notes, methodology updates, and analysis.{" "}
        {count} post{count !== 1 ? "s" : ""} published.
      </p>
    </div>
  );
}

function PostList({
  posts,
}: {
  readonly posts: readonly BlogPost[];
}) {
  if (!Array.isArray(posts)) return null;

  return (
    <div className="mt-8 space-y-8">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

function PostCard({ post }: { readonly post: BlogPost }) {
  if (!post || typeof post.slug !== "string") return null;

  return (
    <article className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-amber/30">
      <Link href={`/blog/${post.slug}`} className="block">
        <time className="text-xs text-text-secondary">
          {formatDate(post.published_at)}
        </time>
        <h2 className="mt-2 font-display text-xl text-text-primary group-hover:text-amber">
          {post.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {post.excerpt}
        </p>
        <TagList tags={post.tags} />
        <span className="mt-4 inline-block text-sm font-medium text-amber">
          Read more &rarr;
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
          className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 py-12 text-center">
      <p className="text-text-secondary">No blog posts published yet. Check back soon.</p>
    </div>
  );
}
