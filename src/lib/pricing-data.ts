/** Features available on the free tier. */
export const FREE_FEATURES = [
  "Browse all opportunities",
  "View names, tickers, and scores",
  "Tier badges and one-liner summaries",
  "Graveyard access",
  "Blog access",
] as const;

/** Features exclusive to premium tier. */
export const PREMIUM_ONLY_FEATURES = [
  "Full thesis and deep analysis",
  "8-Signal radar charts",
  "Detailed signal breakdown scores",
  "Catalyst and risk analysis",
  "Related opportunity mapping",
  "Weekly research reports",
  "Early access to new opportunities",
] as const;

/** Feature matrix rows for the comparison table. */
export const MATRIX_ROWS = [
  { feature: "Opportunity Directory", free: true },
  { feature: "Composite Scores", free: true },
  { feature: "Tier Badges", free: true },
  { feature: "One-Liner Summaries", free: true },
  { feature: "Full Thesis & Analysis", free: false },
  { feature: "8-Signal Radar Charts", free: false },
  { feature: "Signal Breakdown Scores", free: false },
  { feature: "Catalyst Tracking", free: false },
  { feature: "Risk Analysis", free: false },
  { feature: "Related Opportunities", free: false },
  { feature: "Weekly Research Reports", free: false },
  { feature: "Priority New Listings", free: false },
] as const;

/** FAQ items for the pricing page. */
export const FAQ_ITEMS = [
  {
    q: "Is this financial advice?",
    a: "No. Early Thunder provides research and analysis for informational purposes only. We surface signals — you make the investment decisions. Always do your own research and consult a financial advisor.",
  },
  {
    q: "How often are opportunities updated?",
    a: "Our automated pipeline monitors signals continuously. Opportunity scores and analyses are updated at least weekly, with major signal changes triggering immediate re-evaluation.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Premium subscriptions can be cancelled at any time. Your access continues through the end of your billing period. No long-term contracts.",
  },
  {
    q: "What asset classes do you cover?",
    a: "We cover three asset classes: digital assets (crypto, tokens, protocols), public equities (stocks, ETFs), and private markets (pre-IPO, venture-backed companies).",
  },
] as const;
