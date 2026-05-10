# next1000x.com — Comprehensive SEO Strategy

## 1. Programmatic SEO Pages

### 1.1 `/blog/what-is-[project-name]`

**Purpose:** Educational entry point for every project in the database. Captures top-of-funnel informational queries like "what is Bittensor" or "what is Helium network."

**Target keyword pattern:**
- Primary: `what is [project name]`
- Secondary: `[project name] explained`, `[project name] overview`, `[project name] guide`
- Long-tail: `what does [project name] do`, `how does [project name] work`

**Template structure:**

```
H1: What is [Project Name]? A Deep-Dive Research Brief
  H2: TL;DR — [Project Name] in 30 Seconds
    - One-liner from {{opportunity.one_liner}}
    - Category badge: {{opportunity.category}}
    - Current composite score: {{opportunity.composite_score}}/100
  H2: What Does [Project Name] Do?
    - 2-3 paragraphs from {{opportunity.description}} + AI-expanded context
  H2: The 8-Signal Score Breakdown
    H3: Market Timing ({{opportunity.scores.market_timing}}/10)
    H3: Team & Execution ({{opportunity.scores.team}}/10)
    H3: Technology Moat ({{opportunity.scores.tech_moat}}/10)
    H3: Tokenomics / Cap Structure ({{opportunity.scores.tokenomics}}/10)
    H3: Community & Network Effects ({{opportunity.scores.community}}/10)
    H3: Regulatory Positioning ({{opportunity.scores.regulatory}}/10)
    H3: Catalyst Pipeline ({{opportunity.scores.catalysts}}/10)
    H3: Asymmetric Upside ({{opportunity.scores.asymmetry}}/10)
  H2: Key Catalysts to Watch
    - Bullet list from {{opportunity.catalysts[]}}
  H2: Risk Factors
    - From {{opportunity.risks[]}}
  H2: How [Project Name] Compares
    - Table: top 5 projects in same {{opportunity.category}} ranked by composite score
    - Links to /blog/[project]-vs-[other-project] pages
  H2: Frequently Asked Questions
    H3: Is [Project Name] a good investment?
    H3: What category does [Project Name] fall into?
    H3: What is [Project Name]'s current score?
    H3: Where can I buy [Project Name]?
  H2: Related Opportunities
    - 3-5 cards linking to other /blog/what-is-[project] pages in same category
```

**Schema markup:** FAQPage + Article (see Section 2)

**Internal linking strategy:**
- Link to `/blog/[category]-opportunities-2026` from the category badge
- Link to `/blog/[project]-vs-[project]` from the comparison table
- Link to `/blog/is-[project]-a-good-investment` from the FAQ section
- Link to `/blog/how-to-buy-[project]` from the "Where can I buy" FAQ
- Link to `/opportunities/[slug]` (the main database entry) with CTA button
- Breadcrumb: Home > Research > [Category] > [Project Name]

**Data source:** Direct pull from `opportunities` table via Supabase. Each page is statically generated at build time (SSG) with ISR revalidation every 6 hours.

---

### 1.2 `/blog/[category]-opportunities-2026`

**Purpose:** Category roundup pages targeting high-volume search queries like "best AI crypto projects 2026" or "top DePIN investments 2026."

**Target keyword pattern:**
- Primary: `best [category] investments 2026`, `top [category] opportunities 2026`
- Secondary: `[category] projects to watch`, `[category] investment guide`
- Long-tail: `most promising [category] projects`, `undervalued [category] tokens`

**Categories and their URL slugs:**
| Category | Slug |
|---|---|
| AI x Crypto | `ai-crypto` |
| DePIN | `depin` |
| DeSci | `desci` |
| ZK/Privacy | `zk-privacy` |
| Restaking | `restaking` |
| RWA | `rwa-real-world-assets` |
| Nuclear/Uranium | `nuclear-uranium` |
| Fusion Energy | `fusion-energy` |
| Quantum Computing | `quantum-computing` |
| Frontier Biotech | `frontier-biotech` |

**Template structure:**

