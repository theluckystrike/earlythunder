-- =============================================================================
-- next1000x.com — Initial Database Schema
-- Migration: 001_initial_schema
-- Date: 2026-04-13
-- Engine: Supabase (PostgreSQL 15+)
-- =============================================================================
-- This migration creates the complete data model for the next1000x intelligence
-- platform: opportunity tracking with 8-signal scoring, user profiles with
-- freemium gating, scout pipeline, weekly briefs, and graveyard post-mortems.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM Types
-- ---------------------------------------------------------------------------

-- Opportunity lifecycle: active tracking -> archived (score drop) -> graveyard (dead)
CREATE TYPE opportunity_tier AS ENUM ('1', '2', '3');

CREATE TYPE opportunity_status AS ENUM (
  'active',
  'archived',
  'graveyard'
);

-- The 8 signals of the Pattern Filter, in canonical order
CREATE TYPE signal_type AS ENUM (
  'toy_phase_dismissal',
  'working_code',
  'ideological_community',
  'developer_activity_surge',
  'smart_money_entry',
  'one_sentence_narrative',
  'hard_to_buy',
  'catalyst_proximity'
);

-- Shared probability / severity / impact scales
CREATE TYPE risk_probability AS ENUM ('low', 'medium', 'high');
CREATE TYPE risk_severity   AS ENUM ('low', 'medium', 'high');
CREATE TYPE impact_level    AS ENUM ('low', 'medium', 'high');

-- How a user can gain exposure
CREATE TYPE entry_mechanism_type AS ENUM (
  'token',
  'mining',
  'equity',
  'airdrop'
);

-- Subscription tiers gating content access
CREATE TYPE subscription_tier AS ENUM (
  'free',
  'pro',
  'api'
);

-- Scout pipeline lifecycle
CREATE TYPE scout_signal_status AS ENUM (
  'pending',
  'processed',
  'rejected'
);

-- Opportunity category verticals
CREATE TYPE opportunity_category AS ENUM (
  'crypto',
  'deep_tech',
  'commodities',
  'frontier_science'
);

-- ---------------------------------------------------------------------------
-- 2. Utility: auto-update trigger for updated_at columns
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

-- -------------------------------------------------------------------------
-- 3a. profiles — extends Supabase auth.users with subscription metadata
-- -------------------------------------------------------------------------
COMMENT ON FUNCTION set_updated_at IS
  'Trigger function: automatically sets updated_at = NOW() on row update.';

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  subscription_tier     subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE profiles IS
  'User profile extending Supabase auth.users. Holds subscription tier and Stripe billing references.';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------------------
-- 3b. opportunities — the core tracking table
-- -------------------------------------------------------------------------
CREATE TABLE opportunities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  ticker            TEXT,
  category          opportunity_category NOT NULL,
  subcategory       TEXT,
  tier              opportunity_tier NOT NULL,
  composite_score   NUMERIC(5,2) NOT NULL DEFAULT 0
                      CHECK (composite_score >= 0 AND composite_score <= 100),
  one_liner         TEXT NOT NULL,
  full_analysis     TEXT,                       -- paywall-gated
  market_cap        NUMERIC,
  price_at_entry    NUMERIC,
  ath               NUMERIC,
  drawdown_from_ath NUMERIC,
  status            opportunity_status NOT NULL DEFAULT 'active',
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE opportunities IS
  'Core opportunity table. Each row is one tracked 1000x candidate with composite score, tier, and paywall-gated analysis.';

CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes: common query patterns
CREATE INDEX idx_opportunities_category       ON opportunities (category);
CREATE INDEX idx_opportunities_tier            ON opportunities (tier);
CREATE INDEX idx_opportunities_status          ON opportunities (status);
CREATE INDEX idx_opportunities_composite_score ON opportunities (composite_score DESC);
CREATE INDEX idx_opportunities_category_tier   ON opportunities (category, tier);
CREATE INDEX idx_opportunities_status_score    ON opportunities (status, composite_score DESC);

-- -------------------------------------------------------------------------
-- 3c. opportunity_signals — the 8-signal scores per opportunity
-- -------------------------------------------------------------------------
CREATE TABLE opportunity_signals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  signal_type     signal_type NOT NULL,
  score           NUMERIC(5,2) NOT NULL DEFAULT 0
                    CHECK (score >= 0 AND score <= 100),
  evidence        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each opportunity has exactly one row per signal type
  UNIQUE (opportunity_id, signal_type)
);
COMMENT ON TABLE opportunity_signals IS
  'Per-opportunity scores for each of the 8 Pattern Filter signals (0-100). One row per signal per opportunity.';

