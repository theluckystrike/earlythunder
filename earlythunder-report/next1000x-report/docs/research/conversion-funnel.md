# next1000x.com — Conversion Funnel Map

## Funnel Overview

```
Discovery → Landing → Browse (free) → Paywall Hit → Email Capture → Nurture → Convert → Retain
```

---

## Stage 1: Discovery

### User Action
User encounters next1000x through organic search, social media, email forward, or referral.

### Touchpoints

| Channel | Entry Page | Volume Estimate | Quality |
|---|---|---|---|
| Google (SEO) | `/blog/what-is-[project]` | High | High — intent-driven |
| Google (SEO) | `/blog/[category]-opportunities-2026` | Medium | High |
| Google (SEO) | `/blog/how-to-buy-[project]` | Medium | Very High (commercial intent) |
| Google (SEO) | `/blog/is-[project]-a-good-investment` | Medium | Very High |
| Google (SEO) | `/blog/[project]-vs-[project]` | Low-Medium | High |
| Twitter/X | Homepage or linked blog post | Medium | Medium |
| Reddit | Homepage or linked blog post | Medium | Medium-High |
| Farcaster | Homepage or linked blog post | Low | High (crypto-native) |
| Dev.to | Blog post (canonical redirect) | Low | Medium |
| Email forward | Any page (shared by existing user) | Low | Very High (trusted referral) |
| Product Hunt | Homepage | Burst (launch day) | Medium |
| Direct/Bookmarks | Homepage | Growing | Very High (return visitors) |

### Conversion Metric
**Visit initiated:** unique session started on any next1000x page.

### Optimization Levers
- SEO: increase keyword coverage by generating more programmatic pages
- Social: increase posting frequency and engagement
- Backlinks: pursue guest posts, data partnerships, aggregator listings
- Paid (future): Google Ads on high-commercial-intent keywords like "how to buy [token]"

### A/B Test Ideas
1. **OG image variants:** Test score-focused OG images vs. category-focused OG images for social click-through rate
2. **Title tag formulas:** Test "What is X?" vs. "X Explained:" vs. "X: Complete Analysis" for search CTR
3. **Meta description variants:** Test score-leading descriptions ("Scored 82/100...") vs. one-liner-leading descriptions ("Decentralized AI network...")

---

## Stage 2: Landing

### User Action
User arrives on the page and makes a split-second decision to stay or bounce.

### Touchpoints

| Landing Page Type | Key Elements Above Fold | Bounce Rate Target |
|---|---|---|
| Homepage | Value proposition headline, search/browse CTA, featured opportunities | < 40% |
| Blog: what-is | H1 with project name, composite score badge, TL;DR box | < 50% |
| Blog: category roundup | H1 with category name, count of opportunities, ranked list start | < 45% |
| Blog: is-good-investment | H1, verdict box with score and assessment, visual score indicator | < 45% |
| Blog: how-to-buy | H1, quick facts table (ticker, exchanges, score), Step 1 visible | < 50% |
| Blog: comparison | H1, side-by-side score table, radar chart | < 50% |

### Conversion Metric
**Engaged visit:** user scrolls past 25% of the page OR stays more than 15 seconds.

### Optimization Levers
- Load speed: target LCP < 2.0 seconds on all landing pages
- Above-fold content: ensure the most valuable data (score, one-liner, category) is visible immediately without scrolling
- Visual hierarchy: score badge should be the most prominent element on project pages
- Mobile optimization: ensure tables and charts render properly on mobile
- No interstitials: do not block content with popups on first visit

### A/B Test Ideas
1. **Score badge position:** Test score badge left-aligned vs. right-aligned vs. centered above H1
2. **TL;DR box styling:** Test card with background vs. inline text vs. collapsed accordion
3. **Above-fold CTA:** Test no CTA above fold vs. subtle "Browse all" link vs. prominent "Start Free" button
4. **Hero layout (homepage):** Test search-first layout vs. featured-opportunities-first layout

---

## Stage 3: Browse (Free Tier)

### User Action
User explores the database, reads analyses, compares projects, and forms an impression of the product's value.

### Touchpoints

