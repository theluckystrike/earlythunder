/**
 * What each of the 25 scored variables measures, and what a high score means.
 *
 * These are definitions of the framework, not measurements of any token, which
 * is why they are written here rather than derived. Every variable runs 1 to 10
 * and higher is always better, so a 10 on Supply Inflation means low issuance
 * and a 10 on Insider Selling means insiders are not selling.
 *
 * Wording avoids the two words the humanize gate bans.
 */

export interface SignalDefinition {
  /** Matches the variable key in data/scorecard-signals.json. */
  readonly key: string;
  /** What the variable measures, in one sentence. */
  readonly measures: string;
  /** What separates a 9 or 10 from a 1 or 2. */
  readonly scale: string;
  /** Why an investor should care, stated as the decision it informs. */
  readonly matters: string;
  /** The long-tail question this page answers. Used in the FAQ block. */
  readonly question: string;
}

export const SIGNAL_DEFINITIONS: readonly SignalDefinition[] = [
  {
    key: "protocol_revenue",
    measures:
      "Fees the protocol actually collects, in dollars, judged against the size of the asset rather than in isolation.",
    scale:
      "A 10 means hundreds of millions a year in verifiable fees. A 1 means the protocol collects nothing a third party can measure.",
    matters:
      "Revenue is the only input on the framework that cannot be manufactured by a marketing budget. It is the first filter.",
    question: "Which crypto protocols earn the most revenue?",
  },
  {
    key: "revenue_trend",
    measures: "The direction and slope of those fees over the trailing periods the sources publish.",
    scale:
      "A 10 means revenue is compounding quarter over quarter. A 1 means it has collapsed from an earlier peak.",
    matters:
      "A large but falling revenue line and a small but doubling one are different assets. The level alone hides that.",
    question: "Which crypto protocols have growing revenue?",
  },
  {
    key: "ps_multiple",
    measures: "Market capitalisation divided by annualised protocol revenue, scored so cheap ranks high.",
    scale:
      "A 10 means the asset trades at a low multiple of the cash it produces. A 1 means the multiple is extreme or undefined because revenue is near zero.",
    matters:
      "Nothing else in the set comes as close to a valuation, and no other variable disagrees with price momentum as often.",
    question: "Which crypto tokens have the lowest price to sales ratio?",
  },
  {
    key: "supply_inflation",
    measures: "How fast new units enter circulation through issuance, emissions or rewards.",
    scale:
      "A 10 means flat or shrinking supply. A 1 means issuance heavy enough to swamp any demand the protocol generates.",
    matters:
      "Issuance is a transfer from holders to whoever receives the new units. It sets the return the asset has to clear before a holder is even.",
    question: "Which crypto tokens have the lowest inflation?",
  },
  {
    key: "unlock_schedule",
    measures:
      "The size and timing of scheduled releases still ahead, from team, investor and treasury allocations.",
    scale:
      "A 10 means the vesting is done or immaterial. A 1 means large cliffs are still to come at prices far below where insiders bought.",
    matters:
      "A scheduled release is the one piece of future selling pressure that is knowable in advance, and it is routinely ignored.",
    question: "Which crypto tokens have no token vesting left?",
  },
  {
    key: "circ_fdv_ratio",
    measures: "Circulating supply as a share of eventual supply.",
    scale:
      "A 10 means effectively everything is already trading. A 1 means most of the eventual supply has yet to enter circulation.",
    matters:
      "The gap between market cap and fully diluted valuation is the discount the market is quietly ignoring, or the overhang it is quietly carrying.",
    question: "Which crypto tokens are fully circulating?",
  },
  {
    key: "buyback_burn",
    measures: "Whether protocol cash flow is returned to holders through buybacks or burns, and at what rate.",
    scale:
      "A 10 means a large, mechanical, verifiable share of revenue is used to retire supply. A 1 means none of it is.",
    matters:
      "Without it, protocol revenue accrues to a treasury rather than to a token holder. It is the mechanism that connects the two.",
    question: "Which crypto tokens buy back or burn their supply?",
  },
  {
    key: "smart_money",
    measures:
      "Where informed capital is positioned, read from funding rounds, disclosed institutional holdings and tracked wallets.",
    scale:
      "A 10 means repeat accumulation by funds with a real record. A 1 means the informed money has left or was never there.",
    matters:
      "Smart money is early by construction. The variable is a lead indicator on everything else in the framework.",
    question: "Which crypto tokens are smart money buying?",
  },
  {
    key: "insider_selling",
    measures: "Observed selling by teams, treasuries and early investors.",
    scale:
      "A 10 means insiders are holding or adding. A 1 means sustained, documented distribution into the market.",
    matters:
      "Insiders know the roadmap. Persistent selling by people with better information is the cheapest bear case available.",
    question: "Which crypto teams are selling their own tokens?",
  },
  {
    key: "holder_concentration",
    measures: "How much of the supply sits in the largest wallets.",
    scale:
      "A 10 means a broad, distributed base. A 1 means a handful of addresses could move the price at will.",
    matters:
      "Concentration decides whether the order book you are trading against is a market or a single decision-maker.",
    question: "Which crypto tokens have the most concentrated holders?",
  },
  {
    key: "staking_yield",
    measures: "Staking return after subtracting the issuance that funds it, so only the real part counts.",
    scale:
      "A 10 means a yield paid from fees that a non-staker is not diluted to provide. A 1 means a headline yield that is issuance wearing a hat.",
    matters:
      "Most published staking yields are gross. Net of issuance, a large share of them are close to zero.",
    question: "Which crypto tokens pay a real staking yield?",
  },
  {
    key: "tvl_trend",
    measures: "The direction of value locked in the protocol, not its level.",
    scale:
      "A 10 means capital is arriving consistently. A 1 means it is leaving and has been for some time.",
    matters:
      "Deposits are the one user behaviour that costs the user something, so the trend is harder to fake than any engagement metric.",
    question: "Which crypto protocols are gaining TVL?",
  },
  {
    key: "active_users",
    measures: "Real addresses using the protocol, filtered for the obvious forms of inflation.",
    scale:
      "A 10 means a large, retained user base. A 1 means near-zero use or activity that does not survive a filter.",
    matters:
      "Users are what revenue is made of. A protocol with revenue and no users has a counterparty problem it has not disclosed yet.",
    question: "Which crypto protocols have the most active users?",
  },
  {
    key: "developer_activity",
    measures: "Sustained engineering: contributor count, commit cadence and whether the roadmap ships.",
    scale:
      "A 10 means a deep, diverse, active contributor base. A 1 means an archive that has not moved in months.",
    matters:
      "Development is the leading indicator with the longest lead time. It turns before users do, in both directions.",
    question: "Which crypto projects have the most developers?",
  },
  {
    key: "ecosystem_growth",
    measures: "Whether other teams are building on the network and whether that set is expanding.",
    scale:
      "A 10 means a widening base of independent projects that depend on it. A 1 means nothing is built on top.",
    matters:
      "Networks other people build on are hard to displace. Networks nobody builds on are one better product away from irrelevance.",
    question: "Which crypto networks are growing fastest?",
  },
  {
    key: "market_share",
    measures: "The share of its own category the protocol holds, and the direction of that share.",
    scale:
      "A 10 means clear category leadership. A 1 means a rounding error in a market someone else owns.",
    matters:
      "Category share is what decides whether a protocol sets pricing or accepts it.",
    question: "Which crypto protocols lead their category?",
  },
  {
    key: "competitive_moat",
    measures: "What stops a funded team from copying the protocol and taking its users.",
    scale:
      "A 10 means liquidity, distribution or switching costs that a fork does not inherit. A 1 means the product is the code and the code is public.",
    matters:
      "In an industry where the source is open, the moat is never the software. It is worth checking what is left.",
    question: "Which crypto protocols have a real moat?",
  },
  {
    key: "institutional_adoption",
    measures: "Regulated exposure: funds, listed vehicles, disclosed corporate holdings and custody support.",
    scale:
      "A 10 means live regulated products and disclosed institutional positions. A 1 means no regulated access at all.",
    matters:
      "Institutional access changes who the marginal buyer is, and that changes how the asset trades in a drawdown.",
    question: "Which crypto tokens do institutions actually hold?",
  },
  {
    key: "exchange_depth",
    measures: "Where the asset trades, and how much size the book absorbs before it moves.",
    scale:
      "A 10 means deep books on major venues. A 1 means one thin pair and a spread that punishes any real order.",
    matters:
      "Depth is the difference between a paper return and one you can realise. It is the variable that decides your exit.",
    question: "Which crypto tokens have the deepest liquidity?",
  },
  {
    key: "regulatory_safety",
    measures: "Exposure to securities classification, enforcement history and the standing of the issuing entity.",
    scale:
      "A 10 means a settled classification or a structure with no obvious attack surface. A 1 means live enforcement risk.",
    matters:
      "Regulatory outcomes are binary and they do not respect fundamentals. No other variable can zero a position outright.",
    question: "Which crypto tokens are safest from regulation?",
  },
  {
    key: "catalyst_calendar",
    measures: "Dated, verifiable events ahead that could change the asset's standing.",
    scale:
      "A 10 means several concrete near-term catalysts on the record. A 1 means nothing scheduled and nothing pending.",
    matters:
      "Fundamentals decide whether an asset is cheap. Catalysts decide when the market is forced to agree.",
    question: "Which crypto tokens have catalysts coming?",
  },
  {
    key: "btc_alpha",
    measures: "Whether the asset has historically produced a return above Bitcoin rather than a levered copy of it.",
    scale:
      "A 10 means a real record of outperformance. A 1 means it falls harder and recovers less, every cycle.",
    matters:
      "Bitcoin is the benchmark an altcoin position has to beat. Most do not, and the ones that do not are easy to identify in advance.",
    question: "Which altcoins outperform Bitcoin?",
  },
  {
    key: "team_execution",
    measures: "Whether the team ships what it said it would ship, on something close to the stated timeline.",
    scale:
      "A 10 means a documented record of delivery. A 1 means missed dates, pivots and departures.",
    matters:
      "Every other forward-looking variable is a bet on this one. A roadmap is only worth the team's record of keeping them.",
    question: "Which crypto teams actually deliver?",
  },
  {
    key: "treasury_runway",
    measures: "How long the treasury funds operations at the current burn, and how exposed it is to its own token.",
    scale:
      "A 10 means years of runway held in assets that are not the project's own token. A 1 means months, in the token itself.",
    matters:
      "A treasury denominated in its own token is a seller in the exact drawdown where selling hurts most.",
    question: "Which crypto projects have the longest treasury runway?",
  },
  {
    key: "social_mindshare",
    measures: "Attention: how much of the conversation the asset holds, and whether that share is rising.",
    scale:
      "A 10 means a live, growing audience. A 1 means an asset nobody is discussing.",
    matters:
      "Attention is the last thing to arrive and the first to leave. Read high scores as a warning as often as a strength.",
    question: "Which crypto tokens have the most attention?",
  },
] as const;

const MAX_DEFINITIONS = 60;

/** The definition for one variable key. Null when the key is not defined here. */
export function getSignalDefinition(key: string): SignalDefinition | null {
  if (typeof key !== "string" || key.length === 0) return null;
  if (SIGNAL_DEFINITIONS.length === 0) return null;
  for (let i = 0; i < SIGNAL_DEFINITIONS.length && i < MAX_DEFINITIONS; i += 1) {
    if (SIGNAL_DEFINITIONS[i].key === key) return SIGNAL_DEFINITIONS[i];
  }
  return null;
}