CREATE TRIGGER trg_opportunity_signals_updated_at
  BEFORE UPDATE ON opportunity_signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_signals_opportunity ON opportunity_signals (opportunity_id);
CREATE INDEX idx_signals_type_score  ON opportunity_signals (signal_type, score DESC);

-- -------------------------------------------------------------------------
-- 3d. entry_mechanisms — how to buy or gain exposure
-- -------------------------------------------------------------------------
CREATE TABLE entry_mechanisms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  type            entry_mechanism_type NOT NULL,
  platform        TEXT,
  pair_or_details TEXT,
  url             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE entry_mechanisms IS
  'Actionable entry points: token purchase pairs, mining pools, equity platforms, or airdrop instructions.';

CREATE TRIGGER trg_entry_mechanisms_updated_at
  BEFORE UPDATE ON entry_mechanisms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_entry_mechanisms_opportunity ON entry_mechanisms (opportunity_id);

-- -------------------------------------------------------------------------
-- 3e. risks — risk matrix per opportunity
-- -------------------------------------------------------------------------
CREATE TABLE risks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  probability     risk_probability NOT NULL DEFAULT 'medium',
  severity        risk_severity NOT NULL DEFAULT 'medium',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE risks IS
  'Risk register: each row is one identified risk with probability and severity ratings.';

CREATE TRIGGER trg_risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_risks_opportunity ON risks (opportunity_id);

-- -------------------------------------------------------------------------
-- 3f. catalysts — upcoming events that could trigger price movement
-- -------------------------------------------------------------------------
CREATE TABLE catalysts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,
  estimated_date  DATE,
  impact          impact_level NOT NULL DEFAULT 'medium',
  fired           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE catalysts IS
  'Upcoming catalysts: events with estimated dates and impact ratings. "fired" flips true once the event occurs.';

CREATE TRIGGER trg_catalysts_updated_at
  BEFORE UPDATE ON catalysts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_catalysts_opportunity     ON catalysts (opportunity_id);
CREATE INDEX idx_catalysts_estimated_date  ON catalysts (estimated_date) WHERE NOT fired;
CREATE INDEX idx_catalysts_unfired         ON catalysts (opportunity_id) WHERE NOT fired;

-- -------------------------------------------------------------------------
-- 3g. communities — social and community links per opportunity
-- -------------------------------------------------------------------------
CREATE TABLE communities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  url             TEXT NOT NULL,
  name            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE communities IS
  'Community links: Discord, Telegram, X/Twitter, GitHub, etc. per opportunity.';

CREATE TRIGGER trg_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_communities_opportunity ON communities (opportunity_id);

-- -------------------------------------------------------------------------
-- 3h. scout_signals — raw inbound signals from the SCOUT pipeline
-- -------------------------------------------------------------------------
CREATE TABLE scout_signals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source            TEXT NOT NULL,
  source_url        TEXT,
  category          opportunity_category,
  raw_summary       TEXT NOT NULL,
  related_projects  TEXT[],                     -- array of project names/slugs
  novelty_score     NUMERIC(5,2) DEFAULT 0
                      CHECK (novelty_score >= 0 AND novelty_score <= 100),
  urgency           impact_level NOT NULL DEFAULT 'low',
  status            scout_signal_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE scout_signals IS
  'Inbound intelligence from the SCOUT agent. Raw signals awaiting triage: pending -> processed | rejected.';

CREATE TRIGGER trg_scout_signals_updated_at
  BEFORE UPDATE ON scout_signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_scout_signals_status      ON scout_signals (status);
CREATE INDEX idx_scout_signals_category    ON scout_signals (category);
CREATE INDEX idx_scout_signals_created     ON scout_signals (created_at DESC);
CREATE INDEX idx_scout_signals_novelty     ON scout_signals (novelty_score DESC) WHERE status = 'pending';

-- -------------------------------------------------------------------------
-- 3i. weekly_briefs — weekly intelligence summaries
-- -------------------------------------------------------------------------
CREATE TABLE weekly_briefs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date              DATE NOT NULL UNIQUE,
  headline          TEXT NOT NULL,
  free_summary      TEXT NOT NULL,              -- visible to free tier
  full_content      TEXT,                       -- paywall-gated
  entries_added     INTEGER NOT NULL DEFAULT 0,
  entries_updated   INTEGER NOT NULL DEFAULT 0,
  entries_archived  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE weekly_briefs IS
  'Weekly intelligence briefs. free_summary is public; full_content is behind the $49/mo paywall.';