| Action | Page | Data Shown (Free) | Data Hidden (Paywalled) |
|---|---|---|---|
| Browse all opportunities | `/` (homepage/database) | Name, one-liner, category, composite score | Individual signal scores, detailed commentary |
| Read project analysis | `/blog/what-is-[project]` | Full content (free) | N/A — these are fully free for SEO |
| Read investment analysis | `/blog/is-[project]-a-good-investment` | Verdict + summary | Full signal commentary (after first 3 views/month) |
| Compare projects | `/blog/[project]-vs-[project]` | Composite scores, overview | Signal-by-signal comparison table (after first 3/month) |
| View opportunity detail | `/opportunities/[slug]` | Name, one-liner, composite score, category | Full 8-signal breakdown, catalysts, risks, investors |
| Filter by category | `/` with filters | Category filter, sort by score | Advanced filters (score range, signal-specific) |

### Free Tier Limits (Soft Paywall)
- **Blog pages (what-is, category roundups):** Fully free, no limits. These are SEO pages and must remain indexable.
- **Investment analysis pages:** First 3 per month free, then gated.
- **Comparison pages:** First 3 per month free, then gated.
- **Opportunity detail pages:** Composite score always visible. Full signal breakdown requires Pro.
- **Data export:** Pro only.
- **Score alerts:** Pro only.
- **Catalyst reminders:** Pro only.

### Conversion Metric
**Depth of engagement:** number of unique pages viewed per session, number of return sessions within 7 days.

### Optimization Levers
- Internal linking: ensure every page links to 3+ other relevant pages to encourage deeper browsing
- "Related Opportunities" sections at the bottom of every page
- Comparison CTAs: "Compare with [similar project]" buttons on every project page
- Progressive disclosure: show enough data to demonstrate value, gate enough to create desire
- Reading progress indicator on long-form pages

### A/B Test Ideas
1. **Paywall threshold:** Test 3 gated pages/month vs. 5 vs. 10 vs. unlimited-with-signup
2. **Score visibility:** Test showing only composite score (free) vs. showing composite + top 2 signals (free)
3. **Internal link placement:** Test sidebar links vs. inline links vs. bottom-of-section links
4. **Comparison prompt:** Test "Compare" button on project cards vs. no comparison prompt on browse page

---

## Stage 4: Paywall Hit

### User Action
User attempts to access gated content (full signal breakdowns, 4th+ investment analysis, data export, etc.) and sees a paywall.

### Touchpoints

#### Paywall Modal (triggered on gated content)
```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Unlock Full 8-Signal Analysis                    │
│                                                   │
│  You've used 3 of 3 free deep-dives this month.  │
│                                                   │
│  Pro members get:                                 │
│  ✓ Full signal breakdowns for all projects        │
│  ✓ Score change alerts                            │
│  ✓ Catalyst reminders                             │
│  ✓ Data export (CSV)                              │
│  ✓ Unlimited comparisons                          │
│                                                   │
│  [Start Free Trial — $0 for 7 Days]               │
│                                                   │
│  or                                               │
│                                                   │
│  [Enter email for 3 more free views]              │
│                                                   │
│  Already a member? [Log in]                       │
│                                                   │
└─────────────────────────────────────────────────┘
```

#### Blurred Content Teaser
For gated signal breakdowns, show the section headers and first few words of each signal commentary, then blur the rest. This shows the user exactly what they are missing.

```html
<div class="gated-content">
  <h3>Market Timing — 8/10</h3>
  <p class="blurred">The market timing for this project is exceptionally favorable given the current...</p>
  <h3>Team & Execution — 7/10</h3>
  <p class="blurred">The founding team brings a strong track record from their previous ventures at...</p>
  <!-- ... -->
  <div class="paywall-overlay">
    <p>Unlock full analysis</p>
    <a href="/pricing">Start Free Trial</a>
  </div>
</div>
```

### Conversion Metric
**Paywall encounter rate:** percentage of free users who hit the paywall in a given week. Target: 30-50% of active free users should hit the paywall (if it is too low, the free tier is too generous; if too high, SEO content is being gated).

**Paywall click-through rate:** percentage of users who encounter the paywall and click either "Start Free Trial" or "Enter email." Target: > 15%.

### Optimization Levers
- Paywall copy: emphasize what they are missing, not what they cannot do
- Blurred content: showing structure but blurred text creates stronger desire than a hard wall
- Dual CTA: always offer both "pay" and "email for free views" options
- Timing: show the paywall only after the user has received genuine value (at least 1-2 full free pages)
- Reduce friction: "Start Free Trial" should pre-fill email if already captured

