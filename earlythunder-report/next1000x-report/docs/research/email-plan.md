# next1000x.com — Email Marketing Plan

## 1. Email Capture Strategy

### Capture Points

| Location | Trigger | Copy | Priority |
|---|---|---|---|
| Homepage hero | Immediate (static form) | "Get the weekly 1000x brief — free" | P0 |
| Blog pages (scroll) | 40% scroll depth | "Enjoying this research? Get it in your inbox every Monday." | P0 |
| Blog pages (exit intent) | Mouse leaves viewport (desktop) / back-button tap (mobile) | "Before you go — one email per week, no spam" | P0 |
| Opportunity detail page | After viewing 2+ opportunities (session cookie) | "You're doing serious research. Get score alerts." | P1 |
| Paywall hit | When free user hits gated content | "Enter your email for 3 free deep-dives per month" | P0 |
| Footer | Always visible | Simple email input, "Subscribe" button | P2 |
| Pricing page (no-convert exit) | Exit intent on /pricing | "Not ready to commit? Get the free weekly brief." | P1 |

### Popup Configuration

```typescript
// lib/email-capture/config.ts

export const popupConfig = {
  scrollTrigger: {
    threshold: 0.4, // 40% scroll depth
    delay: 5000,    // minimum 5 seconds on page before showing
    cooldown: 86400000, // 24 hours between popup shows (localStorage)
    showOnce: false,     // show again after cooldown
    excludePages: ['/pricing', '/auth/', '/dashboard/'],
  },
  exitIntent: {
    enabled: true,
    sensitivity: 20, // pixels from top of viewport
    cooldown: 604800000, // 7 days between exit intent popups
    mobileBackButton: true,
  },
  sessionTrigger: {
    pageViewThreshold: 2, // show after 2 page views
    cooldown: 86400000,
  },
  dismissBehavior: {
    permanentDismiss: false, // "X" dismisses for cooldown period, not forever
    escapeKey: true,
    outsideClick: true,
  },
}
```

### Popup Copy Variants (A/B Test)

**Variant A (Value-focused):**
```
Headline: "The Monday 1000x Brief"
Subhead: "One email. Top-scored opportunities, score changes, and catalyst alerts."
CTA: "Subscribe — Free"
Fine print: "Join 2,000+ researchers. Unsubscribe anytime."
```

**Variant B (Scarcity-focused):**
```
Headline: "Don't Miss the Next 1000x Move"
Subhead: "Score changes, new opportunities, and catalyst deadlines — delivered weekly."
CTA: "Get the Brief"
Fine print: "Free forever. No spam. One click unsubscribe."
```

**Variant C (Data-focused):**
```
Headline: "This Week's Biggest Score Changes"
Subhead: "See which opportunities moved up or down across our 8-signal framework."
CTA: "Send Me the Data"
Fine print: "Every Monday. Free tier. Upgrade for daily alerts."
```

### Segmentation Tags Applied at Capture

Every subscriber gets tagged at capture with:
- `source`: the page URL where they subscribed
- `category_interest`: the category of the page they were reading (if applicable)
- `tier`: `free` (default; updated to `pro` upon conversion)
- `capture_method`: `scroll_popup`, `exit_intent`, `inline_form`, `paywall`, `footer`

---

## 2. Welcome Sequence (3 Emails Over 7 Days)

### Email 1: Welcome (Sent immediately)

**Subject line:** "Your 1000x research starts here"
**Preview text:** "Here is what you get — and how to use it."

```
Hi {{subscriber.first_name || 'there'}},

Welcome to next1000x.

You now have access to:
- The weekly 1000x brief (every Monday, 7am ET)
- Composite scores for {{totalOpportunities}} opportunities across 10 categories
- Research briefs on every tracked project

Here is what we cover:
- AI x Crypto
- DePIN
- DeSci
- ZK/Privacy
- Restaking
- RWA (Real-World Assets)
- Nuclear/Uranium
- Fusion Energy
- Quantum Computing
- Frontier Biotech

Each opportunity is scored 1-100 using our 8-Signal Pattern Filter:
Market Timing, Team, Tech Moat, Tokenomics, Community, Regulatory, Catalysts, and Asymmetric Upside.

Start browsing: [Explore the Database →](https://next1000x.com)

{{#if subscriber.category_interest}}
Based on what you were reading, you might want to start here:
[Top {{subscriber.category_interest}} Opportunities →](https://next1000x.com/blog/{{slugifyCategory(subscriber.category_interest)}}-opportunities-2026)
{{/if}}

— The next1000x team

P.S. Reply to this email with questions. We read every one.
```