```
H1: Best [Category] Investment Opportunities in 2026
  H2: Why [Category] Matters in 2026
    - 2-3 paragraphs of editorial context (can be AI-generated per category, stored in a category_content table)
  H2: Our Scoring Methodology
    - Brief explanation of the 8-Signal Pattern Filter
    - Link to /methodology page
  H2: Top [Category] Opportunities Ranked
    - For each opportunity in category, ordered by composite_score DESC:
      H3: #[rank]. [Project Name] — Score: [composite_score]/100
        - One-liner: {{opportunity.one_liner}}
        - Key catalyst: {{opportunity.catalysts[0]}}
        - Top signal: highest scoring signal name + value
        - [Read Full Analysis →] link to /blog/what-is-[project-name]
  H2: Score Distribution in [Category]
    - Visual chart or table showing distribution of scores
  H2: How to Use This List
    - Explanation of free vs. paid tiers
    - CTA: "Unlock full scores and alerts — Start Free Trial"
  H2: Frequently Asked Questions
    H3: How often is this list updated?
    H3: What is the 8-Signal Pattern Filter?
    H3: Are these financial recommendations?
  H2: Related Categories
    - Links to other /blog/[category]-opportunities-2026 pages
```

**Schema markup:** Article + FAQPage + ItemList

**Internal linking strategy:**
- Each project name links to `/blog/what-is-[project-name]`
- "Related Categories" section links to all other category roundup pages
- Breadcrumb: Home > Research > [Category] Opportunities 2026
- Sidebar (or bottom section): "Compare any two projects" linking to comparison pages

**Data source:** Query `opportunities` table filtered by `category`, ordered by `composite_score` DESC. ISR revalidation every 6 hours.

---

### 1.3 `/blog/best-[subcategory]-investments`

**Purpose:** Target more specific niches within each category. These capture mid-funnel queries with higher purchase intent.

**Subcategory examples:**
- AI x Crypto: `ai-agent-tokens`, `decentralized-gpu`, `ai-data-marketplace`
- DePIN: `wireless-depin`, `sensor-networks`, `decentralized-storage`
- DeSci: `longevity-tokens`, `decentralized-drug-discovery`
- ZK/Privacy: `zk-rollup-tokens`, `privacy-coins-2026`
- Restaking: `liquid-restaking-tokens`, `eigenlayer-avs`
- RWA: `tokenized-real-estate`, `tokenized-treasuries`, `carbon-credit-tokens`
- Nuclear/Uranium: `uranium-mining-stocks`, `smr-companies`
- Fusion Energy: `fusion-startups`, `fusion-energy-stocks`
- Quantum Computing: `quantum-computing-stocks`, `post-quantum-crypto`
- Frontier Biotech: `crispr-investments`, `synthetic-biology-stocks`

**Target keyword pattern:**
- Primary: `best [subcategory] investments`, `top [subcategory] to buy`
- Secondary: `[subcategory] investment opportunities`, `[subcategory] guide`

**Template structure:**

```
H1: Best [Subcategory] Investments for 2026
  H2: What Are [Subcategory] Projects?
    - Definition and context
  H2: Why [Subcategory] Is a 1000x Opportunity
    - Market size / TAM data
    - Growth trajectory
    - Key thesis
  H2: Top [Subcategory] Opportunities
    - Ranked list of matching opportunities with scores
    - Each links to /blog/what-is-[project-name]
  H2: How We Score [Subcategory] Projects
    - Brief methodology note
  H2: Investment Risks in [Subcategory]
    - Category-level risks
  H2: Frequently Asked Questions
  H2: Related Research
    - Link to parent /blog/[category]-opportunities-2026
    - Links to related subcategory pages
```

**Schema markup:** Article + FAQPage + ItemList

**Internal linking strategy:**
- Each project links to its `/blog/what-is-[project-name]` page
- Parent category link to `/blog/[category]-opportunities-2026`
- Cross-links to related subcategory pages
- Breadcrumb: Home > Research > [Category] > Best [Subcategory] Investments

