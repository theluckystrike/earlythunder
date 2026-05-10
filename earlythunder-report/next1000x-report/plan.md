# next1000x.com — Execution Plan

> Automated intelligence platform identifying pre-mainstream 1000x investment opportunities.
> Freemium model: free tier sees names/categories/scores; paid ($49/mo or $399/yr) gets full analysis.

**Tech Stack:** Next.js 14+ (App Router), Tailwind CSS, Supabase (PostgreSQL + Auth), Stripe, Vercel, pnpm
**Aesthetic:** Dark Bloomberg Terminal — data-dense, high-contrast, monospace accents, neon green/amber signals on dark backgrounds.
**Methodology:** Chunked execution. Each chunk is atomic, testable, dependency-ordered. NASA Power of 10.

**Status Key:** `[ ]` pending | `[x]` complete | `[~]` in progress | `[!]` blocked

---

## Batch 1: Project Scaffold

**Goal:** Bootable Next.js app with Tailwind dark theme, Supabase client, project structure, and env template. Deploy skeleton to Vercel.

### Chunk 1.1 — Next.js Init + pnpm Setup
- **Objective:** Initialize Next.js 14+ App Router project with TypeScript and pnpm.
- **Tasks:**
  - [ ] `pnpm create next-app@latest next1000x-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - [ ] Verify `pnpm dev` boots to default page at localhost:3000
  - [ ] Add `.nvmrc` with Node 20 LTS
  - [ ] Add `.env.local.example` with all required env var keys (empty values):
    ```
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
    NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=
    NEXT_PUBLIC_STRIPE_PRICE_YEARLY=
    RESEND_API_KEY=
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```
  - [ ] Add to `.gitignore`: `.env.local`, `.env.*.local`, `node_modules`, `.next`
- **Acceptance:** `pnpm dev` serves page. `.env.local.example` present with all keys. TypeScript compiles clean.
- **Status:** `[ ]`

### Chunk 1.2 — Tailwind Dark Bloomberg Theme
- **Objective:** Configure Tailwind with the dark Bloomberg Terminal aesthetic as the global default.
- **Tasks:**
  - [ ] Extend `tailwind.config.ts`:
    - Custom colors: `terminal-bg: #0a0a0f`, `terminal-green: #00ff88`, `terminal-amber: #ffaa00`, `terminal-red: #ff3344`, `terminal-muted: #4a4a5a`, `terminal-text: #e0e0e8`, `terminal-border: #1a1a2e`
    - Font families: `mono: ['JetBrains Mono', 'Fira Code', 'monospace']`, `sans: ['Inter', 'system-ui']`
  - [ ] Set `globals.css`: dark body bg, default text color, scrollbar styling
  - [ ] Install fonts: `pnpm add @fontsource/jetbrains-mono @fontsource/inter`
  - [ ] Create `src/app/layout.tsx` with dark theme defaults, meta tags, font imports