### A/B Test Ideas
1. **Hard wall vs. blurred teaser:** Test completely hidden content vs. blurred-but-visible content
2. **Paywall copy:** Test feature-list approach vs. "You are missing X score changes this week" social proof approach
3. **CTA button text:** Test "Start Free Trial" vs. "Unlock Now" vs. "See Full Analysis" vs. "Get 7 Days Free"
4. **Email gate option:** Test offering email-for-free-views vs. no email option (force pricing page)
5. **Paywall trigger point:** Test after 3 gated views vs. 5 vs. scroll-depth on the first gated page

---

## Stage 5: Email Capture

### User Action
User provides their email address, either through the paywall email gate, scroll popup, exit-intent popup, or inline form.

### Touchpoints

| Capture Point | CTA Copy | What User Gets | Conversion Rate Target |
|---|---|---|---|
| Paywall email gate | "Enter email for 3 more free views" | 3 additional gated page views + weekly brief subscription | > 25% of paywall encounters |
| Scroll popup (40% depth) | "Get the weekly 1000x brief" | Weekly brief subscription | > 3% of popup impressions |
| Exit intent popup | "Before you go — one email per week" | Weekly brief subscription | > 5% of popup impressions |
| Inline blog footer | "Subscribe" | Weekly brief subscription | > 1% of page views |
| Homepage hero | "Get the free brief" | Weekly brief subscription | > 5% of homepage visitors |

### What Happens After Email Capture

```
Email submitted
  → Create subscriber record in Supabase (tier: free, segment: free_new)
  → Tag with source page, category interest, capture method
  → Trigger welcome email (Email 1: immediate)
  → If from paywall: unlock 3 additional gated views (cookie + server-side tracking)
  → Set 24-hour popup cooldown
  → Show confirmation: "Check your inbox. Your first brief arrives Monday."
```

### Conversion Metric
**Email capture rate:** total emails captured / total unique visitors. Target: > 5% overall.

### Optimization Levers
- Single-field form: email only, no name field (reduce friction)
- Instant gratification: if from paywall, immediately reveal the gated content
- Social proof: "Join X researchers" (show real subscriber count once above 1,000)
- Privacy reassurance: "No spam. One email per week. Unsubscribe in one click."
- Pre-filled email: if user is logged into a social account, attempt to pre-fill

### A/B Test Ideas
1. **Popup timing:** Test 40% scroll vs. 60% scroll vs. time-based (30 seconds)
2. **Popup design:** Test modal overlay vs. bottom banner vs. slide-in from right
3. **Copy variant:** Test value-focused ("Get research") vs. FOMO ("Don't miss scores") vs. simplicity ("Subscribe")
4. **Social proof:** Test with subscriber count vs. without
5. **Fields:** Test email-only vs. email + first name
6. **Exit intent sensitivity:** Test 20px from top vs. 50px

---

## Stage 6: Nurture

### User Action
Subscriber receives the welcome sequence (3 emails over 7 days) and subsequent weekly briefs. They return to the site, browse more content, and develop trust in the data.

### Touchpoints

| Day | Email | Goal | Key Metric |
|---|---|---|---|
| 0 | Welcome: here's what you get | Set expectations, drive first return visit | Open rate > 60%, click rate > 20% |
| 3 | How to read scores | Educate, increase perceived value | Open rate > 40%, click rate > 10% |
| 7 | Top 3 this week + what Pro gets | First conversion nudge | Open rate > 35%, click rate > 8% |
| 14+ | Weekly briefs (ongoing) | Maintain engagement, periodic nudges | Open rate > 30%, click rate > 5% |

### Site Behavior During Nurture

When a subscriber returns to the site (identified by email cookie or login):
- Show personalized "Welcome back" message with their category of interest
- Highlight score changes since their last visit
- Show a subtle Pro upgrade banner (not aggressive, informational)
- Track pages viewed for segmentation

### Conversion Metric
**Nurture-to-pricing page rate:** percentage of email subscribers who visit the pricing page within 30 days. Target: > 15%.

**Return visit rate:** percentage of subscribers who return to the site at least once within 7 days of subscribing. Target: > 40%.

### Optimization Levers
- Email quality: every email must deliver genuine value (real data, real insights)
- Personalization: use category_interest tag to show relevant opportunities
- Timing: send emails at optimal times (test different send times)
- Re-engagement: if subscriber does not open 3 consecutive emails, trigger re-engagement sequence
- Website personalization: show relevant content based on subscriber profile