**Data source:** Query `opportunities` table filtered by `subcategory` or `tags` array. Requires a `subcategory` or `tags` column on the opportunities table. ISR revalidation every 12 hours.

---

### 1.4 `/blog/[project]-vs-[project]`

**Purpose:** Comparison pages capturing high-intent search queries like "Bittensor vs Render" or "Helium vs XNET." These are extremely effective for SEO because they target users actively evaluating options.

**Target keyword pattern:**
- Primary: `[project A] vs [project B]`
- Secondary: `[project A] compared to [project B]`, `[project A] or [project B]`

**Generation logic:** For each category, generate comparison pages for every pair of projects within that category. For a category with N projects, this yields N*(N-1)/2 pages. Prioritize pairs where both projects have a composite score above 60.

**Template structure:**

```
H1: [Project A] vs [Project B]: Which Is the Better 1000x Bet?
  H2: Quick Comparison
    - Side-by-side table:
      | Signal | [Project A] | [Project B] |
      | Market Timing | X/10 | Y/10 |
      | Team & Execution | X/10 | Y/10 |
      | ... (all 8 signals) | ... | ... |
      | **Composite Score** | **X/100** | **Y/100** |
  H2: [Project A] Overview
    - {{opportunity_a.one_liner}}
    - Key strengths from top 3 signals
    - Link: [Full [Project A] Analysis →]
  H2: [Project B] Overview
    - {{opportunity_b.one_liner}}
    - Key strengths from top 3 signals
    - Link: [Full [Project B] Analysis →]
  H2: Where [Project A] Wins
    - Signals where A scores higher, with explanation
  H2: Where [Project B] Wins
    - Signals where B scores higher, with explanation
  H2: Catalyst Comparison
    - Side-by-side upcoming catalysts
  H2: Risk Comparison
    - Side-by-side risks
  H2: The Verdict
    - Summary paragraph (can be AI-generated)
    - "Both projects are tracked in our database — unlock full analysis"
  H2: Frequently Asked Questions
    H3: Which has a higher score, [Project A] or [Project B]?
    H3: Are [Project A] and [Project B] competitors?
    H3: Can I invest in both [Project A] and [Project B]?
  H2: More Comparisons in [Category]
    - Links to other vs pages in same category
```

**Schema markup:** Article + FAQPage

**Internal linking strategy:**
- Link to both `/blog/what-is-[project-a]` and `/blog/what-is-[project-b]`
- Link to `/blog/[category]-opportunities-2026`
- Cross-link to other comparison pages involving either project
- Breadcrumb: Home > Research > Comparisons > [Project A] vs [Project B]

**Data source:** Join two rows from `opportunities` table. Generated for all valid pairs. ISR revalidation every 12 hours.

---

### 1.5 `/blog/is-[project]-a-good-investment`

**Purpose:** FAQ-style pages targeting decision-stage queries. These capture users who are on the verge of investing and want validation.

**Target keyword pattern:**
- Primary: `is [project] a good investment`
- Secondary: `should I invest in [project]`, `[project] investment analysis`, `[project] worth buying`
- Long-tail: `is [project] legit`, `[project] price prediction`, `[project] future`

**Template structure:**

```
H1: Is [Project Name] a Good Investment? 8-Signal Analysis
  H2: The Short Answer
    - Score-based assessment:
      - Score 80+: "[Project Name] scores exceptionally well across our 8-signal framework..."
      - Score 60-79: "[Project Name] shows strong potential with some areas to watch..."
      - Score 40-59: "[Project Name] presents a mixed picture..."
      - Score <40: "[Project Name] currently faces significant headwinds..."
  H2: Our 8-Signal Assessment
    - Full score breakdown with 1-paragraph commentary per signal
  H2: Bull Case for [Project Name]
    - Top 3 signals + catalysts supporting investment
  H2: Bear Case for [Project Name]
    - Bottom 3 signals + risks arguing against
  H2: Key Catalysts That Could Change Everything
    - {{opportunity.catalysts[]}} with dates if available
  H2: What Smart Money Is Doing
    - If available: funding rounds, notable investors from {{opportunity.investors[]}}
  H2: How [Project Name] Stacks Up in [Category]
    - Rank within category
    - Mini comparison table (top 5 in category)
  H2: Frequently Asked Questions
    H3: What is [Project Name]'s composite score?
    H3: What are the biggest risks of investing in [Project Name]?
    H3: Where can I buy [Project Name]?
    H3: Is [Project Name] undervalued?
  H2: Get Real-Time Score Updates
    - CTA: Email signup for score change alerts
```

