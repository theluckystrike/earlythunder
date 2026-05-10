/**
 * All features available during the open alpha period.
 * Previously split into free/premium tiers -- now everything is open.
 */
export const ALPHA_FEATURES = [
  "Browse all opportunities",
  "View names, tickers, and scores",
  "Tier badges and one-liner summaries",
  "Graveyard access",
  "Blog access",
  "Full thesis and deep analysis",
  "8-Signal radar charts",
  "Detailed signal breakdown scores",
  "Catalyst and risk analysis",
  "Related opportunity mapping",
  "Weekly research reports",
  "Early access to new opportunities",
] as const;

/** Feature matrix rows -- all features available during open alpha. */
export const MATRIX_ROWS = [
  { feature: "Opportunity Directory", included: true },
  { feature: "Composite Scores", included: true },
  { feature: "Tier Badges", included: true },
  { feature: "One-Liner Summaries", included: true },
  { feature: "Full Thesis & Analysis", included: true },
  { feature: "8-Signal Radar Charts", included: true },
  { feature: "Signal Breakdown Scores", included: true },
  { feature: "Catalyst Tracking", included: true },
  { feature: "Risk Analysis", included: true },
  { feature: "Related Opportunities", included: true },
  { feature: "Weekly Research Reports", included: true },
  { feature: "Priority New Listings", included: true },
] as const;

/** FAQ items for the pricing page. */
export const FAQ_ITEMS = [
  {
    q: "Is everything really free right now?",
    a: "Yes. During the open alpha period, every feature on Early Thunder is completely free -- no credit card, no trial limits, no paywalls. We are building in public and want early users to experience the full platform. Premium tiers will be introduced later, but alpha users get everything at no cost.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Early Thunder provides research and analysis for informational purposes only. The platform surfaces signals. You make the investment decisions. Always do your own research and consult a financial advisor.",
  },
  {
    q: "How often are opportunities updated?",
    a: "The automated pipeline monitors signals continuously. Opportunity scores and analyses are updated at least weekly, with major signal changes triggering immediate re-evaluation.",
  },
  {
    q: "Will there be paid plans later?",
    a: "Yes. We plan to introduce premium tiers once the platform matures. Early alpha users will be the first to know about pricing changes and may receive preferential rates. For now, enjoy full access at no cost.",
  },
  {
    q: "What asset classes do you cover?",
    a: "Early Thunder covers three asset classes. Digital assets (crypto, tokens, protocols), public equities (stocks, ETFs), and private markets (pre-IPO, venture-backed companies).",
  },
] as const;