### A/B Test Ideas
1. **Welcome sequence length:** Test 3 emails vs. 5 emails vs. 7 emails
2. **Conversion nudge timing:** Test Day 7 vs. Day 14 for first conversion email
3. **Email send time:** Test 7 AM vs. 9 AM vs. 12 PM ET
4. **Personalization depth:** Test generic weekly brief vs. category-specific weekly brief
5. **Upgrade mention style:** Test inline mention vs. dedicated section vs. P.S. line

---

## Stage 7: Convert (Free → Pro)

### User Action
User decides to upgrade from the free tier to Pro. They visit the pricing page, select a plan, and complete payment.

### Touchpoints

#### Pricing Page (`/pricing`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Choose Your Plan                                                        │
│                                                                          │
│  ┌─────────────────────┐    ┌─────────────────────┐                     │
│  │  Free                │    │  Pro (recommended)   │                    │
│  │  $0/month            │    │  $29/month           │                    │
│  │                      │    │  or $249/year (save 28%) │               │
│  │  ✓ Browse all opps   │    │                      │                    │
│  │  ✓ Composite scores  │    │  Everything in Free, plus: │             │
│  │  ✓ Weekly brief      │    │  ✓ Full 8-signal breakdowns │            │
│  │  ✓ 3 deep-dives/mo  │    │  ✓ Unlimited deep-dives │               │
│  │                      │    │  ✓ Score change alerts │                 │
│  │                      │    │  ✓ Catalyst reminders │                  │
│  │                      │    │  ✓ Comparison tools  │                   │
│  │                      │    │  ✓ Data export (CSV) │                   │
│  │                      │    │  ✓ Pro weekly brief   │                  │
│  │                      │    │  ✓ Priority support   │                  │
│  │                      │    │                      │                    │
│  │  [Current Plan]      │    │  [Start 7-Day Free Trial] │             │
│  │                      │    │                      │                    │
│  └─────────────────────┘    └─────────────────────┘                     │
│                                                                          │
│  "I found 3 opportunities with 80+ scores that I would have            │
│   completely missed without next1000x." — @user                         │
│                                                                          │
│  FAQ: Is there a free trial? Do you offer refunds? etc.                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Checkout Flow

```
Pricing page → Select Pro → Stripe Checkout (hosted) → Success page → Dashboard
```

**Stripe Checkout configuration:**
- Allow both monthly ($29) and annual ($249) billing
- 7-day free trial on both plans
- Collect email (pre-filled if known) and card
- Apply promotional codes if available
- Redirect to `/dashboard?welcome=true` on success

#### Success Page (`/dashboard?welcome=true`)

```
Welcome to Pro!

Here's what to do first:
1. Build your watchlist — add projects you want to track [Start →]
2. Set up alerts — choose which score changes trigger emails [Configure →]
3. Explore full analyses — all signal breakdowns are now unlocked [Browse →]

Your Pro weekly brief starts next Monday.
```

### Conversion Metric
**Pricing page → Trial start rate:** Target > 10%.
**Trial → Paid conversion rate:** Target > 60%.
**Overall free-to-paid conversion rate:** Target > 2% of free registered users per month.

### Optimization Levers
- Free trial: 7-day trial with full access removes the risk barrier
- Annual discount: 28% savings on annual plan incentivizes longer commitment
- Social proof: testimonials, subscriber count, "X opportunities tracked" stat
- Feature comparison: clear visual distinction between free and Pro
- Urgency (light): "Score alerts have already fired X times this week" (real data)
- Reduce friction: pre-fill email from cookie, single-page Stripe checkout
- Money-back guarantee: 30-day refund policy displayed prominently

### Pricing Page Conversion Points

| Element | Purpose | Implementation |
|---|---|---|
| Feature comparison table | Clarify value of Pro | Static HTML with check/x marks |
| Social proof testimonial | Build trust | Rotate 3-5 real testimonials |
| "Score alerts fired X times this week" | Real-time urgency | Server-rendered count from score_history table |
| FAQ section | Overcome objections | FAQPage schema markup for SEO bonus |
| Annual plan highlight | Increase LTV | Default toggle to annual, show monthly savings |
| Trust badges | Reduce risk | "7-day free trial", "Cancel anytime", "30-day refund" |

### A/B Test Ideas
1. **Pricing tiers:** Test 2-tier (Free/Pro) vs. 3-tier (Free/Pro/Team)
2. **Price point:** Test $29/mo vs. $19/mo vs. $39/mo
3. **Annual discount:** Test 28% off vs. "2 months free" vs. no annual option
4. **Trial length:** Test 7-day vs. 14-day vs. no trial
5. **CTA text:** Test "Start Free Trial" vs. "Try Pro Free" vs. "Unlock Full Access"
6. **Social proof type:** Test testimonials vs. subscriber count vs. "X alerts sent this week"
7. **Default plan view:** Test monthly default vs. annual default
8. **Checkout flow:** Test Stripe hosted checkout vs. embedded checkout on /pricing

