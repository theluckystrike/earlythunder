# next1000x.com — Social Distribution Automation Plan

All posts in this plan are designed to be fully automatable. Each section specifies the exact data inputs, post templates, API calls, and scheduling logic required for implementation.

---

## 1. Twitter/X Bot

### Account Strategy
- Handle: `@next1000x`
- Bio: "Database of 1000x opportunities. 8-Signal Pattern Filter. AI, Crypto, DePIN, DeSci, Nuclear, Quantum, Biotech. Free tier available."
- Pinned tweet: updated monthly with the current highest-scored opportunity
- Profile link: `https://next1000x.com`

### Post Types and Templates

#### Type 1: New Opportunity Added
**Trigger:** New row inserted into `opportunities` table.
**Frequency:** As they occur (estimated 2-5 per week).
**Template:**

```
NEW: {{opportunity.name}} just entered the next1000x database.

Category: {{opportunity.category}}
Score: {{opportunity.composite_score}}/100
Top signal: {{opportunity.top_signal_name}} ({{opportunity.top_signal_score}}/10)

"{{opportunity.one_liner}}"

Full analysis: https://next1000x.com/blog/what-is-{{opportunity.slug}}

#{{categoryHashtag}} #1000x #investment
```

Character count: ~250 (within 280 limit).

#### Type 2: Score Change Alert
**Trigger:** Score change of 5+ points on any opportunity.
**Frequency:** As they occur.
**Template:**

```
SCORE CHANGE: {{opportunity.name}} {{delta > 0 ? '⬆' : '⬇'}} {{previousScore}} → {{newScore}}/100

{{#if delta > 0}}
Biggest improvement: {{topImprovedSignal.name}} ({{topImprovedSignal.old}} → {{topImprovedSignal.new}})
{{else}}
Biggest drop: {{topDroppedSignal.name}} ({{topDroppedSignal.old}} → {{topDroppedSignal.new}})
{{/if}}

Why: {{changeReason}}

https://next1000x.com/blog/what-is-{{opportunity.slug}}

#{{categoryHashtag}}
```

#### Type 3: Daily Top 3
**Trigger:** Daily cron job at 9:00 AM ET.
**Frequency:** Once per day.
**Template:**

```
Today's top-scored opportunities on next1000x:

1. {{top3[0].name}} — {{top3[0].composite_score}}/100 ({{top3[0].category}})
2. {{top3[1].name}} — {{top3[1].composite_score}}/100 ({{top3[1].category}})
3. {{top3[2].name}} — {{top3[2].composite_score}}/100 ({{top3[2].category}})

Scored across 8 signals: market timing, team, tech moat, tokenomics, community, regulatory, catalysts, asymmetric upside.

Browse all: https://next1000x.com

#crypto #investing #research
```

#### Type 4: Category Spotlight (Thread)
**Trigger:** Weekly cron job, rotating through categories.
**Frequency:** Once per week (Tuesday 10:00 AM ET).
**Template (thread of 4-6 tweets):**

**Tweet 1 (hook):**
```
THREAD: The top {{category.name}} opportunities right now, ranked by our 8-Signal Pattern Filter.

{{categoryCount}} projects tracked. Here are the top 5.

{{categoryHashtag}} #1000x
```

**Tweets 2-6 (one per project):**
```
{{rank}}/ {{opportunity.name}} {{opportunity.ticker ? `($${opportunity.ticker})` : ''}} — {{opportunity.composite_score}}/100

{{opportunity.one_liner}}

Strongest signal: {{opportunity.top_signal_name}} ({{opportunity.top_signal_score}}/10)
Key catalyst: {{opportunity.catalysts[0].description}}

https://next1000x.com/blog/what-is-{{opportunity.slug}}
```

**Final tweet:**
```
Full {{category.name}} rankings with all scores:
https://next1000x.com/blog/{{category.slug}}-opportunities-2026

We track {{totalOpportunities}} opportunities across 10 categories. Free to browse.
```

#### Type 5: Comparison Post
**Trigger:** Weekly cron job (Thursday 10:00 AM ET).
**Frequency:** Once per week.
**Template:**

