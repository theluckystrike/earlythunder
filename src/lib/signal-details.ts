/** Detailed descriptions for each of the 8 signals. Used on methodology page. */
export interface SignalDetailData {
  readonly key: string;
  readonly description: string;
  readonly example: string;
}

export const SIGNAL_DETAILS: readonly SignalDetailData[] = [
  {
    key: "working_code",
    description:
      "Evaluates whether the project has functional, deployed technology. Verified through GitHub analysis, on-chain data, and direct product testing. Vaporware scores low. Battle-tested production systems score high.",
    example: "A protocol with $1B+ TVL and 12 months of uptime scores 90+.",
  },
  {
    key: "dev_activity",
    description:
      "Tracks development velocity including commit frequency, contributor diversity, code quality metrics, and roadmap execution. Sustained high activity signals a healthy project.",
    example: "Weekly commits from 20+ contributors with consistent quality.",
  },
  {
    key: "smart_money",
    description:
      "Monitors where sophisticated capital is flowing before the crowd follows. Tracks venture funding rounds, whale wallet movements, and institutional filing data.",
    example: "Multiple Tier 1 VCs investing in consecutive rounds with increasing valuations.",
  },
  {
    key: "community",
    description:
      "Assesses organic community growth through genuine engagement metrics, not bot-inflated numbers. Tracks developer forums, social sentiment, and user retention patterns.",
    example: "Active GitHub discussions, organic social growth, and user-created content.",
  },
  {
    key: "catalyst",
    description:
      "Identifies specific near-term events that can convert latent value into realized returns. Catalysts include product launches, regulatory decisions, partnerships, and market structure changes.",
    example: "Upcoming mainnet launch, pending regulatory approval, or scheduled token unlock.",
  },
  {
    key: "narrative",
    description:
      "Evaluates whether there is a compelling, easily communicable story. The best investments have narratives that spread virally and create self-reinforcing adoption loops.",
    example: "'Digital gold' for Bitcoin, 'world computer' for Ethereum.",
  },
  {
    key: "valuation_gap",
    description:
      "Measures how cheap the asset is relative to the total addressable market it targets. A $5M project attacking a $500B market has extreme asymmetry. A $50B company in the same market does not. Calculated from market capitalization, fully diluted valuation, and comparable sector valuations.",
    example: "A $10M DeFi protocol targeting the $500B remittance market scores 85+. A $50B incumbent in the same space scores below 10.",
  },
  {
    key: "obscurity",
    description:
      "Measures how few people know about this opportunity. Tracks Google Trends volume, social media mentions, exchange listing count, and mainstream media coverage. The highest scores go to opportunities that sophisticated investors actively dismiss or have never heard of. When your Uber driver mentions it, the asymmetry is gone.",
    example: "A project known only in niche Discord communities with zero mainstream coverage scores 90+. A CNBC regular discussion topic scores below 20.",
  },
] as const;