---

## Stage 8: Retain

### User Action
Pro subscriber continues to use the product, receives ongoing value, and renews their subscription.

### Touchpoints

| Touchpoint | Frequency | Content | Purpose |
|---|---|---|---|
| Pro weekly brief | Weekly (Monday) | Full score log, watchlist update, export link | Core value delivery |
| Score change alerts | Real-time | Individual alerts per watchlist project | Active engagement |
| Catalyst reminders | 7-day and 1-day | Upcoming events for watchlisted projects | Utility |
| Dashboard | On-demand | Watchlist, score history charts, export | Self-service value |
| Monthly recap email | Monthly | Summary of score changes, best performers, new additions | Engagement + appreciation |
| Feature announcements | As needed | New features, methodology updates | Continued investment in product |

### Churn Signals and Interventions

| Signal | Threshold | Intervention |
|---|---|---|
| No login | 7 days | Personalized email: "Your watchlist had X score changes this week" |
| No login | 14 days | Email: "Here's what's happened since you last checked" + one-click login link |
| No login | 21 days | Email: "We miss you" + offer (1 month free extension for re-engagement) |
| No email opens | 3 consecutive emails | Change send time + subject line approach |
| Empty watchlist | After 3 days of Pro | Email: "Build your watchlist in 60 seconds" with tutorial |
| No export usage | After 14 days of Pro | Email: "Did you know you can export all data to CSV?" |
| Cancellation initiated | Immediate | Cancellation survey + retention offer (see below) |

### Cancellation Flow

```
User clicks "Cancel subscription"
  → Show cancellation survey (required):
    ○ Too expensive
    ○ Not using it enough
    ○ Found a better alternative
    ○ Missing features I need
    ○ Other: [text field]
  → Based on response, show retention offer:
    - "Too expensive" → Offer 50% off next 2 months
    - "Not using it enough" → Offer pause (3-month freeze) instead of cancel
    - "Missing features" → Collect feature request + offer 1 month free while we build
    - All others → "We're sorry to see you go. Your access continues until [end of billing period]."
  → If user proceeds with cancellation:
    - Downgrade to free tier at end of billing period
    - Keep all data (watchlist, preferences) intact
    - Tag subscriber as "pro_churned" for win-back campaigns
```

### Win-Back Campaign (for `pro_churned` segment)

**Email 1 (14 days after cancellation):**
Subject: "{{topChange.project}} just moved {{topChange.delta}} points — here is what you missed"
Content: Show the most dramatic score change since they left. Include a "Re-subscribe" link with 20% discount.

**Email 2 (30 days after cancellation):**
Subject: "{{newFeature.name}} is now live on next1000x Pro"
Content: Announce the newest feature they haven't experienced. Include re-subscribe CTA.

**Email 3 (60 days after cancellation):**
Subject: "One-time offer: 50% off next1000x Pro for 3 months"
Content: Final aggressive offer. If no conversion, move to quarterly check-in cadence.

### Retention Metric Targets

| Metric | Target | Measurement |
|---|---|---|
| Monthly churn rate | < 5% | Stripe subscription data |
| Annual retention rate | > 70% | Stripe subscription data |
| DAU/MAU ratio | > 20% | Analytics |
| Weekly email open rate (Pro) | > 40% | Email provider |
| Average watchlist size | > 5 projects | Database query |
| NPS score | > 50 | Quarterly survey |

### Optimization Levers
- Continuous value delivery: weekly email must always contain actionable data
- Product depth: add new features quarterly (watchlist improvements, portfolio tracking, API access)
- Community: consider a Pro-only Discord/Telegram for discussion (future)
- Personalization: surface the most relevant opportunities based on browsing and watchlist behavior
- Usage nudges: in-app prompts to use features they have not tried

### A/B Test Ideas
1. **Retention offer type:** Test discount vs. pause vs. free month extension
2. **Win-back timing:** Test 14-day vs. 30-day first contact
3. **Win-back discount:** Test 20% vs. 50% vs. "1 month free"
4. **Engagement email frequency:** Test weekly vs. bi-weekly reminder for inactive Pro users
5. **Feature education:** Test in-app tooltip tour vs. email tutorial series for new Pro users