**Technical notes:**
- Send via transactional email (not bulk) for immediate delivery
- Track open and click events
- If `category_interest` tag exists, include the personalized link
- Unsubscribe link in footer (required by CAN-SPAM)

---

### Email 2: Value demonstration (Sent Day 3)

**Subject line:** "How to read a next1000x score"
**Preview text:** "80/100 does not mean 'safe.' Here is what the numbers actually tell you."

```
Hi {{subscriber.first_name || 'there'}},

A composite score of 80/100 does not mean "guaranteed winner." Here is how to actually use our data.

**The 8 Signals, Explained:**

1. **Market Timing (1-10)** — Is the sector in a growth cycle? Are we early or late?
2. **Team & Execution (1-10)** — Track record, shipping cadence, talent density.
3. **Technology Moat (1-10)** — Defensibility. Can someone fork this tomorrow?
4. **Tokenomics / Cap Structure (1-10)** — Supply dynamics, vesting schedules, dilution risk.
5. **Community & Network Effects (1-10)** — Organic growth, developer activity, ecosystem depth.
6. **Regulatory Positioning (1-10)** — How exposed is this to regulatory crackdown?
7. **Catalyst Pipeline (1-10)** — What concrete events could move this in the next 6-12 months?
8. **Asymmetric Upside (1-10)** — Risk/reward ratio. How much upside vs. downside?

**How to use this:**
- A project scoring 9/10 on Asymmetric Upside but 3/10 on Team is a gamble, not a conviction bet.
- A project scoring 7+ across all signals is rare and worth deep attention.
- Score changes matter more than absolute scores. A project moving from 60 to 75 in a month is signaling something.

See it in action: [Read a sample analysis →](https://next1000x.com/blog/what-is-{{featuredProject.slug}})

Want score change alerts? [Upgrade to Pro →](https://next1000x.com/pricing)

— next1000x
```

**Technical notes:**
- `featuredProject` = highest-scored project in the subscriber's `category_interest`, or the overall highest-scored project if no category preference
- This email exists to educate and reduce churn from misunderstanding the product

---

### Email 3: Conversion nudge (Sent Day 7)

**Subject line:** "3 opportunities that scored above 80 this week"
**Preview text:** "Plus: what Pro members are tracking that you're missing."

```
Hi {{subscriber.first_name || 'there'}},

Your first week of 1000x research. Here is what you might have missed:

**This Week's Top 3 (by composite score):**

1. **{{top3[0].name}}** — {{top3[0].composite_score}}/100
   {{top3[0].one_liner}}
   [Read Analysis →](https://next1000x.com/blog/what-is-{{top3[0].slug}})

2. **{{top3[1].name}}** — {{top3[1].composite_score}}/100
   {{top3[1].one_liner}}
   [Read Analysis →](https://next1000x.com/blog/what-is-{{top3[1].slug}})

3. **{{top3[2].name}}** — {{top3[2].composite_score}}/100
   {{top3[2].one_liner}}
   [Read Analysis →](https://next1000x.com/blog/what-is-{{top3[2].slug}})

**What Pro members got this week that you didn't:**
- {{proExclusiveCount}} score change alerts
- {{newOpportunityCount}} new opportunities added
- {{catalystAlertCount}} catalyst deadline reminders
- Full 8-signal breakdowns for all {{totalOpportunities}} projects
- CSV export of the full database

[See Pro plans →](https://next1000x.com/pricing)

Or keep using the free tier — you'll get the weekly brief every Monday.

— next1000x
```

**Technical notes:**
- `top3` = three highest-scored opportunities across all categories (or filtered by `category_interest`)
- `proExclusiveCount`, `newOpportunityCount`, `catalystAlertCount` = actual counts from the past 7 days
- This is the first conversion-oriented email; tone is informational, not aggressive

---

## 3. Weekly Brief (Ongoing — Every Monday 7:00 AM ET)

### Free Version

**Subject line formula (rotate weekly):**
- "The 1000x Brief: {{topMover.name}} just jumped {{topMover.score_delta}} points"
- "This week in 1000x: {{newCount}} new opportunities, {{changeCount}} score changes"
- "Monday Brief: The highest-scored opportunity you haven't seen yet"