```
{{opportunityA.name}} vs {{opportunityB.name}} — who wins?

{{opportunityA.name}}: {{opportunityA.composite_score}}/100
{{opportunityB.name}}: {{opportunityB.composite_score}}/100

{{opportunityA.name}} leads in: {{signalsWhereAWins.map(s => s.name).join(', ')}}
{{opportunityB.name}} leads in: {{signalsWhereBWins.map(s => s.name).join(', ')}}

Full comparison: https://next1000x.com/blog/{{comparisonSlug}}

#{{categoryHashtag}}
```

#### Type 6: Catalyst Countdown
**Trigger:** 7 days before any catalyst date.
**Frequency:** As they occur.
**Template:**

```
CATALYST WATCH: {{opportunity.name}}

{{catalyst.description}} — {{formatDate(catalyst.date)}} ({{daysUntil}} days)

Current score: {{opportunity.composite_score}}/100
Catalyst signal: {{opportunity.scores.catalysts}}/10

Track it: https://next1000x.com/blog/what-is-{{opportunity.slug}}

#{{categoryHashtag}} #catalyst
```

### Hashtag Strategy

| Category | Primary Hashtags | Secondary Hashtags |
|---|---|---|
| AI x Crypto | #AIcrypto #AI #DeAI | #Bittensor #Render #AkashNetwork |
| DePIN | #DePIN #IoT #decentralized | #Helium #XNET #Hivemapper |
| DeSci | #DeSci #science #biotech | #VitaDAO #LabDAO |
| ZK/Privacy | #ZK #ZeroKnowledge #privacy | #zkRollup #ZKsync |
| Restaking | #Restaking #LRT #ETH | #EigenLayer #Lido |
| RWA | #RWA #tokenization #RealWorldAssets | #Ondo #Centrifuge |
| Nuclear/Uranium | #nuclear #uranium #energy | #SMR #NuclearEnergy |
| Fusion Energy | #fusion #FusionEnergy #cleanenergy | #TAE #Helion |
| Quantum Computing | #quantum #QuantumComputing #QC | #IBM #IonQ |
| Frontier Biotech | #biotech #CRISPR #synbio | #longevity #genomics |

**General hashtags (use sparingly):** #1000x #investing #research #alpha #asymmetric

### Twitter/X API Implementation

```typescript
// lib/social/twitter.ts

import { TwitterApi } from 'twitter-api-v2'

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
})

const rwClient = client.readWrite

// Single tweet
export async function postTweet(text: string): Promise<string> {
  const { data } = await rwClient.v2.tweet(text)
  return data.id
}

// Thread
export async function postThread(tweets: string[]): Promise<string[]> {
  const ids: string[] = []
  let replyToId: string | undefined

  for (const text of tweets) {
    const { data } = await rwClient.v2.tweet(text, {
      reply: replyToId ? { in_reply_to_tweet_id: replyToId } : undefined,
    })
    ids.push(data.id)
    replyToId = data.id
  }

  return ids
}

// Tweet with image (for OG card or chart)
export async function postTweetWithImage(text: string, imageBuffer: Buffer): Promise<string> {
  const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/png' })
  const { data } = await rwClient.v2.tweet(text, {
    media: { media_ids: [mediaId] },
  })
  return data.id
}
```

### Scheduling

```typescript
// api/cron/twitter-daily.ts — runs daily at 9:00 AM ET (14:00 UTC)
// api/cron/twitter-weekly-thread.ts — runs Tuesday at 10:00 AM ET (15:00 UTC)
// api/cron/twitter-weekly-comparison.ts — runs Thursday at 10:00 AM ET (15:00 UTC)

// Event-triggered posts (new opportunity, score change, catalyst countdown):
// Triggered via Supabase webhooks → Vercel serverless function → Twitter API
```

### Rate Limits and Safety

- Twitter Free tier: 1,500 tweets/month (50/day)
- Budget: maximum 5 tweets/day to stay well under limits
- Implement a `social_post_log` table to prevent duplicate posts
- All posts go through a content filter to ensure no broken links or missing data
- If any data placeholder resolves to null/undefined, skip that post and log an error