CREATE TRIGGER trg_weekly_briefs_updated_at
  BEFORE UPDATE ON weekly_briefs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_weekly_briefs_date ON weekly_briefs (date DESC);

-- -------------------------------------------------------------------------
-- 3j. graveyard_postmortems — post-mortems for dead opportunities
-- -------------------------------------------------------------------------
CREATE TABLE graveyard_postmortems (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id    UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  cause_of_death    TEXT NOT NULL,
  lessons           TEXT,
  post_mortem_text  TEXT,
  archived_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One post-mortem per opportunity
  UNIQUE (opportunity_id)
);
COMMENT ON TABLE graveyard_postmortems IS
  'Post-mortem analysis for opportunities that moved to graveyard status. Preserves lessons learned.';

CREATE TRIGGER trg_graveyard_postmortems_updated_at
  BEFORE UPDATE ON graveyard_postmortems
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_graveyard_opportunity ON graveyard_postmortems (opportunity_id);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security (RLS) Policies
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_signals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_mechanisms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalysts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_signals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_briefs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE graveyard_postmortems ENABLE ROW LEVEL SECURITY;

-- ---- Helper function: check if current user has pro or api subscription ----
CREATE OR REPLACE FUNCTION is_paid_subscriber()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND subscription_tier IN ('pro', 'api')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---- Helper function: check if current user is a service_role (admin) ----
-- In Supabase, service_role bypasses RLS entirely. These admin policies
-- use auth.jwt() to check for a custom 'admin' role claim as a secondary
-- mechanism for admin-level read from the client SDK.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'role',
      ''
    ) = 'service_role'
    OR coalesce(
      (current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'role'),
      ''
    ) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =========================================================================
-- 4a. profiles — users can only read/update their own row
-- =========================================================================
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin full access
CREATE POLICY profiles_admin ON profiles
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4b. opportunities — public read for free fields; paywall gating via view
-- =========================================================================
-- Everyone (including anon) can SELECT the row. Paywall gating is enforced
-- at the API/view layer: full_analysis is only returned to paid subscribers.
-- We use a Postgres VIEW below to enforce column-level gating cleanly.
CREATE POLICY opportunities_select_public ON opportunities
  FOR SELECT USING (true);

-- Only admins can INSERT/UPDATE/DELETE
CREATE POLICY opportunities_admin_write ON opportunities
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4c. opportunity_signals — public read, admin write
-- =========================================================================
CREATE POLICY signals_select_public ON opportunity_signals
  FOR SELECT USING (true);

CREATE POLICY signals_admin_write ON opportunity_signals
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4d. entry_mechanisms — public read, admin write
-- =========================================================================
CREATE POLICY entry_mechanisms_select_public ON entry_mechanisms
  FOR SELECT USING (true);

CREATE POLICY entry_mechanisms_admin_write ON entry_mechanisms
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4e. risks — public read, admin write
-- =========================================================================
CREATE POLICY risks_select_public ON risks
  FOR SELECT USING (true);

CREATE POLICY risks_admin_write ON risks
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4f. catalysts — public read, admin write
-- =========================================================================
CREATE POLICY catalysts_select_public ON catalysts
  FOR SELECT USING (true);

CREATE POLICY catalysts_admin_write ON catalysts
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4g. communities — public read, admin write
-- =========================================================================
CREATE POLICY communities_select_public ON communities
  FOR SELECT USING (true);

CREATE POLICY communities_admin_write ON communities
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4h. scout_signals — admin only (no public access)
-- =========================================================================
CREATE POLICY scout_signals_admin ON scout_signals
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4i. weekly_briefs — public read for free fields; paywall via view
-- =========================================================================
CREATE POLICY weekly_briefs_select_public ON weekly_briefs
  FOR SELECT USING (true);

CREATE POLICY weekly_briefs_admin_write ON weekly_briefs
  FOR ALL USING (is_admin());

-- =========================================================================
-- 4j. graveyard_postmortems — public read, admin write
-- =========================================================================
CREATE POLICY graveyard_select_public ON graveyard_postmortems
  FOR SELECT USING (true);

