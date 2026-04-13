# Early Thunder

**Hear the storm before anyone else.**

Track pre-mainstream asymmetric opportunities across crypto, deep tech, and emerging markets. Our 8-Signal Pattern Filter scores what others miss.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Deployment**: Cloudflare Pages
- **Package Manager**: pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production (static export)
pnpm build

# Lint
pnpm lint
```

The development server runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/           — Next.js App Router pages and metadata
  components/    — Reusable React components
  lib/           — Shared utilities, types, and constants
data/
  opportunities.json — Tracked opportunity data
  blog.json          — Blog post content
  blog-posts.json    — Extended blog post content
public/
  og-default.svg     — Open Graph fallback image
  _headers           — Cloudflare Pages security headers
  _redirects         — Cloudflare Pages redirect rules
worker/              — Cloudflare Worker API (email subscriptions)
wrangler.toml        — Cloudflare Pages deployment config
```

## Deployment

The site deploys to Cloudflare Pages as a static export.

```bash
# Build and preview locally
pnpm build && npx wrangler pages dev out

# Deploy (via Cloudflare Pages CI or manual)
npx wrangler pages deploy out
```

Connect the GitHub repository to Cloudflare Pages for automatic deployments on push to `main`.

## Live Site

[https://earlythunder.com](https://earlythunder.com)