```
THE 1000X BRIEF — Week of {{weekOfDate}}

---

TOP MOVERS THIS WEEK

{{#each topMovers as mover, index}}
{{index + 1}}. {{mover.name}} — {{mover.previous_score}} → {{mover.current_score}} ({{mover.score_delta > 0 ? '+' : ''}}{{mover.score_delta}})
   {{mover.change_reason}}
   [View Analysis →](https://next1000x.com/blog/what-is-{{mover.slug}})
{{/each}}

---

NEW ADDITIONS

{{#each newOpportunities as opp}}
- **{{opp.name}}** ({{opp.category}}) — {{opp.composite_score}}/100
  {{opp.one_liner}}
  [Read →](https://next1000x.com/blog/what-is-{{opp.slug}})
{{/each}}

{{#if newOpportunities.length === 0}}
No new additions this week.
{{/if}}

---

UPCOMING CATALYSTS (Next 14 Days)

{{#each upcomingCatalysts as cat}}
- **{{cat.project_name}}**: {{cat.description}} — {{formatDate(cat.date)}}
{{/each}}

[🔓 Pro members get instant catalyst alerts → Upgrade](https://next1000x.com/pricing)

---

CATEGORY SPOTLIGHT: {{spotlightCategory.name}}

{{spotlightCategory.brief_commentary}}

Top 3 in {{spotlightCategory.name}}:
{{#each spotlightCategory.top3 as opp, index}}
{{index + 1}}. {{opp.name}} — {{opp.composite_score}}/100
{{/each}}

[See all {{spotlightCategory.name}} opportunities →](https://next1000x.com/blog/{{spotlightCategory.slug}}-opportunities-2026)

---

Browse all {{totalOpportunities}} opportunities: https://next1000x.com
```

### Pro Version (everything above, plus)

Additional sections appended after the free content:

```
---

PRO: FULL SCORE CHANGE LOG

{{#each allScoreChanges as change}}
| {{change.project_name}} | {{change.signal_name}} | {{change.old_score}} → {{change.new_score}} | {{change.reason}} |
{{/each}}

---

PRO: WATCHLIST UPDATE

Your tracked opportunities:
{{#each subscriber.watchlist as watched}}
- **{{watched.name}}**: {{watched.composite_score}}/100 ({{watched.score_delta !== 0 ? `${watched.score_delta > 0 ? '+' : ''}${watched.score_delta} this week` : 'no change'}})
{{/each}}

---

PRO: DATA EXPORT

[Download this week's full database snapshot (CSV) →](https://next1000x.com/api/export?week={{weekId}}&token={{subscriber.export_token}})
```

### Email Generation Automation

```typescript
// lib/email/weekly-brief.ts

import { createClient } from '@/lib/supabase/server'

interface WeeklyBriefData {
  topMovers: ScoreChange[]
  newOpportunities: Opportunity[]
  upcomingCatalysts: Catalyst[]
  spotlightCategory: CategorySpotlight
  allScoreChanges: ScoreChange[] // Pro only
  totalOpportunities: number
  weekOfDate: string
}

export async function generateWeeklyBrief(): Promise<WeeklyBriefData> {
  const supabase = createClient()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Top movers: opportunities with largest absolute score change in past 7 days
  const { data: topMovers } = await supabase
    .from('score_history')
    .select('*, opportunities(*)')
    .gte('changed_at', oneWeekAgo)
    .order('abs_delta', { ascending: false })
    .limit(5)

  // New additions
  const { data: newOpportunities } = await supabase
    .from('opportunities')
    .select('*')
    .gte('created_at', oneWeekAgo)
    .order('composite_score', { ascending: false })

  // Upcoming catalysts
  const { data: upcomingCatalysts } = await supabase
    .from('catalysts')
    .select('*, opportunities(name, slug)')
    .gte('date', new Date().toISOString())
    .lte('date', twoWeeksOut)
    .order('date', { ascending: true })

  // Spotlight: rotate through categories weekly
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const categories = [
    'AI x Crypto', 'DePIN', 'DeSci', 'ZK/Privacy', 'Restaking',
    'RWA', 'Nuclear/Uranium', 'Fusion Energy', 'Quantum Computing', 'Frontier Biotech'
  ]
  const spotlightCategoryName = categories[weekNumber % categories.length]

  const { data: spotlightOpps } = await supabase
    .from('opportunities')
    .select('*')
    .eq('category', spotlightCategoryName)
    .order('composite_score', { ascending: false })
    .limit(3)

  // Total count
  const { count: totalOpportunities } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })

  return {
    topMovers: topMovers ?? [],
    newOpportunities: newOpportunities ?? [],
    upcomingCatalysts: upcomingCatalysts ?? [],
    spotlightCategory: {
      name: spotlightCategoryName,
      slug: slugifyCategory(spotlightCategoryName),
      top3: spotlightOpps ?? [],
      brief_commentary: '', // pulled from categories table
    },
    allScoreChanges: [], // populated separately for Pro
    totalOpportunities: totalOpportunities ?? 0,
    weekOfDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}
```

