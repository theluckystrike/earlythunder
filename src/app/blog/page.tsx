import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Research notes, methodology updates, and analysis from Early Thunder.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader count={posts.length} />
      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function PageHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Blog
      </h1>
      <p className="mt-4 text-xl text-text-secondary">
        Research notes, methodology updates, and analysis.{" "}
        <span className="text-text-tertiary">
          {count} post{count !== 1 ? "s" : ""} published.
        </span>
      </p>
    </div>
  );
}

function PostGrid({ posts }: { readonly posts: readonly BlogPost[] }) {
  if (!Array.isArray(posts)) return null;

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

function PostCard({ post }: { readonly post: BlogPost }) {
  if (!post || typeof post.slug !== "string") return null;

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:border-border-hover">
      <Link href={`/blog/${post.slug}`} className="flex flex-1 flex-col">
        <time className="text-xs text-text-tertiary">
          {formatDate(post.published_at)}
        </time>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-text-primary">
          {post.title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
          {post.excerpt}
        </p>
        <TagList tags={post.tags} />
        <span className="mt-4 text-sm text-text-secondary transition-colors group-hover:text-text-primary">
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
        No blog posts published yet. Check back soon.
      </p>
    </div>
  );
}