---

## Funnel Metrics Dashboard

### Key Metrics to Track End-to-End

```
Stage 1: Discovery
  - Unique visitors / week (by source)
  - Search impressions / week (Google Search Console)
  - Social impressions / week (by platform)

Stage 2: Landing
  - Bounce rate by landing page type
  - Engaged visit rate (>25% scroll OR >15 sec)

Stage 3: Browse
  - Pages per session
  - Return visit rate (within 7 days)
  - Category pages browsed

Stage 4: Paywall Hit
  - Paywall encounter rate (% of free users)
  - Paywall click-through rate

Stage 5: Email Capture
  - Email capture rate (by source)
  - Popup impression → submit rate
  - Total new subscribers / week

Stage 6: Nurture
  - Welcome sequence completion rate
  - Weekly brief open/click rates
  - Return visit rate from email
  - Pricing page visit rate from email

Stage 7: Convert
  - Pricing page → trial start rate
  - Trial start → paid conversion rate
  - Revenue / month
  - Average revenue per user (ARPU)
  - Monthly recurring revenue (MRR)

Stage 8: Retain
  - Monthly churn rate
  - LTV (lifetime value) per subscriber
  - Feature usage rates
  - NPS score
```

### Analytics Implementation

```typescript
// lib/analytics/funnel.ts

// Track funnel events via Vercel Analytics + custom events in Supabase

export function trackFunnelEvent(
  event: string,
  properties: Record<string, string | number | boolean>
) {
  // Send to Vercel Analytics (or PostHog, Mixpanel, etc.)
  if (typeof window !== 'undefined' && window.va) {
    window.va('event', { name: event, ...properties })
  }

  // Also log to Supabase for custom reporting
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      properties,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getUserId(), // null for anonymous
    }),
  })
}

// Usage examples:
// trackFunnelEvent('paywall_hit', { page: '/blog/is-bittensor-a-good-investment', views_used: 3 })
// trackFunnelEvent('email_captured', { source: 'scroll_popup', page: '/blog/what-is-bittensor' })
// trackFunnelEvent('pricing_page_viewed', { referrer: 'paywall', plan_viewed: 'pro_monthly' })
// trackFunnelEvent('trial_started', { plan: 'pro_annual' })
// trackFunnelEvent('subscription_converted', { plan: 'pro_annual', trial_days: 7 })
```

### Supabase Analytics Table

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  subscriber_id UUID REFERENCES subscribers(id),
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for funnel analysis queries
CREATE INDEX idx_analytics_event_time ON analytics_events (event, created_at);
CREATE INDEX idx_analytics_session ON analytics_events (session_id, created_at);
CREATE INDEX idx_analytics_user ON analytics_events (user_id, created_at);
```

---

## Revenue Projections (Conservative)

### Assumptions
- 100 programmatic SEO pages at launch, growing to 500+ within 3 months
- Average 50 organic visits/day in month 1, growing to 500/day by month 6
- Email capture rate: 5%
- Free-to-paid conversion: 2% of email subscribers per month
- Pro price: $29/month or $249/year
- Monthly churn: 5%

### Month-by-Month (First 6 Months)

| Month | Organic Visits/Day | New Emails | Cumulative Emails | New Pro Subs | Cumulative Pro | MRR |
|---|---|---|---|---|---|---|
| 1 | 50 | 75 | 75 | 2 | 2 | $58 |
| 2 | 100 | 150 | 225 | 5 | 6 | $174 |
| 3 | 200 | 300 | 525 | 11 | 16 | $464 |
| 4 | 350 | 525 | 1,050 | 21 | 35 | $1,015 |
| 5 | 450 | 675 | 1,725 | 35 | 66 | $1,914 |
| 6 | 500 | 750 | 2,475 | 50 | 109 | $3,161 |

Note: These are conservative estimates. Viral social posts, Product Hunt launches, or press coverage could accelerate growth significantly. The programmatic SEO pages compound over time as they accumulate domain authority and backlinks.

### Key Leverage Points for Accelerating Growth
1. **SEO compounding:** Each new page adds to the site's topical authority, improving rankings for all pages
2. **Email list compounding:** Larger list means more word-of-mouth, more social sharing, more backlinks
3. **Data network effects:** More opportunities tracked = more comparison pages = more SEO coverage = more visitors
4. **Social proof:** Higher subscriber counts improve conversion rates across all stages