---

## 4. Score Change Alert (Pro Only — Real-Time)

**Trigger:** Any time a project's composite score changes by 5+ points, or any single signal changes by 2+ points.

**Subject line:** "Score Alert: {{project.name}} moved {{delta > 0 ? 'up' : 'down'}} to {{project.composite_score}}/100"

```
SCORE CHANGE ALERT

**{{project.name}}** {{project.ticker ? `(${project.ticker})` : ''}}

Previous Score: {{previousScore}}/100
New Score: {{newScore}}/100
Change: {{delta > 0 ? '+' : ''}}{{delta}} points

**What Changed:**
{{#each signalChanges as change}}
- {{change.signal_name}}: {{change.old}} → {{change.new}} ({{change.delta > 0 ? '+' : ''}}{{change.delta}})
  Reason: {{change.reason}}
{{/each}}

**Why It Matters:**
{{changeSummary}}

[View Full Updated Analysis →](https://next1000x.com/blog/what-is-{{project.slug}})

---

You're receiving this because {{project.name}} is on your watchlist.
[Manage watchlist](https://next1000x.com/dashboard/watchlist) | [Unsubscribe from alerts]({{unsubscribeUrl}})
```

**Technical implementation:**
- Triggered by a Supabase database webhook on the `score_history` table
- Webhook calls a Vercel serverless function at `/api/webhooks/score-change`
- Function queries all subscribers with this project on their watchlist
- Sends via transactional email provider (Resend, Postmark, or SendGrid)
- Rate limit: maximum 1 alert per project per 24 hours per subscriber

---

## 5. Catalyst Reminder (Pro Only)

**Trigger:** 7 days and 1 day before a catalyst date for any project on the subscriber's watchlist.

**Subject line (7-day):** "Catalyst in 7 days: {{catalyst.description}} ({{project.name}})"
**Subject line (1-day):** "Tomorrow: {{catalyst.description}} ({{project.name}})"

```
CATALYST REMINDER

**{{project.name}}** — {{catalyst.description}}

Date: {{formatDate(catalyst.date)}} ({{daysUntil}} day{{daysUntil !== 1 ? 's' : ''}} away)
Expected Impact: {{catalyst.impact || 'Moderate-High'}}

**Current Score:** {{project.composite_score}}/100
**Catalyst Pipeline Signal:** {{project.scores.catalysts}}/10

**What to watch for:**
{{catalyst.watch_for || 'Monitor for announcements, price action, and community sentiment around this event.'}}

[View {{project.name}} Analysis →](https://next1000x.com/blog/what-is-{{project.slug}})

---

Upcoming catalysts on your watchlist:
{{#each otherUpcomingCatalysts as cat}}
- {{cat.project_name}}: {{cat.description}} — {{formatDate(cat.date)}}
{{/each}}

[Manage watchlist](https://next1000x.com/dashboard/watchlist) | [Unsubscribe]({{unsubscribeUrl}})
```

**Technical implementation:**
- Daily cron job (Vercel Cron or external scheduler) at 8:00 AM ET
- Queries catalysts table for events 7 days and 1 day from now
- Cross-references with subscriber watchlists
- Batches emails per subscriber (one email with all relevant reminders, not one per catalyst)

---

## 6. Segmentation Strategy

### Segment Definitions

| Segment | Criteria | Email Cadence | Content Focus |
|---|---|---|---|
| `free_new` | Free tier, joined < 14 days | Welcome sequence + weekly | Education, value demo, soft conversion |
| `free_active` | Free tier, opened email in last 30 days | Weekly brief (free version) | Maintain engagement, periodic upgrade nudges |
| `free_dormant` | Free tier, no open in 30+ days | Re-engagement sequence (see below) | Win-back, new features, FOMO |
| `free_power` | Free tier, 5+ sessions/week | Targeted upgrade email | "You're clearly serious — here's what Pro adds" |
| `pro_new` | Pro tier, joined < 14 days | Onboarding sequence | Feature education, watchlist setup |
| `pro_active` | Pro tier, active | Weekly brief (pro version) + alerts | Full value delivery |
| `pro_churning` | Pro tier, no login in 14+ days | Re-engagement | Feature reminders, new data highlights |
| `category_[name]` | Interest in specific category | Category-specific content | Targeted opportunities and comparisons |

