/** Detailed descriptions for each of the 8 signals. Used on methodology page. */
export interface SignalDetailData {
  readonly key: string;
  readonly description: string;
  readonly example: string;
}

export const SIGNAL_DETAILS: readonly SignalDetailData[] = [
  {
    key: "toy_phase",
    description:
      "Measures whether the technology or asset is still in its early, 'toy' phase, dismissed by incumbents but harboring transformative potential. High scores indicate maximum asymmetry windows where the crowd has not yet recognized the opportunity.",
    example: "The internet in 1995, smartphones in 2007, Bitcoin in 2012.",
  },
  {
    key: "working_code",
    description:
      "Evaluates whether the project has functional, deployed technology. Verified through GitHub analysis, on-chain data, and direct product testing. Vaporware scores low. Battle-tested production systems score high.",
    example: "A protocol with $1B+ TVL and 12 months of uptime scores 90+.",
  },
  {
    key: "community",
    description:
      "Assesses organic community growth through genuine engagement metrics, not bot-inflated numbers. Tracks developer forums, social sentiment, and user retention patterns.",
    example: "Active GitHub discussions, organic social growth, and user-created content.",
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
    key: "narrative",
    description:
      "Evaluates whether there is a compelling, easily communicable story. The best investments have narratives that spread virally and create self-reinforcing adoption loops.",
    example: "'Digital gold' for Bitcoin, 'world computer' for Ethereum.",
  },
  {
    key: "hard_to_buy",
    description:
      "Measures acquisition friction. If everyone can easily buy an asset, the asymmetry is usually gone. High friction creates opportunity for the diligent investor willing to put in the effort.",
    example: "Private market access only, complex on-chain interactions required, or geographic restrictions.",
  },
  {
    key: "catalyst",
    description:
      "Identifies specific near-term events that can convert latent value into realized returns. Catalysts include product launches, regulatory decisions, partnerships, and market structure changes.",
    example: "Upcoming mainnet launch, pending regulatory approval, or scheduled token unlock.",
  },
] as const;
