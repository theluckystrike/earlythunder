# next1000x Database Schema

## Overview

PostgreSQL schema for the next1000x.com intelligence platform, designed to run on Supabase. The schema covers opportunity tracking with the 8-Signal Pattern Filter, a freemium content paywall, a scout signal ingestion pipeline, and weekly intelligence briefs.

## Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Full initial schema: enums, tables, indexes, RLS, triggers, views |

## Design Decisions

### 1. UUIDs Everywhere

All primary keys use `uuid_generate_v4()`. This avoids sequential ID enumeration by unauthenticated users, plays well with Supabase's default auth system, and allows offline ID generation by future clients or agents.

### 2. Enum Types Instead of Magic Strings

Eleven custom PostgreSQL enums enforce valid values at the database level: `opportunity_tier`, `opportunity_status`, `signal_type`, `risk_probability`, `risk_severity`, `impact_level`, `entry_mechanism_type`, `subscription_tier`, `scout_signal_status`, and `opportunity_category`. This is stricter than CHECK constraints on text columns and produces cleaner error messages.

### 3. Paywall Enforcement via Views, Not RLS

Row Level Security cannot gate individual *columns* — only entire rows. Since both free and paid users need to see the same opportunity rows but with different column visibility (`full_analysis`, `full_content`), we use **gated views** (`opportunities_gated`, `weekly_briefs_gated`). These views call `is_paid_subscriber()` to conditionally return or NULL-out paywall fields. The API layer should query the gated views for user-facing reads.

### 4. Composite Score Auto-Recalculation

When any row in `opportunity_signals` is inserted, updated, or deleted, a trigger (`trg_recalculate_composite`) automatically recalculates the parent opportunity's `composite_score` using the weighted formula from the 8-Signal Pattern Filter spec. This eliminates stale scores and removes the need for application-level recalculation.

**Signal Weights:**
| Signal | Weight |
|--------|--------|
| Toy Phase Dismissal | 15% |
| Working Code Before Speculation | 20% |
| Ideological Community | 10% |
| Developer Activity Surge | 15% |
| Smart Money Entry | 15% |
| One-Sentence Narrative | 5% |
| Hard to Buy | 5% |
| Catalyst Proximity | 15% |

### 5. RLS Policy Strategy

- **Public tables** (opportunities, signals, entry_mechanisms, risks, catalysts, communities, graveyard_postmortems, weekly_briefs): Anonymous and authenticated SELECT allowed. Only admins can write.
- **Private tables** (profiles): Users can only SELECT/UPDATE/INSERT their own row.
- **Admin-only tables** (scout_signals): No public access. Only service_role or users with `app_metadata.role = 'admin'` can read or write.

Admin detection uses two mechanisms: the Supabase `service_role` JWT claim (for server-side operations) and a custom `app_metadata.role = 'admin'` claim (for admin dashboard use from the client SDK).

### 6. Auto-Profile Creation

A trigger on `auth.users` automatically creates a `profiles` row with `subscription_tier = 'free'` on every new signup. This guarantees a 1:1 relationship and means the application never needs to handle "profile not found" cases.

### 7. Indexing Strategy

Indexes target the four most common query patterns:
1. **Browse by category and tier** — `idx_opportunities_category_tier`
2. **Leaderboard by score** — `idx_opportunities_composite_score` (DESC)
3. **Filter by status** — `idx_opportunities_status_score` (compound, for "active opportunities sorted by score")
4. **Scout triage** — `idx_scout_signals_novelty` (partial index on pending signals only)
5. **Upcoming catalysts** — `idx_catalysts_estimated_date` (partial index on unfired catalysts)

Partial indexes on `WHERE NOT fired` and `WHERE status = 'pending'` keep index size small and writes fast on high-churn columns.

### 8. Timestamps

Every table has `created_at` and `updated_at` columns. A shared trigger function `set_updated_at()` is attached to every table to automatically maintain `updated_at` on row modification. No application code needed.

## Table Relationships

```
auth.users
  └── profiles (1:1, FK with CASCADE)

opportunities (core)
  ├── opportunity_signals (1:8, one per signal_type, UNIQUE constraint)
  ├── entry_mechanisms (1:N)
  ├── risks (1:N)
  ├── catalysts (1:N)
  ├── communities (1:N)
  └── graveyard_postmortems (1:1, UNIQUE constraint)

scout_signals (standalone pipeline table)
weekly_briefs (standalone, one per week)
```

## Tier Classification

| Tier | Composite Score | Description |
|------|----------------|-------------|
| 1 | 80-100 | Highest conviction, strongest signal alignment |
| 2 | 65-79 | Strong potential, some signals still developing |
| 3 | 55-64 | Early-stage tracking, needs more evidence |
| Archived | <55 | Score dropped below threshold, no longer actively tracked |

## Running the Migration

Against a Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or directly via psql
psql "$SUPABASE_DB_URL" -f docs/schema/001_initial_schema.sql
```
