/**
 * What each screen asks and why the thresholds are where they are.
 *
 * These are statements about the filter, not measurements of its members, so
 * they are written here rather than derived. Every number quoted is the
 * threshold itself, which is set in scripts/build-longtail-layer.mjs.
 */

export interface ScreenCopy {
  readonly slug: string;
  /** The question a reader would type. Used in the title and the FAQ. */
  readonly question: string;
  /** The rule in plain words. */
  readonly rule: string;
  /** Why this filter is worth running, and where it misleads. */
  readonly why: string;
}

export const SCREEN_COPY: readonly ScreenCopy[] = [
  {
    slug: "real-revenue-cheap",
    question: "Which crypto tokens earn real revenue and score well on price to sales?",
    rule: "Protocol Revenue 6 or better and P/S Multiple 6 or better. Both are 1-to-10 bands scored against the rated universe, not absolute figures, so a 6 on P/S means cheap relative to the set rather than below any particular multiple.",
    why: "Revenue alone finds the big protocols and the ratio alone finds the broken ones. Together they find the narrow set that earns money and is not already priced for it. Read the band as a ranking against peers, and check the protocol's own reported revenue before treating it as a valuation.",
  },
  {
    slug: "no-vesting-overhang",
    question: "Which crypto tokens have no vesting left?",
    rule: "Circulating / FDV Ratio 9 or better and Vesting Schedule 8 or better.",
    why: "A scheduled release is the one piece of future selling pressure that is knowable in advance. Tokens on this list have almost none of it ahead, so their price has to be justified by demand rather than absorbed against a cliff.",
  },
  {
    slug: "buyback-and-burn",
    question: "Which crypto tokens buy back or burn their own supply?",
    rule: "Buyback and Burn 7 or better.",
    why: "Without it, protocol revenue accrues to a treasury rather than to a token holder. The universe median is 2 of 10, so a 7 is genuinely unusual rather than a rounding difference.",
  },
  {
    slug: "real-staking-yield",
    question: "Which crypto tokens pay a real staking yield?",
    rule: "Real Staking Yield 7 or better.",
    why: "Most published staking yields are gross. Net of the issuance that funds them a large share are close to zero. This variable is scored after that subtraction, so it finds yield a non-staker is not diluted to provide.",
  },
  {
    slug: "builder-momentum",
    question: "Which crypto networks have the most developer momentum?",
    rule: "Developer Activity 7 or better and Network Growth 7 or better.",
    why: "Development turns before users do, in both directions. Pairing it with network growth separates a busy repository from a network other people are actually building on.",
  },
  {
    slug: "cash-generating",
    question: "Which crypto protocols have growing revenue?",
    rule: "Protocol Revenue 7 or better and Revenue Trend 6 or better.",
    why: "A large but falling revenue line and a small but compounding one are different assets. Reading the level and the direction together is the only way the number means anything.",
  },
  {
    slug: "moat-and-share",
    question: "Which crypto protocols lead their category and can defend it?",
    rule: "Competitive Moat 7 or better and Market Share 7 or better.",
    why: "In an industry where the source is open the moat is never the software. Share without a moat is a fork away from gone, and a moat without share is a claim nobody has tested.",
  },
  {
    slug: "regulatory-safe-harbour",
    question: "Which crypto tokens are least exposed to regulation?",
    rule: "Regulatory Safety 8 or better.",
    why: "Regulatory outcomes are binary and they do not respect fundamentals. No other variable can zero a position outright, which is why this one is worth screening on alone. Read it as the least exposed of the rated set rather than as a safe harbour: some scores rest on sources published by the project itself, and a regulatory position can change with a single filing.",
  },
  {
    slug: "survivors-deep-drawdown",
    question: "Which beaten-down crypto tokens still have good fundamentals?",
    rule: "Down 85% or more from the all-time high, with a composite of 110 or better.",
    why: "A deep drawdown is not a thesis. Pairing it with a composite that still clears the middle of the universe separates the ones the market repriced from the ones that stopped working. Recovering the high is a multiple, not a percentage, and each page states the multiple.",
  },
  {
    slug: "small-cap-quality",
    question: "Which small cap crypto tokens clear the framework?",
    rule: "Market capitalisation under $500M with a composite of 120 or better.",
    why: "Score and size are uncorrelated inside a size band, so a small capitalisation says nothing about quality either way. The framework and the market disagree most here, and the disagreement is the entire reason to look.",
  },
];

const MAX_COPY = 60;

/** Copy for one screen. Null when the slug has no entry. */
export function getScreenCopy(slug: string): ScreenCopy | null {
  if (typeof slug !== "string" || slug.length === 0) return null;
  for (let i = 0; i < SCREEN_COPY.length && i < MAX_COPY; i += 1) {
    if (SCREEN_COPY[i].slug === slug) return SCREEN_COPY[i];
  }
  return null;
}