### Re-Engagement Sequence (for `free_dormant`)

**Email 1 (Day 30 of dormancy):**
Subject: "{{topNewProject.name}} just scored {{topNewProject.composite_score}}/100 — have you seen it?"
Content: Highlight the highest-scored new addition since they went dormant.

**Email 2 (Day 45 of dormancy):**
Subject: "{{changeCount}} scores changed while you were away"
Content: Summary of major score movements.

**Email 3 (Day 60 of dormancy):**
Subject: "Still interested in {{subscriber.category_interest || '1000x opportunities'}}?"
Content: Final check-in. If no engagement, reduce cadence to monthly or suppress.

### Automated Tag Management

```typescript
// lib/email/segmentation.ts

export async function updateSubscriberSegments() {
  const supabase = createClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Mark dormant free users
  await supabase
    .from('subscribers')
    .update({ segment: 'free_dormant' })
    .eq('tier', 'free')
    .lt('last_email_opened_at', thirtyDaysAgo.toISOString())
    .neq('segment', 'free_dormant')

  // Mark power free users (5+ sessions in past 7 days)
  // This requires a join with analytics/session data
  const { data: powerUsers } = await supabase
    .rpc('get_power_free_users', { min_sessions: 5, days: 7 })

  for (const user of powerUsers ?? []) {
    await supabase
      .from('subscribers')
      .update({ segment: 'free_power' })
      .eq('id', user.id)
  }

  // Mark churning Pro users
  await supabase
    .from('subscribers')
    .update({ segment: 'pro_churning' })
    .eq('tier', 'pro')
    .lt('last_login_at', fourteenDaysAgo.toISOString())
    .neq('segment', 'pro_churning')
}
```

---

## 7. Email Infrastructure

### Recommended Provider: Resend

**Why Resend:**
- Built for developers (React Email templates, API-first)
- Excellent deliverability
- Vercel-native integration
- Generous free tier (3,000 emails/month)
- Transactional + marketing in one platform

### Email Sending Architecture

```
[Supabase DB Webhook] → [Vercel Serverless Function] → [Resend API]
                                    ↑
[Vercel Cron Jobs] ─────────────────┘
```

**Cron schedule (configured in `vercel.json`):**

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-brief",
      "schedule": "0 12 * * 1"
    },
    {
      "path": "/api/cron/catalyst-reminders",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/cron/segment-update",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/re-engagement",
      "schedule": "0 14 * * 3"
    }
  ]
}
```

Note: Cron schedule times are UTC. `0 12 * * 1` = Monday 12:00 UTC = Monday 7:00 AM ET (during EDT).

### Database Tables Required

```sql
-- Subscribers table
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  segment TEXT DEFAULT 'free_new',
  category_interest TEXT,
  capture_source TEXT,
  capture_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_email_opened_at TIMESTAMPTZ,
  last_email_clicked_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Email send log
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  email_type TEXT NOT NULL, -- 'welcome_1', 'welcome_2', 'weekly_brief', 'score_alert', etc.
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Watchlist (for Pro alert targeting)
CREATE TABLE watchlist (
  subscriber_id UUID REFERENCES subscribers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (subscriber_id, opportunity_id)
);
```

### Key Metrics to Track

| Metric | Target | Measurement |
|---|---|---|
| Welcome sequence completion rate | > 60% open all 3 | email_log opens |
| Weekly brief open rate | > 35% | email_log opens |
| Weekly brief click rate | > 8% | email_log clicks |
| Score alert open rate | > 50% | email_log opens |
| Free → Pro conversion from email | > 2% of free subscribers/month | Stripe + subscriber tier change |
| Unsubscribe rate | < 0.3% per send | Resend dashboard |
| Email-driven site visits | > 15% of total traffic | UTM tracking |

### UTM Parameter Convention

All email links must include UTM parameters:

```
?utm_source=email&utm_medium={{email_type}}&utm_campaign={{campaign_id}}&utm_content={{link_position}}
```

Examples:
- `utm_source=email&utm_medium=weekly_brief&utm_campaign=2026-w16&utm_content=top_mover_1`
- `utm_source=email&utm_medium=welcome_2&utm_campaign=welcome_sequence&utm_content=featured_project`
- `utm_source=email&utm_medium=score_alert&utm_campaign=score_change&utm_content=view_analysis`