---

## 2. Reddit Strategy

### Target Subreddits

| Subreddit | Subscribers | Rules Compliance | Post Format | Frequency |
|---|---|---|---|---|
| r/CryptoCurrency | 7.5M+ | No direct shilling; must be educational; self-posts only for analysis | Long-form educational analysis with data tables | 1x/week max |
| r/CryptoMoonShots | 2M+ | Allows project spotlights; requires specific format | Structured pitch with tokenomics and links | 1x/week max |
| r/defi | 400K+ | Technical focus; no low-effort posts | DeFi-specific analysis with protocol comparisons | 2x/month |
| r/ethfinance | 200K+ | ETH-focused; high-quality discussion encouraged | ETH ecosystem opportunities (Restaking, ZK) | 2x/month |
| r/Futurology | 20M+ | No spam; must be about future technology | Fusion, quantum, biotech opportunity landscape posts | 1x/month |
| r/UraniumSqueeze | 30K+ | Uranium-focused community; DD-style posts welcome | Nuclear/uranium opportunity analysis | 2x/month |
| r/QuantumComputing | 100K+ | Technical; no spam | Quantum computing investment landscape | 1x/month |
| r/Biotechnology | 80K+ | Science-focused; no pump content | Biotech opportunity analysis with scientific context | 1x/month |
| r/DePIN | 15K+ | DePIN-focused; new and growing | DePIN category roundups | 2x/month |

### Post Templates Per Subreddit

#### r/CryptoCurrency — Educational Analysis Post

**Title template:** `[Research] {{category.name}} Opportunities Ranked by 8-Signal Framework — {{month}} {{year}} Update`

**Body:**
```markdown
**TL;DR:** I built a scoring framework for evaluating asymmetric investment opportunities. Here's how {{categoryCount}} {{category.name}} projects stack up.

---

## Methodology

Each project is scored across 8 signals (1-10 each, 100 max composite):

| Signal | What it measures |
|---|---|
| Market Timing | Sector growth cycle position |
| Team & Execution | Track record, shipping speed |
| Technology Moat | Defensibility against competitors/forks |
| Tokenomics / Cap | Supply dynamics, dilution risk |
| Community | Organic growth, dev activity |
| Regulatory | Exposure to regulatory risk |
| Catalysts | Concrete near-term events |
| Asymmetric Upside | Risk/reward ratio |

## Top {{category.name}} Opportunities ({{month}} {{year}})

| Rank | Project | Score | Top Signal | Key Catalyst |
|---|---|---|---|---|
{{#each top5 as opp, index}}
| {{index + 1}} | {{opp.name}} | {{opp.composite_score}}/100 | {{opp.top_signal_name}} ({{opp.top_signal_score}}/10) | {{opp.catalysts[0].description}} |
{{/each}}

## Key Takeaways

1. {{takeaway1}}
2. {{takeaway2}}
3. {{takeaway3}}

## Disclaimer

This is research, not financial advice. I built [next1000x.com](https://next1000x.com) to track these opportunities systematically. The methodology page explains scoring in detail.

Full rankings and analysis are free to browse at next1000x.com.

---

*Happy to answer questions about the methodology or any specific project in the comments.*
```

**Compliance notes for r/CryptoCurrency:**
- Self-post only (no link posts)
- Must include disclaimer
- Frame as educational/research, not promotional
- Respond to comments genuinely (manual or AI-assisted)
- Do not include referral links
- Mention the website once, naturally, not as a CTA

#### r/CryptoMoonShots — Project Spotlight

**Title template:** `{{opportunity.name}} — {{opportunity.composite_score}}/100 on 8-Signal Framework | {{opportunity.category}}`