**Schema markup:** FAQPage + Article

**Internal linking strategy:**
- Link to `/blog/what-is-[project-name]` from first mention
- Link to `/blog/how-to-buy-[project]` from the "Where can I buy" FAQ
- Link to `/blog/[category]-opportunities-2026` from the category comparison section
- Link to comparison pages involving this project
- Breadcrumb: Home > Research > Is [Project Name] a Good Investment?

**Data source:** Pull from `opportunities` table. ISR revalidation every 6 hours.

---

### 1.6 `/blog/how-to-buy-[project]`

**Purpose:** High commercial intent pages. Users searching "how to buy [token]" are at the bottom of the funnel. These pages serve as affiliate revenue opportunities and strong CTA touchpoints.

**Target keyword pattern:**
- Primary: `how to buy [project name]`, `where to buy [project name]`
- Secondary: `buy [project name]`, `[project name] exchange`, `[project name] purchase guide`

**Template structure:**

```
H1: How to Buy [Project Name]: Step-by-Step Guide
  H2: Quick Facts
    - Token/Ticker: {{opportunity.ticker}}
    - Category: {{opportunity.category}}
    - next1000x Score: {{opportunity.composite_score}}/100
    - Available on: {{opportunity.exchanges[]}}
  H2: Step 1 — Choose an Exchange
    - List of exchanges where the token is available
    - For each exchange: brief note on fees, region availability
    - Affiliate links where applicable
  H2: Step 2 — Create and Verify Your Account
    - Generic KYC guidance
  H2: Step 3 — Deposit Funds
    - Fiat on-ramp options
    - Crypto deposit options
  H2: Step 4 — Buy [Project Name]
    - Market order vs. limit order explanation
    - Slippage considerations for low-cap tokens
  H2: Step 5 — Secure Your Investment
    - Wallet recommendations (hardware vs. software)
    - Staking options if applicable from {{opportunity.staking_info}}
  H2: Should You Buy [Project Name]?
    - Brief score summary
    - Link: [Read our full investment analysis →] to /blog/is-[project]-a-good-investment
  H2: Frequently Asked Questions
    H3: What is the minimum amount to buy [Project Name]?
    H3: Is [Project Name] available on Coinbase?
    H3: Can I stake [Project Name]?
  H2: Related Opportunities in [Category]
    - 3-5 other projects in same category
```

**Schema markup:** HowTo + FAQPage + Article

**Internal linking strategy:**
- Link to `/blog/what-is-[project-name]` for full overview
- Link to `/blog/is-[project]-a-good-investment` from "Should You Buy" section
- Link to `/blog/[category]-opportunities-2026` from related opportunities
- Breadcrumb: Home > Guides > How to Buy [Project Name]

**Data source:** Pull from `opportunities` table. Requires `exchanges` and optionally `staking_info` columns. ISR revalidation every 24 hours (exchange info changes less frequently).

---

## 2. Schema Markup Strategy

### 2.1 FAQPage Schema