CREATE POLICY graveyard_admin_write ON graveyard_postmortems
  FOR ALL USING (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Paywall-Gated Views
-- ---------------------------------------------------------------------------
-- These views enforce column-level access control. The API layer should
-- query these views instead of the raw tables for user-facing reads.

-- Opportunities: redact full_analysis for free users
CREATE OR REPLACE VIEW opportunities_gated AS
SELECT
  id, slug, name, ticker, category, subcategory, tier,
  composite_score, one_liner,
  CASE
    WHEN is_paid_subscriber() THEN full_analysis
    ELSE NULL
  END AS full_analysis,
  market_cap, price_at_entry, ath, drawdown_from_ath,
  status, last_updated, created_at, updated_at
FROM opportunities;

COMMENT ON VIEW opportunities_gated IS
  'Paywall-gated view of opportunities. full_analysis is NULL for free-tier users.';

-- Weekly briefs: redact full_content for free users
CREATE OR REPLACE VIEW weekly_briefs_gated AS
SELECT
  id, date, headline, free_summary,
  CASE
    WHEN is_paid_subscriber() THEN full_content
    ELSE NULL
  END AS full_content,
  entries_added, entries_updated, entries_archived,
  created_at, updated_at
FROM weekly_briefs;

COMMENT ON VIEW weekly_briefs_gated IS
  'Paywall-gated view of weekly briefs. full_content is NULL for free-tier users.';

-- ---------------------------------------------------------------------------
-- 6. Composite Score Calculation Function
-- ---------------------------------------------------------------------------
-- Weights from the spec: toy_phase_dismissal=15%, working_code=20%,
-- ideological_community=10%, developer_activity_surge=15%,
-- smart_money_entry=15%, one_sentence_narrative=5%, hard_to_buy=5%,
-- catalyst_proximity=15%.

CREATE OR REPLACE FUNCTION calculate_composite_score(p_opportunity_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
BEGIN
  SELECT
    COALESCE(SUM(
      CASE s.signal_type
        WHEN 'toy_phase_dismissal'      THEN s.score * 0.15
        WHEN 'working_code'             THEN s.score * 0.20
        WHEN 'ideological_community'    THEN s.score * 0.10
        WHEN 'developer_activity_surge' THEN s.score * 0.15
        WHEN 'smart_money_entry'        THEN s.score * 0.15
        WHEN 'one_sentence_narrative'   THEN s.score * 0.05
        WHEN 'hard_to_buy'             THEN s.score * 0.05
        WHEN 'catalyst_proximity'       THEN s.score * 0.15
        ELSE 0
      END
    ), 0)
  INTO v_score
  FROM opportunity_signals s
  WHERE s.opportunity_id = p_opportunity_id;

  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_composite_score IS
  'Calculates the weighted composite score (0-100) from the 8 Pattern Filter signals for a given opportunity.';

-- ---------------------------------------------------------------------------
-- 7. Auto-recalculate composite score when signals change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_composite_on_signal_change()
RETURNS TRIGGER AS $$
DECLARE
  v_opp_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE and DELETE
  IF TG_OP = 'DELETE' THEN
    v_opp_id := OLD.opportunity_id;
  ELSE
    v_opp_id := NEW.opportunity_id;
  END IF;

  UPDATE opportunities
  SET composite_score = calculate_composite_score(v_opp_id),
      last_updated = NOW()
  WHERE id = v_opp_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_composite
  AFTER INSERT OR UPDATE OR DELETE ON opportunity_signals
  FOR EACH ROW EXECUTE FUNCTION recalculate_composite_on_signal_change();

-- ---------------------------------------------------------------------------
-- 8. Auto-create profile on new auth.users signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- 9. Useful Aggregate View: opportunity dashboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW opportunity_dashboard AS
SELECT
  o.id,
  o.slug,
  o.name,
  o.ticker,
  o.category,
  o.tier,
  o.composite_score,
  o.one_liner,
  o.status,
  o.market_cap,
  o.price_at_entry,
  o.drawdown_from_ath,
  o.last_updated,
  -- Count of unfired catalysts
  (SELECT COUNT(*) FROM catalysts c
   WHERE c.opportunity_id = o.id AND NOT c.fired) AS pending_catalysts,
  -- Count of risks
  (SELECT COUNT(*) FROM risks r
   WHERE r.opportunity_id = o.id) AS risk_count,
  -- Count of entry mechanisms
  (SELECT COUNT(*) FROM entry_mechanisms e
   WHERE e.opportunity_id = o.id) AS entry_count
FROM opportunities o
WHERE o.status = 'active'
ORDER BY o.composite_score DESC;

COMMENT ON VIEW opportunity_dashboard IS
  'Denormalized dashboard view for the main opportunity listing. Active opportunities sorted by composite score.';

-- ===========================================================================
-- END OF MIGRATION 001
-- ===========================================================================