**Body:**
```markdown
**Project:** {{opportunity.name}} {{opportunity.ticker ? `(${opportunity.ticker})` : ''}}
**Category:** {{opportunity.category}}
**One-liner:** {{opportunity.one_liner}}

---

**8-Signal Score Breakdown:**

| Signal | Score |
|---|---|
| Market Timing | {{opportunity.scores.market_timing}}/10 |
| Team & Execution | {{opportunity.scores.team}}/10 |
| Technology Moat | {{opportunity.scores.tech_moat}}/10 |
| Tokenomics | {{opportunity.scores.tokenomics}}/10 |
| Community | {{opportunity.scores.community}}/10 |
| Regulatory | {{opportunity.scores.regulatory}}/10 |
| Catalysts | {{opportunity.scores.catalysts}}/10 |
| Asymmetric Upside | {{opportunity.scores.asymmetry}}/10 |
| **Composite** | **{{opportunity.composite_score}}/100** |

**Key Catalysts:**
{{#each opportunity.catalysts as cat}}
- {{cat.description}}{{#if cat.date}} ({{formatDate(cat.date)}}){{/if}}
{{/each}}

**Risks:**
{{#each opportunity.risks as risk}}
- {{risk.description}}
{{/each}}

**Full analysis:** https://next1000x.com/blog/what-is-{{opportunity.slug}}

DYOR. Not financial advice.
```

#### r/Futurology — Landscape Post

**Title template:** `The {{category.name}} Investment Landscape: What's Scored Highest in Our 8-Signal Framework`

**Body:**
```markdown
I've been building a systematic framework for evaluating frontier technology investments — from fusion energy to quantum computing to decentralized science.

The framework scores opportunities across 8 dimensions. Here's a snapshot of the {{category.name}} landscape:

[Insert data table with top projects, scores, and one-line descriptions]

What's interesting is [insight about the category — e.g., "fusion companies score highest on Technology Moat but lowest on Market Timing, reflecting the long development timelines involved"].

The full database is at next1000x.com if anyone wants to dig in. Curious what this community thinks about the scoring approach.
```

**Compliance notes for r/Futurology:**
- Frame as technology discussion, not investment advice
- Lead with insight, not promotion
- Ask for community input
- Do not mention specific tickers or prices

### Reddit API Implementation

```typescript
// lib/social/reddit.ts

import snoowrap from 'snoowrap'

const reddit = new snoowrap({
  userAgent: 'next1000x-bot/1.0.0',
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
})

export async function postToSubreddit(
  subreddit: string,
  title: string,
  body: string,
  flair?: string
): Promise<string> {
  const submission = await reddit
    .getSubreddit(subreddit)
    .submitSelfpost({
      title,
      text: body,
      ...(flair ? { flairId: flair } : {}),
    })
  return submission.id
}

export async function replyToComment(commentId: string, body: string): Promise<void> {
  const comment = reddit.getComment(commentId)
  await comment.reply(body)
}
```

### Reddit Posting Schedule

| Day | Subreddit | Post Type |
|---|---|---|
| Monday | r/CryptoCurrency | Category roundup (rotate categories) |
| Wednesday | r/CryptoMoonShots | Project spotlight (highest new score) |
| Wednesday | r/defi (bi-weekly) | DeFi-specific analysis |
| Friday | Category-specific sub | Tailored category post |

### Reddit Safety Rules
- Maximum 1 post per subreddit per week
- Wait 10 minutes between posts to different subreddits
- Monitor for removal/ban and halt posting to affected sub
- Never use vote manipulation or sockpuppets
- Always respond to top-level comments within 24 hours (manual review queue)
- Maintain >10:1 comment-to-post ratio on the posting account
- Follow each subreddit's specific self-promotion rules

---

## 3. Farcaster Strategy

### Account Setup
- Handle: `@next1000x` on Warpcast
- Bio: "1000x opportunity database. 8-Signal Pattern Filter. Free to browse."
- Channels to post in: `/investing`, `/crypto`, `/defi`, `/depin`, `/desci`, `/technology`

### Post Templates

#### Cast 1: Score Card
```
{{opportunity.name}} just scored {{opportunity.composite_score}}/100 on our 8-signal framework.

Top signal: {{opportunity.top_signal_name}} ({{opportunity.top_signal_score}}/10)
Key catalyst: {{opportunity.catalysts[0].description}}

https://next1000x.com/blog/what-is-{{opportunity.slug}}
```