Used on: all programmatic blog pages (every page type has an FAQ section).

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Bittensor a good investment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bittensor currently scores 82/100 on our 8-Signal Pattern Filter, placing it in the top tier of AI x Crypto opportunities. Its strongest signals are Technology Moat (9/10) and Market Timing (8/10). However, investors should note regulatory uncertainty as a key risk factor. Read our full analysis for the complete breakdown."
      }
    },
    {
      "@type": "Question",
      "name": "What category does Bittensor fall into?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bittensor is categorized under AI x Crypto in the next1000x database. It competes with projects like Render Network and Akash Network in the decentralized AI compute space."
      }
    },
    {
      "@type": "Question",
      "name": "What is Bittensor's current next1000x score?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As of our latest update, Bittensor holds a composite score of 82/100 across our 8-signal framework. Signal scores range from 7/10 (Regulatory Positioning) to 9/10 (Technology Moat)."
      }
    }
  ]
}
```

### 2.2 Product Schema (for token/equity entries)

Used on: `/opportunities/[slug]` (the main database entry pages).

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Bittensor (TAO)",
  "description": "Decentralized AI network enabling permissionless machine learning model training and inference. next1000x composite score: 82/100.",
  "category": "AI x Crypto",
  "brand": {
    "@type": "Organization",
    "name": "Bittensor Foundation"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "82",
    "bestRating": "100",
    "worstRating": "0",
    "ratingCount": "8",
    "reviewCount": "1"
  },
  "review": {
    "@type": "Review",
    "author": {
      "@type": "Organization",
      "name": "next1000x"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "82",
      "bestRating": "100",
      "worstRating": "0"
    },
    "reviewBody": "Bittensor scores 82/100 on our 8-Signal Pattern Filter, with exceptional marks in Technology Moat and Market Timing."
  }
}
```

### 2.3 Article Schema

Used on: all `/blog/*` pages.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What is Bittensor? A Deep-Dive Research Brief",
  "description": "Comprehensive analysis of Bittensor (TAO) using our 8-Signal Pattern Filter. Current score: 82/100. Category: AI x Crypto.",
  "image": "https://next1000x.com/og/what-is-bittensor.png",
  "author": {
    "@type": "Organization",
    "name": "next1000x Research",
    "url": "https://next1000x.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "next1000x",
    "logo": {
      "@type": "ImageObject",
      "url": "https://next1000x.com/logo.png"
    }
  },
  "datePublished": "2026-04-13T00:00:00Z",
  "dateModified": "2026-04-13T12:00:00Z",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://next1000x.com/blog/what-is-bittensor"
  }
}
```

### 2.4 BreadcrumbList Schema

Used on: every page.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://next1000x.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://next1000x.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "AI x Crypto",
      "item": "https://next1000x.com/blog/ai-crypto-opportunities-2026"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "What is Bittensor?",
      "item": "https://next1000x.com/blog/what-is-bittensor"
    }
  ]
}
```

### 2.5 Organization Schema

Used on: homepage and all pages (via layout).

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "next1000x",
  "url": "https://next1000x.com",
  "logo": "https://next1000x.com/logo.png",
  "description": "Freemium database of 1000x investment opportunities scored against an 8-Signal Pattern Filter. Covering AI x Crypto, DePIN, DeSci, ZK/Privacy, Restaking, RWA, Nuclear, Fusion, Quantum Computing, and Frontier Biotech.",
  "sameAs": [
    "https://twitter.com/next1000x",
    "https://warpcast.com/next1000x"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@next1000x.com"
  }
}
```

### 2.6 HowTo Schema (for how-to-buy pages)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Buy Bittensor (TAO)",
  "description": "Step-by-step guide to purchasing Bittensor (TAO) tokens on supported exchanges.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Choose an Exchange",
      "text": "Select a cryptocurrency exchange that supports TAO trading. Popular options include Binance, KuCoin, and MEXC."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Create and Verify Your Account",
      "text": "Sign up for an account on your chosen exchange and complete the KYC verification process."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Deposit Funds",
      "text": "Deposit fiat currency or cryptocurrency into your exchange account."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Buy Bittensor",
      "text": "Navigate to the TAO trading pair and place a market or limit order."
    },
    {
      "@type": "HowToStep",
      "position": 5,
      "name": "Secure Your Investment",
      "text": "Transfer your TAO tokens to a secure wallet for long-term storage."
    }
  ]
}
```