- **Acceptance:** App renders with dark background (#0a0a0f), monospace font, green accent visible on test text. No light mode flash.
- **Status:** `[ ]`

### Chunk 1.3 — Project Directory Structure
- **Objective:** Create the full directory skeleton following App Router conventions.
- **Tasks:**
  - [ ] Create directory tree:
    ```
    src/
      app/
        (marketing)/          # Landing, pricing, methodology
        (app)/                # Authenticated app pages
          opportunities/
            [slug]/
          graveyard/
        api/
          webhooks/
            stripe/
          cron/
        layout.tsx
        page.tsx
      components/
        ui/                   # Buttons, cards, badges, modals
        layout/               # Header, footer, sidebar
        opportunities/        # Grid, card, detail components
        paywall/              # Gate, upgrade CTA
      lib/
        supabase/
          client.ts           # Browser client
          server.ts           # Server client
          admin.ts            # Service role client
          types.ts            # Generated DB types
        stripe/
          client.ts
          webhooks.ts
        utils/
          formatting.ts       # Numbers, dates, scores
          constants.ts        # Site-wide constants
      types/
        index.ts              # Shared TypeScript types
    ```
  - [ ] Add placeholder `index.ts` barrel exports in each `lib/` subdirectory
- **Acceptance:** All directories exist. No import errors on empty barrel files. `pnpm build` passes.
- **Status:** `[ ]`

### Chunk 1.4 — Supabase Client Setup
- **Objective:** Configure Supabase JS client for browser, server components, and server actions.
- **Tasks:**
  - [ ] `pnpm add @supabase/supabase-js @supabase/ssr`
  - [ ] Implement `src/lib/supabase/client.ts` — browser client (singleton, uses anon key)
  - [ ] Implement `src/lib/supabase/server.ts` — server component client (uses cookies)
  - [ ] Implement `src/lib/supabase/admin.ts` — service role client (for cron/webhooks only)
  - [ ] Implement `src/lib/supabase/types.ts` — placeholder, will be generated from schema
  - [ ] Add Supabase middleware in `src/middleware.ts` for session refresh
- **Acceptance:** Import each client without errors. Middleware runs on dev server. No runtime crashes when env vars are empty (graceful null checks).
- **Status:** `[ ]`

### Chunk 1.5 — Shared UI Primitives
- **Objective:** Build a small set of reusable UI components in the Bloomberg style.
- **Tasks:**
  - [ ] `pnpm add clsx tailwind-merge` (for `cn()` utility)
  - [ ] Create `src/lib/utils/cn.ts` — className merge utility
  - [ ] Create components:
    - `ui/Button.tsx` — primary (green), secondary (muted), destructive (red) variants
    - `ui/Badge.tsx` — score badges, category tags, status indicators
    - `ui/Card.tsx` — dark bordered card with hover glow
    - `ui/Input.tsx` — dark input with terminal-style focus ring
    - `ui/Skeleton.tsx` — loading placeholder
  - [ ] All components use `forwardRef`, accept `className` prop, merge with `cn()`
- **Acceptance:** Each component renders in isolation. Consistent dark theme. TypeScript types exported.
- **Status:** `[ ]`

### Chunk 1.6 — Initial Vercel Deploy
- **Objective:** Deploy skeleton app to Vercel, confirm production build works.
- **Tasks:**
  - [ ] Connect GitHub repo to Vercel project
  - [ ] Set framework preset to Next.js, install command to `pnpm install`
  - [ ] Add env vars in Vercel dashboard (can be placeholder values initially)
  - [ ] Trigger deploy, confirm build succeeds
  - [ ] Verify live URL loads dark-themed skeleton
  - [ ] Set up custom domain `next1000x.com` (if DNS ready)
- **Acceptance:** Production URL returns 200. Dark theme renders. No build errors in Vercel logs.
- **Status:** `[ ]`

---

## Batch 2: Database

**Goal:** Full Supabase schema with RLS, seed data for 30-50 opportunities, and generated TypeScript types.

### Chunk 2.1 — Core Schema: Opportunities Table
- **Objective:** Create the primary `opportunities` table with all required columns.
- **Tasks:**
  - [ ] Create Supabase migration `001_opportunities.sql`:
    ```sql
    create table public.opportunities (
      id uuid primary key default gen_random_uuid(),
      slug text unique not null,
      name text not null,
      ticker text,                          -- optional token/stock ticker
      category text not null,               -- AI, DePIN, RWA, Biotech, etc.
      subcategory text,
      score integer not null check (score >= 0 and score <= 100),
      status text not null default 'active' check (status in ('active', 'watching', 'graduated', 'dead')),

      -- Free tier fields (visible to all)
      one_liner text not null,              -- 1-sentence pitch
      market_cap_usd bigint,
      price_usd numeric(20,8),

      -- Paid tier fields
      thesis text,                          -- Full investment thesis (markdown)
      catalysts jsonb default '[]',         -- Upcoming catalysts array
      risks jsonb default '[]',             -- Risk factors array
      metrics jsonb default '{}',           -- Key metrics object
      team_notes text,
      competitor_analysis text,
      entry_strategy text,

      -- Metadata
      discovered_at timestamptz not null default now(),
      last_signal_at timestamptz,
      graduated_at timestamptz,
      died_at timestamptz,
      tags text[] default '{}',
      external_links jsonb default '[]',

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index idx_opportunities_slug on public.opportunities(slug);
    create index idx_opportunities_category on public.opportunities(category);
    create index idx_opportunities_score on public.opportunities(score desc);
    create index idx_opportunities_status on public.opportunities(status);
    ```
  - [ ] Add `updated_at` trigger function
  - [ ] Run migration against Supabase project
- **Acceptance:** Table exists in Supabase. Can insert and query a test row via SQL editor. Indexes created.
- **Status:** `[ ]`

### Chunk 2.2 — Users & Subscriptions Schema
- **Objective:** Create profiles table linked to Supabase Auth and subscription tracking.
- **Tasks:**
  - [ ] Create migration `002_users.sql`:
    ```sql
    create table public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text not null,
      full_name text,
      stripe_customer_id text unique,
      subscription_status text default 'free' check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
      subscription_tier text default 'free' check (subscription_tier in ('free', 'monthly', 'yearly')),
      subscription_end_date timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index idx_profiles_stripe on public.profiles(stripe_customer_id);
    create index idx_profiles_sub_status on public.profiles(subscription_status);
    ```
  - [ ] Create trigger: on `auth.users` insert, auto-create `profiles` row
  - [ ] Create `email_subscribers` table for non-auth email capture:
    ```sql
    create table public.email_subscribers (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      source text default 'landing',       -- landing, blog, opportunity_page
      subscribed_at timestamptz not null default now(),
      unsubscribed_at timestamptz
    );
    ```
- **Acceptance:** Auth user creation triggers profile row. Email subscribers table accepts inserts. Constraints enforced.
- **Status:** `[ ]`

### Chunk 2.3 — Row Level Security Policies
- **Objective:** Lock down all tables with RLS. Free vs paid data access enforced at DB level.
- **Tasks:**
  - [ ] Enable RLS on all tables
  - [ ] `opportunities` policies:
    - SELECT (anon/authenticated): allow reading free-tier columns (id, slug, name, ticker, category, subcategory, score, status, one_liner, market_cap_usd, price_usd, discovered_at, tags)
    - SELECT (authenticated + active subscription): allow reading ALL columns
    - INSERT/UPDATE/DELETE: service_role only
  - [ ] `profiles` policies:
    - SELECT own row: `auth.uid() = id`
    - UPDATE own row: `auth.uid() = id` (limited to full_name only)
    - INSERT/DELETE: service_role only
  - [ ] `email_subscribers` policies:
    - INSERT (anon): allow (for email capture forms)
    - SELECT/UPDATE/DELETE: service_role only
  - [ ] Create a DB function `is_paid_user()` that checks subscription_status = 'active'
- **Acceptance:** Anon user can read free fields only. Paid user reads all fields. Direct SQL confirms RLS blocks unauthorized access. Service role bypasses RLS.
- **Status:** `[ ]`

### Chunk 2.4 — Seed Data: 30-50 Opportunities
- **Objective:** Populate database with curated initial opportunities across categories.
- **Tasks:**
  - [ ] Research and curate 30-50 pre-mainstream opportunities across categories:
    - AI / AI Infrastructure (8-10)
    - DePIN / Decentralized Physical Infrastructure (5-7)
    - Real World Assets / RWA (4-6)
    - Biotech / Longevity (4-6)
    - Energy / Climate Tech (4-5)
    - Frontier Tech (3-5 — robotics, space, quantum)
  - [ ] For each entry, populate free-tier fields: name, slug, ticker, category, subcategory, score, one_liner, market_cap, tags
  - [ ] Create seed script `scripts/seed-opportunities.ts` using Supabase admin client
  - [ ] Run seed script, verify all rows inserted
- **Acceptance:** 30-50 rows in `opportunities` table. All categories represented. Scores distributed 40-95 range. Slugs are URL-safe.
- **Status:** `[ ]`

### Chunk 2.5 — Generate TypeScript Types
- **Objective:** Auto-generate TypeScript types from Supabase schema for type-safe queries.
- **Tasks:**
  - [ ] `pnpm add -D supabase`
  - [ ] Add script to `package.json`: `"db:types": "supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts"`
  - [ ] Run type generation
  - [ ] Create `src/types/opportunities.ts` with derived application types:
    ```typescript
    // Free tier view (what anon users see)
    type OpportunityPreview = Pick<Opportunity, 'id' | 'slug' | 'name' | 'ticker' | 'category' | 'subcategory' | 'score' | 'status' | 'one_liner' | 'market_cap_usd' | 'price_usd' | 'discovered_at' | 'tags'>

    // Full view (what paid users see)
    type OpportunityFull = Opportunity
    ```
  - [ ] Verify all Supabase queries in existing code (if any) use generated types
- **Acceptance:** `src/lib/supabase/types.ts` has full DB schema types. Application types compile. No `any` types in DB layer.
- **Status:** `[ ]`

---

## Batch 3: Core Pages

**Goal:** All user-facing pages rendered with real data. Free tier experience complete.

### Chunk 3.1 — Layout Shell: Header + Footer
- **Objective:** Build the persistent layout with navigation header and footer.
- **Tasks:**
  - [ ] Create `src/components/layout/Header.tsx`:
    - Logo: "NEXT1000X" in monospace, green glow
    - Nav links: Opportunities, Methodology, Graveyard, Pricing
    - Right side: Sign In button (unauthenticated) or avatar/menu (authenticated)
    - Mobile hamburger menu
  - [ ] Create `src/components/layout/Footer.tsx`:
    - Links: About, Methodology, Terms, Privacy, Twitter/X
    - "Not financial advice" disclaimer
    - Copyright
  - [ ] Wire into root `layout.tsx`
  - [ ] Ensure header is sticky, z-indexed, with subtle border-bottom
- **Acceptance:** Header renders on all pages. Navigation links work (even to empty pages). Mobile responsive. Footer at bottom.
- **Status:** `[ ]`

### Chunk 3.2 — Landing Page
- **Objective:** High-conversion landing page that communicates the value proposition.
- **Tasks:**
  - [ ] Create `src/app/(marketing)/page.tsx` (or root `page.tsx`):
    - Hero section: "Find the Next 1000x Before Everyone Else" + subhead + CTA buttons
    - Live ticker/marquee of top-scored opportunities (names + scores only — free tier teaser)
    - "How It Works" — 3-step explainer (SCOUT scans, ANALYST scores, you invest)
    - Social proof / stats section (opportunities tracked, avg early discovery lead time)
    - Sample opportunity card (blurred paid fields)
    - Email capture form: "Get the weekly brief free"
    - Pricing teaser with CTA to /pricing
  - [ ] Wire email capture form to `email_subscribers` table via server action
  - [ ] Add subtle animations: fade-in on scroll, ticker scroll, score counter
- **Acceptance:** Page loads in <2s. Email capture inserts to DB. Mobile responsive. Above-fold CTA visible without scroll.
- **Status:** `[ ]`

### Chunk 3.3 — Opportunities Grid Page
- **Objective:** Filterable, sortable grid of all opportunities — the core product page.
- **Tasks:**
  - [ ] Create `src/app/(app)/opportunities/page.tsx`
  - [ ] Create `src/components/opportunities/OpportunityGrid.tsx`:
    - Table/grid view with columns: Name, Category, Score (color-coded), Status, Market Cap, Discovered
    - Score badges: green (80+), amber (60-79), red (<60)
    - Click row to navigate to `/opportunities/[slug]`
  - [ ] Create `src/components/opportunities/GridFilters.tsx`:
    - Filter by: category (multi-select), status, score range
    - Sort by: score, discovered date, market cap, name
    - Search box (name/ticker)
  - [ ] Fetch data server-side with Supabase (free-tier columns only for anon)
  - [ ] Add URL search params for filter state (shareable filtered views)
- **Acceptance:** Grid renders 30-50 opportunities. Filters narrow results. Sort works. Mobile: card layout instead of table. Loads server-side.
- **Status:** `[ ]`

### Chunk 3.4 — Opportunity Detail Page
- **Objective:** Individual opportunity page with free preview and paid content behind paywall.
- **Tasks:**
  - [ ] Create `src/app/(app)/opportunities/[slug]/page.tsx`
  - [ ] Free section (always visible):
    - Name, ticker, category, score badge, status, one-liner
    - Market cap, price
    - Tags
    - Discovered date
  - [ ] Paid section (behind paywall gate):
    - Full thesis (rendered markdown)
    - Catalysts timeline
    - Risk matrix
    - Key metrics dashboard
    - Team notes
    - Competitor analysis
    - Entry strategy
  - [ ] Create `src/components/paywall/PaywallGate.tsx`:
    - If user is not paid: show blurred content preview + "Unlock Full Analysis" CTA
    - If user is paid: render full content
  - [ ] Generate `metadata` for SEO (dynamic title, description from one_liner)
  - [ ] Add `generateStaticParams` for SSG of all opportunity pages
- **Acceptance:** Free content renders for anon users. Paid content is blurred/gated. Paid users see everything. SEO meta tags present. Page is statically generated.
- **Status:** `[ ]`

### Chunk 3.5 — Methodology + Graveyard + Pricing Pages
- **Objective:** Build the three supporting static/semi-static pages.
- **Tasks:**
  - [ ] `/methodology` page:
    - Explain the SCOUT scanning process
    - Scoring rubric (0-100 breakdown by factor)
    - Data sources list
    - "Why we're different" — systematic, not hype-driven
  - [ ] `/graveyard` page:
    - Grid of `status = 'dead'` opportunities
    - Post-mortem snippets (what went wrong)
    - Transparency signal: "We track our misses too"
  - [ ] `/pricing` page:
    - Two-tier comparison: Free vs Pro
    - Feature matrix table
    - Monthly ($49) and Yearly ($399 — save 32%) toggle
    - CTA buttons that link to Stripe checkout (wired in Batch 4)
    - FAQ accordion
- **Acceptance:** All three pages render. Pricing shows correct amounts. Graveyard filters to dead entries. Methodology content is substantive.
- **Status:** `[ ]`

---

## Batch 4: Auth & Paywall

**Goal:** Full authentication flow, Stripe subscription checkout, webhook processing, and content gating enforced.

### Chunk 4.1 — Supabase Auth: Sign Up / Sign In / Sign Out
- **Objective:** Implement email-based authentication with Supabase Auth.
- **Tasks:**
  - [ ] Create `src/app/(auth)/login/page.tsx` — email + password form
  - [ ] Create `src/app/(auth)/signup/page.tsx` — email + password + name form
  - [ ] Create `src/app/(auth)/callback/route.ts` — OAuth callback handler
  - [ ] Implement sign-out server action
  - [ ] Create `src/components/layout/AuthButton.tsx` — conditional sign in/out + avatar
  - [ ] Add auth state to Header component
  - [ ] Configure Supabase Auth email templates (confirm, reset)
  - [ ] Test: sign up creates profile row, sign in establishes session, sign out clears session
- **Acceptance:** User can sign up, receives confirmation email, signs in, sees authenticated header state, signs out. Profile row auto-created.
- **Status:** `[ ]`

### Chunk 4.2 — Stripe Products & Checkout Session
- **Objective:** Create Stripe products and implement checkout session creation.
- **Tasks:**
  - [ ] Create Stripe products in dashboard:
    - "Next1000x Pro Monthly" — $49/mo recurring
    - "Next1000x Pro Yearly" — $399/yr recurring
  - [ ] Create `src/lib/stripe/client.ts` — Stripe SDK init
  - [ ] Create `src/app/api/checkout/route.ts`:
    - POST handler: accepts price_id, creates Stripe checkout session
    - Includes `customer_email` from auth session
    - Sets `metadata.user_id` for webhook linking
    - Success URL: `/opportunities?upgraded=true`
    - Cancel URL: `/pricing`
  - [ ] Wire pricing page CTA buttons to call checkout API
  - [ ] Test in Stripe test mode with test card
- **Acceptance:** Clicking "Subscribe" on pricing page redirects to Stripe checkout. Test payment completes. Redirect back to app works.
- **Status:** `[ ]`

### Chunk 4.3 — Stripe Webhook Handler
- **Objective:** Process Stripe webhook events to update subscription status in database.
- **Tasks:**
  - [ ] Create `src/app/api/webhooks/stripe/route.ts`:
    - Verify webhook signature with `STRIPE_WEBHOOK_SECRET`
    - Handle events:
      - `checkout.session.completed` — set subscription active, store stripe_customer_id
      - `customer.subscription.updated` — sync status changes
      - `customer.subscription.deleted` — set subscription to canceled
      - `invoice.payment_failed` — set subscription to past_due
    - Use Supabase admin client (service role) to update profiles
  - [ ] Add webhook endpoint in Stripe dashboard (or use Stripe CLI for local testing)
  - [ ] Create `src/lib/stripe/webhooks.ts` — event handler functions (keep route file thin)
  - [ ] Log all webhook events for debugging
- **Acceptance:** Test webhook with Stripe CLI. Checkout completion updates profile to `subscription_status: 'active'`. Cancellation sets to `'canceled'`. No signature verification failures.
- **Status:** `[ ]`

### Chunk 4.4 — Subscription Management Portal
- **Objective:** Allow users to manage their subscription (cancel, update payment, view invoices).
- **Tasks:**
  - [ ] Create `src/app/(app)/account/page.tsx`:
    - Show current plan, status, renewal date
    - "Manage Subscription" button that creates Stripe Customer Portal session
  - [ ] Create `src/app/api/portal/route.ts`:
    - POST handler: creates Stripe billing portal session
    - Redirects to Stripe's hosted portal
  - [ ] Configure Stripe Customer Portal settings (allow cancel, no plan changes for now)
  - [ ] Add "Account" link to authenticated header nav
- **Acceptance:** Paid user can access account page, click manage, land on Stripe portal, cancel subscription. Status updates via webhook.
- **Status:** `[ ]`

### Chunk 4.5 — Paywall Gate Enforcement
- **Objective:** Enforce content gating across the app. Free users see teaser, paid users see full content.
- **Tasks:**
  - [ ] Finalize `src/components/paywall/PaywallGate.tsx`:
    - Server component that checks auth + subscription status
    - Props: `children` (paid content), `fallback` (blurred preview + CTA)
    - Uses server-side Supabase client to check profile
  - [ ] Create `src/components/paywall/UpgradeCTA.tsx`:
    - "Unlock Full Analysis" card with feature bullets
    - Link to /pricing
  - [ ] Apply PaywallGate to:
    - Opportunity detail page (thesis, catalysts, risks, etc.)
    - Any future premium-only content
  - [ ] Verify: RLS + component gate = double enforcement (belt and suspenders)
- **Acceptance:** Anon user: sees free fields + blurred gate. Signed-in free user: same. Paid user: sees everything. No way to leak paid content client-side.
- **Status:** `[ ]`

---

## Batch 5: Content Pipeline

**Goal:** Generate high-quality analysis content for all seeded opportunities. Establish template for ongoing content production.

### Chunk 5.1 — WRITER Agent Prompt Templates
- **Objective:** Create structured prompts for generating opportunity analysis content.
- **Tasks:**
  - [ ] Create `scripts/writer/` directory
  - [ ] Create prompt templates:
    - `thesis-prompt.md` — generates 500-800 word investment thesis
    - `catalysts-prompt.md` — generates 3-5 upcoming catalysts with dates/impact
    - `risks-prompt.md` — generates 3-5 risk factors with severity ratings
    - `metrics-prompt.md` — generates key metrics to track with current values
    - `competitor-prompt.md` — generates competitor landscape analysis
    - `entry-strategy-prompt.md` — generates suggested entry/exit strategy
  - [ ] Each prompt takes: name, category, one_liner, existing public data
  - [ ] Include quality rubric: no hype language, cite specific data, acknowledge uncertainty
- **Acceptance:** Prompts produce consistent, high-quality output when tested manually with Claude. Output format matches DB schema (markdown for text fields, JSON for structured fields).
- **Status:** `[ ]`

### Chunk 5.2 — Batch Content Generation Script
- **Objective:** Script that generates full analysis for all seeded opportunities.
- **Tasks:**
  - [ ] Create `scripts/writer/generate-analyses.ts`:
    - Fetches all opportunities missing thesis content
    - For each, calls Claude API with appropriate prompts
    - Parses output into structured fields
    - Updates opportunity row with generated content
    - Rate-limited to avoid API throttling
    - Idempotent: skip already-populated entries
  - [ ] Add progress logging (X/50 complete)
  - [ ] Add dry-run mode for testing
  - [ ] Store raw API responses in `scripts/writer/output/` for review
- **Acceptance:** Running script populates thesis, catalysts, risks, metrics, competitor_analysis, entry_strategy for all 30-50 opportunities. Content is substantive (not generic filler).
- **Status:** `[ ]`

### Chunk 5.3 — Content Review & Quality Pass
- **Objective:** Review generated content, fix errors, ensure quality bar.
- **Tasks:**
  - [ ] Create `scripts/writer/review-content.ts` — outputs all generated content to reviewable format
  - [ ] Quality checklist per entry:
    - [ ] Thesis is specific to this opportunity (not generic)
    - [ ] Catalysts have approximate dates or triggers
    - [ ] Risks are real, not boilerplate
    - [ ] Metrics are relevant and have current values
    - [ ] No hallucinated facts or dead links
  - [ ] Create `scripts/writer/update-entry.ts` — CLI tool to update specific fields for specific slugs
  - [ ] Do a manual pass on at least the top 10 scored opportunities
- **Acceptance:** Top 10 opportunities have manually-verified, high-quality content. All entries have plausible content. No obvious hallucinations.
- **Status:** `[ ]`

### Chunk 5.4 — Weekly Brief Template
- **Objective:** Create the template and generation system for the weekly intelligence brief.
- **Tasks:**
  - [ ] Design weekly brief template (markdown -> email-safe HTML):
    - Header: "NEXT1000X WEEKLY BRIEF — Week of [date]"
    - "New Discoveries" — opportunities added this week
    - "Signal Updates" — score changes, catalyst hits, status changes
    - "Top Movers" — biggest score/price changes
    - "Watchlist" — upcoming catalysts in next 7 days
    - Footer: CTA to upgrade (for free users) or view full dashboard
  - [ ] Create `scripts/writer/generate-weekly-brief.ts`:
    - Queries DB for changes since last brief
    - Generates summary narratives
    - Outputs markdown + HTML versions
  - [ ] Store briefs in `public/briefs/` for web archive access
- **Acceptance:** Script generates a plausible weekly brief from current DB state. HTML renders correctly in email preview. Brief is < 5 min read.
- **Status:** `[ ]`

---

## Batch 6: Programmatic SEO

**Goal:** Generate high-quality SEO pages that drive organic traffic. Schema markup, sitemap, meta optimization.

### Chunk 6.1 — Dynamic Meta Tags & Open Graph
- **Objective:** Every page has optimized, unique meta tags and Open Graph data.
- **Tasks:**
  - [ ] Implement `generateMetadata()` in each page:
    - Landing: "Next1000x — Find 1000x Opportunities Before Everyone Else"
    - Opportunities grid: "Top [Category] Investment Opportunities | Next1000x"
    - Opportunity detail: "[Name] Analysis & Score | Next1000x"
    - Methodology: "Our Methodology: How We Score 1000x Opportunities"
  - [ ] Add Open Graph images:
    - Create `src/app/api/og/route.tsx` using `@vercel/og` (or `next/og`)
    - Dynamic OG images for opportunity pages showing name + score + category
    - Default OG image for other pages
  - [ ] Add Twitter card meta tags
  - [ ] Test with social card validators (Twitter, LinkedIn, Facebook debugger)
- **Acceptance:** Every page has unique title + description. OG images generate correctly. Social shares show rich previews.
- **Status:** `[ ]`

### Chunk 6.2 — Category & Tag Landing Pages
- **Objective:** Create programmatic SEO pages for each category and popular tag.
- **Tasks:**
  - [ ] Create `src/app/(app)/opportunities/category/[category]/page.tsx`:
    - Filtered grid showing only that category
    - Category-specific intro paragraph (SEO content)
    - H1: "Best [Category] Investment Opportunities for 2025"
    - Internal links to individual opportunities
  - [ ] Create `src/app/(app)/opportunities/tag/[tag]/page.tsx`:
    - Similar to category pages but for tags
  - [ ] Generate static params from DB categories and tags
  - [ ] Add breadcrumb navigation
  - [ ] Add internal linking between related categories
- **Acceptance:** Category pages render at `/opportunities/category/ai`, `/opportunities/category/depin`, etc. Pages are statically generated. Each has unique SEO content.
- **Status:** `[ ]`

### Chunk 6.3 — Blog / Insights Template
- **Objective:** Set up blog infrastructure for content marketing SEO.
- **Tasks:**
  - [ ] Create `src/app/(marketing)/blog/page.tsx` — blog index
  - [ ] Create `src/app/(marketing)/blog/[slug]/page.tsx` — blog post page
  - [ ] Create `blog_posts` table in Supabase (or use MDX files):
    ```sql
    create table public.blog_posts (
      id uuid primary key default gen_random_uuid(),
      slug text unique not null,
      title text not null,
      excerpt text,
      content text not null,          -- markdown
      author text default 'NEXT1000X Research',
      category text,
      tags text[] default '{}',
      published_at timestamptz,
      is_published boolean default false,
      created_at timestamptz default now()
    );
    ```
  - [ ] Create 3-5 seed blog posts:
    - "What is a 1000x Opportunity?"
    - "Our Scoring Methodology Explained"
    - "[Category] Opportunities to Watch in 2025"
  - [ ] Blog post component: rendered markdown, table of contents, related opportunities sidebar
- **Acceptance:** Blog index lists posts. Individual posts render markdown. SEO meta tags present. Published flag respected.
- **Status:** `[ ]`

### Chunk 6.4 — Sitemap & Robots & Schema Markup
- **Objective:** Technical SEO: sitemap, robots.txt, JSON-LD structured data.
- **Tasks:**
  - [ ] Create `src/app/sitemap.ts` — dynamic sitemap:
    - All opportunity pages
    - All category pages
    - All blog posts
    - Static pages (landing, methodology, pricing, graveyard)
    - Priority and changeFreq set per page type
  - [ ] Create `src/app/robots.ts`:
    - Allow all crawlers
    - Disallow: /api/, /account/
    - Sitemap URL reference
  - [ ] Add JSON-LD structured data:
    - Organization schema on landing page
    - Article schema on blog posts
    - Product schema on opportunity pages
    - FAQ schema on pricing page
  - [ ] Create `src/components/seo/JsonLd.tsx` — reusable JSON-LD component
- **Acceptance:** `/sitemap.xml` returns valid XML with all pages. `/robots.txt` is correct. JSON-LD validates in Google's Rich Results Test.
- **Status:** `[ ]`

---

## Batch 7: Email

**Goal:** Transactional and marketing email system. Welcome sequence, weekly brief delivery.

### Chunk 7.1 — Resend Setup & Email Components
- **Objective:** Configure Resend SDK and create reusable email templates.
- **Tasks:**
  - [ ] `pnpm add resend @react-email/components`
  - [ ] Create `src/lib/email/client.ts` — Resend client init
  - [ ] Create email templates in `src/lib/email/templates/`:
    - `WelcomeEmail.tsx` — React Email component for welcome
    - `WeeklyBriefEmail.tsx` — template for weekly intelligence brief
    - `UpgradeEmail.tsx` — nudge to upgrade after X free visits
  - [ ] All templates: dark theme matching site, responsive, plain text fallback
  - [ ] Set up sending domain in Resend (DNS records)
  - [ ] Test send via Resend dashboard
- **Acceptance:** Emails render correctly in React Email preview. Test send received in inbox. Not landing in spam.
- **Status:** `[ ]`

### Chunk 7.2 — Welcome Sequence
- **Objective:** Automated email sequence for new subscribers and new users.
- **Tasks:**
  - [ ] On email_subscriber insert (landing page signup):
    - Send welcome email immediately: "Welcome to Next1000x — here's what to expect"
    - Include: top 3 opportunities teaser, link to full grid, what the weekly brief includes
  - [ ] On auth.users signup:
    - Send welcome email with account details
    - If free tier: include upgrade CTA
  - [ ] Create `src/app/api/email/welcome/route.ts` — triggered by Supabase webhook or DB trigger
  - [ ] Add unsubscribe link handling
- **Acceptance:** New email subscriber gets welcome email within 60s. New user signup gets welcome email. Unsubscribe link works.
- **Status:** `[ ]`

### Chunk 7.3 — Weekly Brief Email Dispatch
- **Objective:** Automated weekly email sending the intelligence brief to all subscribers.
- **Tasks:**
  - [ ] Create `src/app/api/cron/weekly-brief/route.ts`:
    - Generates weekly brief content (from Batch 5.4)
    - Fetches all active email subscribers + all users with email preference
    - Sends personalized brief:
      - Free users: truncated brief + upgrade CTA
      - Paid users: full brief
    - Batch sending with rate limiting (Resend limits)
  - [ ] Set up Vercel Cron: every Monday 8am ET
  - [ ] Add `vercel.json` cron config:
    ```json
    { "crons": [{ "path": "/api/cron/weekly-brief", "schedule": "0 13 * * 1" }] }
    ```
  - [ ] Add cron secret verification (prevent unauthorized triggers)
- **Acceptance:** Cron triggers successfully. Brief email sent to test subscribers. Free vs paid content differentiation works. Rate limiting prevents Resend throttling.
- **Status:** `[ ]`

---

## Batch 8: SCOUT Automation

**Goal:** Automated scanning pipeline that discovers new opportunities and updates existing ones on a weekly cycle.

### Chunk 8.1 — Data Source Integrations
- **Objective:** Build adapters for each data source the SCOUT system will scan.
- **Tasks:**
  - [ ] Create `src/lib/scout/sources/` directory
  - [ ] Implement source adapters:
    - `twitter.ts` — track crypto/tech KOL mentions (via API or scraping service)
    - `github.ts` — trending repos, star velocity (GitHub API)
    - `defillama.ts` — DeFi TVL data, new protocols (DeFi Llama API)
    - `coingecko.ts` — new token listings, volume spikes (CoinGecko API)
    - `arxiv.ts` — new papers in relevant categories (arXiv API)
    - `crunchbase.ts` — new funding rounds (Crunchbase API or alternative)
  - [ ] Each adapter: `scan(): Promise<RawSignal[]>` interface
  - [ ] `RawSignal` type: `{ source, name, description, url, signal_strength, category_hint, raw_data }`
  - [ ] Add rate limiting and error handling per source
- **Acceptance:** Each adapter returns structured signals when called. Errors don't crash the pipeline. Rate limits respected.
- **Status:** `[ ]`

### Chunk 8.2 — Signal Detection & Scoring
- **Objective:** Process raw signals into scored potential opportunities.
- **Tasks:**
  - [ ] Create `src/lib/scout/detector.ts`:
    - Deduplication: merge signals about the same entity across sources
    - Novelty check: is this already in our DB?
    - Signal scoring: weight by source reliability, signal strength, recency
    - Category classification: assign category based on signals
  - [ ] Create `src/lib/scout/scorer.ts`:
    - Initial scoring rubric (0-100):
      - Market timing (20 pts): how early are we?
      - Team/tech quality (20 pts): based on available data
      - Market size (20 pts): TAM indicators
      - Community momentum (20 pts): social signals, GitHub activity
      - Risk factors (20 pts): red flags deduction
    - Uses Claude API for qualitative assessment where needed
  - [ ] Output: list of `ScoredCandidate` objects ready for DB insertion
- **Acceptance:** Given raw signals, produces deduplicated, scored candidates. Scores are in reasonable range. Known entities are filtered out.
- **Status:** `[ ]`

### Chunk 8.3 — Weekly Scan Pipeline
- **Objective:** Orchestrate the full weekly scanning cycle as an automated cron job.
- **Tasks:**
  - [ ] Create `src/app/api/cron/scout-scan/route.ts`:
    1. Run all source adapters (parallel where possible)
    2. Feed signals through detector
    3. Score candidates
    4. Insert new opportunities with `status: 'watching'` (not yet promoted to 'active')
    5. Update existing opportunities: refresh scores, update metrics, detect status changes
    6. Generate scan report (what was found, what changed)
    7. Store report in `scout_reports` table
  - [ ] Create `scout_reports` table:
    ```sql
    create table public.scout_reports (
      id uuid primary key default gen_random_uuid(),
      run_at timestamptz not null default now(),
      new_candidates integer default 0,
      updated_entries integer default 0,
      status_changes jsonb default '[]',
      report_data jsonb not null,
      duration_ms integer
    );
    ```
  - [ ] Set up Vercel Cron: every Sunday 2am ET
  - [ ] Add alerting: if scan fails, notify via email
- **Acceptance:** Cron triggers full pipeline. New candidates inserted. Existing entries updated. Report stored. Pipeline completes within Vercel function timeout (or use background function).
- **Status:** `[ ]`

### Chunk 8.4 — Promotion & Graduation Logic
- **Objective:** Automate the lifecycle of opportunities: watching -> active -> graduated/dead.
- **Tasks:**
  - [ ] Create `src/lib/scout/lifecycle.ts`:
    - **Promotion** (watching -> active): when score exceeds threshold (e.g., 60) and manual review confirms
    - **Graduation** (active -> graduated): when opportunity achieves mainstream recognition (market cap threshold, major exchange listing, etc.)
    - **Death** (active -> dead): sustained score decline, project abandonment signals, rug pull detection
  - [ ] Create `src/app/api/cron/lifecycle-check/route.ts`:
    - Runs daily
    - Checks all active opportunities for graduation/death triggers
    - Checks all watching opportunities for promotion triggers
    - Sends alert for items requiring manual review
  - [ ] Add `opportunity_history` table for tracking score changes over time:
    ```sql
    create table public.opportunity_history (
      id uuid primary key default gen_random_uuid(),
      opportunity_id uuid references public.opportunities(id),
      score integer,
      status text,
      market_cap_usd bigint,
      price_usd numeric(20,8),
      snapshot_at timestamptz not null default now()
    );
    ```
  - [ ] Store daily snapshots for trend data
- **Acceptance:** Lifecycle transitions work. History table populated. Graduated items appear on graveyard page. Score trends queryable.
- **Status:** `[ ]`

---

## Dependency Graph

```
Batch 1 (Scaffold) ──> Batch 2 (Database) ──> Batch 3 (Core Pages)
                                           ──> Batch 4 (Auth & Paywall)
                                           ──> Batch 5 (Content Pipeline)
Batch 3 + 4 ──> Batch 6 (SEO)
Batch 2 + 4 ──> Batch 7 (Email)
Batch 2 + 5 ──> Batch 8 (SCOUT)
```

Batches 3, 4, and 5 can run in parallel once Batch 2 is complete.
Batches 6, 7, and 8 can run in parallel once their dependencies are met.

---

## Execution Notes

- **Parallelism:** Up to 5 agents can work simultaneously. Ideal split after Batch 2:
  - Agent 1: Batch 3 (Core Pages)
  - Agent 2: Batch 4 (Auth & Paywall)
  - Agent 3: Batch 5 (Content Pipeline)
  - Agent 4: Batch 6 (SEO) — starts once Batch 3.1 is done
  - Agent 5: Batch 7 (Email) — starts once Batch 4.3 is done

- **Testing:** Each chunk must be manually verifiable before marking complete. No "trust me, it works."

- **NASA Power of 10 applied:**
  1. Simple control flow — no nested callbacks, use async/await
  2. Fixed upper bounds on loops — always paginate, always limit
  3. No dynamic memory after init — pre-allocate Supabase response shapes
  4. Functions < 60 lines — extract helpers aggressively
  5. Assertions: validate all external data at boundaries (API responses, webhooks, form inputs)
  6. Minimal scope — each module exports only what's needed
  7. Check return values — every Supabase/Stripe call checks for errors
  8. Limit preprocessor use — minimal conditional compilation
  9. Restrict pointer use — N/A in TypeScript, but: no `any` types
  10. Compile clean — zero TypeScript errors, zero ESLint warnings

- **When in doubt:** Ship the simpler version first. Optimize later.