#### Cast 2: Comparison Frame
```
{{opportunityA.name}} vs {{opportunityB.name}}

{{opportunityA.name}}: {{opportunityA.composite_score}}/100
{{opportunityB.name}}: {{opportunityB.composite_score}}/100

The key difference: {{largestGapSignal.name}} — {{largestGapSignal.gap}} point gap.

Full breakdown: https://next1000x.com/blog/{{comparisonSlug}}
```

#### Cast 3: Category Leaderboard
```
{{category.name}} leaderboard this week:

1. {{top5[0].name}} — {{top5[0].composite_score}}
2. {{top5[1].name}} — {{top5[1].composite_score}}
3. {{top5[2].name}} — {{top5[2].composite_score}}
4. {{top5[3].name}} — {{top5[3].composite_score}}
5. {{top5[4].name}} — {{top5[4].composite_score}}

All 8-signal scores: https://next1000x.com/blog/{{category.slug}}-opportunities-2026
```

### Farcaster API Implementation

```typescript
// lib/social/farcaster.ts

// Using Neynar API for Farcaster posting
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!
const SIGNER_UUID = process.env.FARCASTER_SIGNER_UUID!

export async function postCast(text: string, channelId?: string): Promise<string> {
  const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': NEYNAR_API_KEY,
    },
    body: JSON.stringify({
      signer_uuid: SIGNER_UUID,
      text,
      ...(channelId ? { channel_id: channelId } : {}),
    }),
  })

  const data = await response.json()
  return data.cast.hash
}

export async function postCastWithEmbed(text: string, url: string, channelId?: string): Promise<string> {
  const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': NEYNAR_API_KEY,
    },
    body: JSON.stringify({
      signer_uuid: SIGNER_UUID,
      text,
      embeds: [{ url }],
      ...(channelId ? { channel_id: channelId } : {}),
    }),
  })

  const data = await response.json()
  return data.cast.hash
}
```

### Farcaster Posting Schedule
- 3-4 casts per week
- Monday: Category leaderboard (rotate)
- Wednesday: Score card for a notable project
- Friday: Comparison cast
- Ad hoc: Score change alerts for projects scoring 80+

### Farcaster Frames (Advanced)

Build a Farcaster Frame that lets users interact with the database directly in their feed:

```typescript
// app/api/frames/score/route.ts

import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { untrustedData } = body

  // Frame: "Check any project's score"
  // User types a project name, frame returns the score card

  const projectName = untrustedData.inputText
  const opportunity = await findOpportunityByName(projectName)

  if (!opportunity) {
    return new Response(
      frameResponse({
        image: `https://next1000x.com/api/og?title=Project+not+found`,
        input: { placeholder: 'Try another project name' },
        buttons: [{ label: 'Search', action: 'post' }],
      }),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new Response(
    frameResponse({
      image: `https://next1000x.com/api/og?title=${encodeURIComponent(opportunity.name)}&score=${opportunity.composite_score}&category=${encodeURIComponent(opportunity.category)}`,
      buttons: [
        { label: 'Full Analysis', action: 'link', target: `https://next1000x.com/blog/what-is-${opportunity.slug}` },
        { label: 'Search Another', action: 'post' },
      ],
      input: { placeholder: 'Enter project name' },
    }),
    { headers: { 'Content-Type': 'text/html' } }
  )
}
```

---

## 4. Dev.to Article Syndication

### Strategy
Republish programmatic blog content to Dev.to with canonical URLs pointing back to next1000x.com. This captures developer audience and builds backlinks.

### Article Types to Syndicate

| Source Page | Dev.to Article Title | Tags |
|---|---|---|
| `/blog/[category]-opportunities-2026` | "The Top [Category] Projects Ranked by an 8-Signal Framework" | #crypto, #investing, #webdev, #data |
| `/blog/what-is-[high-score-project]` | "Deep Dive: [Project Name] — An 8-Signal Analysis" | #crypto, #blockchain, #analysis |
| Methodology page | "Building an 8-Signal Scoring Framework for Asymmetric Investments" | #webdev, #nextjs, #database, #startup |
| Technical posts | "How I Built a Programmatic SEO Engine with Next.js and Supabase" | #nextjs, #supabase, #seo, #webdev |

### Dev.to API Implementation

```typescript
// lib/social/devto.ts