### 2.7 ItemList Schema (for category and subcategory roundup pages)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Best AI x Crypto Investment Opportunities in 2026",
  "description": "Ranked list of AI x Crypto projects scored by the next1000x 8-Signal Pattern Filter.",
  "numberOfItems": 15,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Bittensor (TAO)",
      "url": "https://next1000x.com/blog/what-is-bittensor"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Render Network (RNDR)",
      "url": "https://next1000x.com/blog/what-is-render-network"
    }
  ]
}
```

---

## 3. Technical SEO

### 3.1 Next.js SSG/ISR Strategy

| Page Type | Rendering | Revalidation | Rationale |
|---|---|---|---|
| `/blog/what-is-[project]` | SSG + ISR | 6 hours | Scores update frequently; need fresh data |
| `/blog/[category]-opportunities-2026` | SSG + ISR | 6 hours | Rankings change with score updates |
| `/blog/best-[subcategory]-investments` | SSG + ISR | 12 hours | Less volatile than main rankings |
| `/blog/[project]-vs-[project]` | SSG + ISR | 12 hours | Comparison data changes less often |
| `/blog/is-[project]-a-good-investment` | SSG + ISR | 6 hours | Score-dependent content |
| `/blog/how-to-buy-[project]` | SSG + ISR | 24 hours | Exchange info is relatively stable |
| `/opportunities/[slug]` | SSG + ISR | 1 hour | Core product page; freshness matters most |
| Homepage | SSG + ISR | 1 hour | Featured projects and latest scores |
| `/pricing` | SSG | N/A (static) | Rarely changes |
| `/methodology` | SSG | N/A (static) | Rarely changes |

**Implementation pattern for each page (Next.js App Router):**

```typescript
// app/blog/what-is-[slug]/page.tsx

import { createClient } from '@/lib/supabase/server'

// Generate all paths at build time
export async function generateStaticParams() {
  const supabase = createClient()
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('slug')

  return opportunities?.map((opp) => ({
    slug: opp.slug,
  })) ?? []
}

// ISR: revalidate every 6 hours
export const revalidate = 21600

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', params.slug)
    .single()

  return {
    title: `What is ${opportunity.name}? | next1000x Research`,
    description: `${opportunity.one_liner} Composite score: ${opportunity.composite_score}/100. Read our 8-signal analysis.`,
    openGraph: {
      title: `What is ${opportunity.name}?`,
      description: opportunity.one_liner,
      url: `https://next1000x.com/blog/what-is-${params.slug}`,
      images: [`https://next1000x.com/og/what-is-${params.slug}.png`],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `What is ${opportunity.name}?`,
      description: opportunity.one_liner,
      images: [`https://next1000x.com/og/what-is-${params.slug}.png`],
    },
    alternates: {
      canonical: `https://next1000x.com/blog/what-is-${params.slug}`,
    },
  }
}
```

### 3.2 Dynamic Sitemap Generation

```typescript
// app/sitemap.ts