const DEVTO_API_KEY = process.env.DEVTO_API_KEY!

interface DevToArticle {
  title: string
  body_markdown: string
  published: boolean
  tags: string[]
  canonical_url: string
  series?: string
}

export async function publishToDevTo(article: DevToArticle): Promise<number> {
  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': DEVTO_API_KEY,
    },
    body: JSON.stringify({ article }),
  })

  const data = await response.json()
  return data.id
}

export async function updateDevToArticle(articleId: number, updates: Partial<DevToArticle>): Promise<void> {
  await fetch(`https://dev.to/api/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'api-key': DEVTO_API_KEY,
    },
    body: JSON.stringify({ article: updates }),
  })
}
```

### Dev.to Posting Schedule
- 2 articles per week maximum (Dev.to community guidelines)
- Monday: Category roundup (rotate categories)
- Thursday: Project deep-dive or technical post
- Always set `canonical_url` to the original next1000x.com URL
- Include a subtle CTA at the bottom: "Browse all opportunities at next1000x.com"

### Dev.to Article Template

```markdown
---
title: "The Top {{category.name}} Projects Ranked by an 8-Signal Framework"
published: true
tags: crypto, investing, data, research
canonical_url: https://next1000x.com/blog/{{category.slug}}-opportunities-2026
---

I built an 8-signal scoring framework to systematically evaluate asymmetric investment opportunities. Here's how {{categoryCount}} {{category.name}} projects score.

## The Framework

[Brief methodology explanation — same as Reddit but shorter]

## Rankings

| Rank | Project | Score | Strongest Signal |
|---|---|---|---|
{{#each top10 as opp, index}}
| {{index + 1}} | {{opp.name}} | {{opp.composite_score}}/100 | {{opp.top_signal_name}} |
{{/each}}

## What Stands Out

[2-3 paragraphs of analysis specific to this category]

## Full Data

The complete database with all scores, catalysts, and risk factors is free to browse at [next1000x.com](https://next1000x.com/blog/{{category.slug}}-opportunities-2026).

---

*I'm building this in public with Next.js, Supabase, and Vercel. Happy to discuss the tech stack or methodology in the comments.*
```

---

## 5. Cross-Platform Posting Infrastructure

### Central Post Queue

```sql
-- Social post queue table
CREATE TABLE social_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'reddit', 'farcaster', 'devto')),
  post_type TEXT NOT NULL, -- 'new_opportunity', 'score_change', 'daily_top3', 'category_thread', etc.
  content JSONB NOT NULL, -- platform-specific content (title, body, hashtags, etc.)
  opportunity_id UUID REFERENCES opportunities(id),
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  post_id TEXT, -- platform-specific post ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queue processing
CREATE INDEX idx_social_queue_scheduled ON social_post_queue (scheduled_for, status)
  WHERE status = 'pending';

-- Prevent duplicate posts
CREATE UNIQUE INDEX idx_social_queue_dedup ON social_post_queue (platform, post_type, opportunity_id, DATE(scheduled_for));
```

### Queue Processor

```typescript
// api/cron/process-social-queue.ts
// Runs every 15 minutes

import { createClient } from '@/lib/supabase/server'
import { postTweet, postThread } from '@/lib/social/twitter'
import { postToSubreddit } from '@/lib/social/reddit'
import { postCast } from '@/lib/social/farcaster'
import { publishToDevTo } from '@/lib/social/devto'

export async function GET() {
  const supabase = createClient()
  const now = new Date().toISOString()

  // Fetch pending posts that are due
  const { data: pendingPosts } = await supabase
    .from('social_post_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(10) // Process max 10 per run

  for (const post of pendingPosts ?? []) {
    try {
      let postId: string | number

      switch (post.platform) {
        case 'twitter':
          if (post.content.thread) {
            const ids = await postThread(post.content.thread)
            postId = ids[0]
          } else {
            postId = await postTweet(post.content.text)
          }
          break
        case 'reddit':
          postId = await postToSubreddit(
            post.content.subreddit,
            post.content.title,
            post.content.body,
            post.content.flair
          )
          break
        case 'farcaster':
          postId = await postCast(post.content.text, post.content.channel)
          break
        case 'devto':
          postId = await publishToDevTo(post.content)
          break
        default:
          throw new Error(`Unknown platform: ${post.platform}`)
      }

      await supabase
        .from('social_post_queue')
        .update({ status: 'posted', posted_at: now, post_id: String(postId) })
        .eq('id', post.id)

    } catch (error) {
      await supabase
        .from('social_post_queue')
        .update({ status: 'failed', error: String(error) })
        .eq('id', post.id)
    }

    // Rate limiting: wait 2 seconds between posts
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return Response.json({ processed: pendingPosts?.length ?? 0 })
}
```

### Event-Triggered Post Generation

```typescript
// api/webhooks/opportunity-created.ts
// Called by Supabase webhook when a new opportunity is inserted

export async function POST(req: Request) {
  const { record: opportunity } = await req.json()
  const supabase = createClient()

  // Generate and queue posts for all platforms
  const posts = [
    {
      platform: 'twitter',
      post_type: 'new_opportunity',
      content: {
        text: generateNewOppTweet(opportunity),
      },
      opportunity_id: opportunity.id,
      scheduled_for: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min delay
    },
    {
      platform: 'farcaster',
      post_type: 'new_opportunity',
      content: {
        text: generateNewOppCast(opportunity),
        channel: categoryToFarcasterChannel(opportunity.category),
      },
      opportunity_id: opportunity.id,
      scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hr delay
    },
  ]

  await supabase.from('social_post_queue').insert(posts)

  return Response.json({ queued: posts.length })
}
```

### Content Calendar Summary

| Time | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday |
|---|---|---|---|---|---|---|---|
| 9 AM ET | Twitter: Daily Top 3 | Twitter: Daily Top 3 + Category Thread | Twitter: Daily Top 3 | Twitter: Daily Top 3 + Comparison | Twitter: Daily Top 3 | — | — |
| 10 AM ET | Reddit: r/CryptoCurrency | — | Reddit: r/CryptoMoonShots | — | Reddit: Category sub | — | — |
| 11 AM ET | Farcaster: Leaderboard | — | Farcaster: Score card | — | Farcaster: Comparison | — | — |
| 12 PM ET | Dev.to: Category roundup | — | — | Dev.to: Deep dive | — | — | — |
| Ad hoc | Score alerts, catalyst countdowns, new opportunity announcements across all platforms |

### Environment Variables Required

```env
# Twitter/X
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Reddit
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USERNAME=
REDDIT_PASSWORD=

# Farcaster (via Neynar)
NEYNAR_API_KEY=
FARCASTER_SIGNER_UUID=

# Dev.to
DEVTO_API_KEY=

# Supabase (for webhook verification)
SUPABASE_WEBHOOK_SECRET=
```

### Monitoring and Metrics

Track in `social_post_log` and surface via admin dashboard:

| Metric | Where | Target |
|---|---|---|
| Posts published / week | All platforms | 15-20 |
| Twitter impressions / week | Twitter Analytics API | Growing 10%+ week-over-week |
| Twitter engagement rate | Twitter Analytics API | > 2% |
| Reddit upvotes / post | Reddit API | > 20 average |
| Reddit comments / post | Reddit API | > 5 average |
| Farcaster reactions / cast | Neynar API | > 10 average |
| Dev.to views / article | Dev.to API | > 500 |
| Click-through to next1000x.com | UTM tracking in analytics | > 100 visits/week from social |
| Social-referred signups | Subscriber table + UTM | > 10/week |