import { createClient } from '@/lib/supabase/server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  // Fetch all opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('slug, category, updated_at')

  // Fetch all categories
  const categories = [...new Set(opportunities?.map(o => o.category) ?? [])]

  const baseUrl = 'https://next1000x.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  // What-is pages
  const whatIsPages: MetadataRoute.Sitemap = (opportunities ?? []).map(opp => ({
    url: `${baseUrl}/blog/what-is-${opp.slug}`,
    lastModified: new Date(opp.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Is-good-investment pages
  const investmentPages: MetadataRoute.Sitemap = (opportunities ?? []).map(opp => ({
    url: `${baseUrl}/blog/is-${opp.slug}-a-good-investment`,
    lastModified: new Date(opp.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // How-to-buy pages
  const buyPages: MetadataRoute.Sitemap = (opportunities ?? []).map(opp => ({
    url: `${baseUrl}/blog/how-to-buy-${opp.slug}`,
    lastModified: new Date(opp.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Category roundup pages
  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${baseUrl}/blog/${slugifyCategory(cat)}-opportunities-2026`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Comparison pages (all pairs within each category)
  const comparisonPages: MetadataRoute.Sitemap = []
  for (const cat of categories) {
    const catOpps = (opportunities ?? []).filter(o => o.category === cat)
    for (let i = 0; i < catOpps.length; i++) {
      for (let j = i + 1; j < catOpps.length; j++) {
        comparisonPages.push({
          url: `${baseUrl}/blog/${catOpps[i].slug}-vs-${catOpps[j].slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        })
      }
    }
  }

  // Opportunity detail pages
  const opportunityPages: MetadataRoute.Sitemap = (opportunities ?? []).map(opp => ({
    url: `${baseUrl}/opportunities/${opp.slug}`,
    lastModified: new Date(opp.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...whatIsPages,
    ...investmentPages,
    ...buyPages,
    ...comparisonPages,
    ...opportunityPages,
  ]
}

function slugifyCategory(category: string): string {
  const map: Record<string, string> = {
    'AI x Crypto': 'ai-crypto',
    'DePIN': 'depin',
    'DeSci': 'desci',
    'ZK/Privacy': 'zk-privacy',
    'Restaking': 'restaking',
    'RWA': 'rwa-real-world-assets',
    'Nuclear/Uranium': 'nuclear-uranium',
    'Fusion Energy': 'fusion-energy',
    'Quantum Computing': 'quantum-computing',
    'Frontier Biotech': 'frontier-biotech',
  }
  return map[category] ?? category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
```

**For large sitemaps (>50,000 URLs), split into sitemap index:**

```typescript
// app/sitemap/[id]/route.ts — split by page type
// app/sitemap.xml/route.ts — sitemap index pointing to sub-sitemaps
```

### 3.3 robots.txt

```typescript
// app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard/',
          '/account/',
          '/admin/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],  // Block AI training crawlers
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],  // Block Common Crawl for AI training
      },
    ],
    sitemap: 'https://next1000x.com/sitemap.xml',
  }
}
```

### 3.4 Canonical URL Strategy

Every page must have a self-referencing canonical URL. Implementation via Next.js metadata API:

```typescript
// In every page's generateMetadata function:
alternates: {
  canonical: `https://next1000x.com/blog/what-is-${params.slug}`,
}
```

**Rules:**
- All URLs use lowercase, hyphen-separated slugs
- No trailing slashes (Next.js default)
- Always use `https://next1000x.com` as the base (no `www`)
- Comparison pages always alphabetize: `/blog/akash-vs-render` not `/blog/render-vs-akash`
  - Implement a redirect from the non-canonical order to the canonical order
- Year-specific pages (`-2026`) get updated annually; old pages redirect to new ones with 301

### 3.5 Open Graph / Twitter Card Meta Tags

Implemented via `generateMetadata` in each page (shown in Section 3.1). Additionally, generate dynamic OG images using `@vercel/og`:

```typescript
// app/og/[...slug]/route.tsx

import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'next1000x Research'
  const score = searchParams.get('score')
  const category = searchParams.get('category')

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1200px',
        height: '630px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        padding: '60px',
      }}>
        <div style={{ fontSize: '24px', color: '#888', marginBottom: '20px' }}>
          next1000x.com
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px' }}>
          {title}
        </div>
        {score && (
          <div style={{ fontSize: '72px', fontWeight: 'bold', color: '#00ff88' }}>
            {score}/100
          </div>
        )}
        {category && (
          <div style={{
            fontSize: '20px',
            color: '#aaa',
            border: '1px solid #444',
            borderRadius: '20px',
            padding: '8px 20px',
            marginTop: '20px',
          }}>
            {category}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

### 3.6 Core Web Vitals Optimization

**Largest Contentful Paint (LCP) — Target: < 2.5s:**
- Use SSG/ISR for all public pages (no server-side rendering on each request)
- Preload critical fonts with `next/font`
- Use `next/image` with `priority` attribute for above-the-fold images
- Inline critical CSS (Next.js does this automatically with CSS Modules)
- Use Vercel Edge Network for global CDN delivery

**First Input Delay (FID) / Interaction to Next Paint (INP) — Target: < 200ms:**
- Minimize client-side JavaScript; use React Server Components (RSC) for all data display
- Lazy-load interactive components (charts, modals) with `dynamic(() => import(...), { ssr: false })`
- Use `useTransition` for non-urgent state updates
- Avoid layout thrashing from dynamic content insertion

**Cumulative Layout Shift (CLS) — Target: < 0.1:**
- Set explicit `width` and `height` on all images
- Reserve space for async-loaded content (skeleton loaders with fixed dimensions)
- Avoid inserting content above existing content (email capture popups should overlay, not push)
- Use `font-display: swap` with `next/font` to prevent FOIT

**Additional optimizations:**
- Enable Vercel Speed Insights for real-user monitoring
- Use `<link rel="preconnect">` for Supabase API domain
- Implement route prefetching with `next/link` (default behavior)
- Bundle size: keep per-route JS under 100KB gzipped
- Use Vercel Image Optimization for all images

---

## 4. Content Calendar and Publication Cadence

### Phase 1: Foundation (Weeks 1-2)
- Generate all `/blog/what-is-[project]` pages for existing database entries
- Generate all `/blog/[category]-opportunities-2026` pages (10 categories)
- Set up sitemap, robots.txt, schema markup infrastructure

### Phase 2: Expansion (Weeks 3-4)
- Generate all `/blog/is-[project]-a-good-investment` pages
- Generate all `/blog/how-to-buy-[project]` pages
- Generate comparison pages for top-scored project pairs (top 3 per category)

### Phase 3: Long Tail (Weeks 5-8)
- Generate all remaining comparison pages
- Generate subcategory pages
- Build internal linking audit tool to ensure no orphan pages

### Phase 4: Ongoing
- New pages auto-generated when new opportunities are added to the database
- Annual update of year-specific URLs (2026 -> 2027) with 301 redirects
- Monthly review of Search Console data to identify new keyword opportunities
- Quarterly content refresh for top-performing pages

---

## 5. Keyword Research Framework

### Volume Estimation Tiers

| Query Pattern | Estimated Monthly Volume | Competition |
|---|---|---|
| `what is [major project]` | 10,000-100,000 | High |
| `what is [small project]` | 100-5,000 | Low |
| `best [category] investments 2026` | 5,000-50,000 | Medium |
| `[project] vs [project]` | 500-10,000 | Low-Medium |
| `is [project] a good investment` | 1,000-20,000 | Medium |
| `how to buy [project]` | 5,000-100,000 | High |
| `best [subcategory] investments` | 1,000-10,000 | Low-Medium |

### Priority Matrix

Prioritize page generation by: `(estimated_volume * inverse_competition * composite_score) / generation_effort`

High priority (generate first):
1. What-is pages for projects with composite score > 70
2. Category roundups for categories with > 5 entries
3. How-to-buy pages for projects with active token markets
4. Investment analysis pages for projects with composite score > 70

Medium priority:
5. Comparison pages for top-scored pairs
6. Subcategory pages with > 3 entries
7. Remaining what-is and investment analysis pages

Low priority (generate last):
8. Comparison pages for lower-scored pairs
9. How-to-buy pages for pre-token projects
10. Subcategory pages with < 3 entries

---

## 6. Link Building Strategy

### Internal Link Graph
- Every page must have at least 3 internal links pointing to it
- Every page must link to at least 3 other pages
- Category roundup pages serve as hub pages; every project page in that category must link to and from the hub
- Comparison pages form a mesh network within each category
- Implement a "Related Research" component that dynamically generates internal links based on category and score proximity

### External Link Acquisition
- Submit to crypto/investment research aggregators (DeFi Llama, CoinGecko Learn, Messari)
- Guest posts on crypto media (CoinDesk, The Block, Decrypt) citing next1000x data
- Data partnerships: offer embeddable score widgets that link back to next1000x
- Twitter/X threads that reference and link to specific analysis pages
- Reddit AMAs in relevant subreddits with links to methodology page
- Product Hunt launch for initial backlink burst
- HARO (Help a Reporter Out) responses for crypto/investment queries
