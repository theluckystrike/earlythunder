import Link from "next/link";

interface ToolCard {
  readonly title: string;
  readonly stats: string;
  readonly description: string;
  readonly href: string;
  readonly accent: string;
}

const TOOLS: readonly ToolCard[] = [
  {
    title: "Convergence Signals",
    stats: "58 events detected across 154+ protocols",
    description: "Live market regime, smart money flows, stablecoin heatmap, and research library.",
    href: "/intelligence/",
    accent: "#00d4aa",
  },
  {
    title: "Earnings Yield Scanner",
    stats: "131 protocols scanned \u00b7 24 Hyperliquid-grade",
    description: "Sortable DeFi yield table. Filter by tier, sort by yield, revenue, TVL.",
    href: "/earnings/",
    accent: "#34C759",
  },
  {
    title: "Deadline Tracker",
    stats: "24 active deadlines \u00b7 Live countdowns",
    description: "Airdrop snapshots, token launches, farming windows. Color-coded urgency.",
    href: "/deadlines/",
    accent: "#FF9F0A",
  },
  {
    title: "Research Library",
    stats: "13 deep-dive analyses \u00b7 8,000+ words",
    description: "Original research on exploits, tokenless protocols, convergence opportunities.",
    href: "/research/",
    accent: "#3b82f6",
  },
] as const;

/** Live intelligence tools showcase -- 2x2 grid of tool preview cards. */
export default function ToolsShowcase() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Live Intelligence Tools
      </h2>
      <p className="text-text-secondary text-lg mt-4 max-w-2xl">
        Interactive data terminals. Updated daily from our autonomous pipeline.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <ToolPreviewCard key={tool.href} tool={tool} />
        ))}
      </div>
    </section>
  );
}

function ToolPreviewCard({ tool }: { readonly tool: ToolCard }) {
  return (
    <Link
      href={tool.href}
      className="group bg-bg-card rounded-2xl border border-border hover:border-border-hover transition-all duration-200 overflow-hidden block"
    >
      <div className="h-1" style={{ background: tool.accent }} />
      <div className="p-6 md:p-8">
        <h3 className="text-text-primary text-xl font-semibold tracking-tight">
          {tool.title}
        </h3>
        <p className="font-mono text-sm mt-3" style={{ color: tool.accent }}>
          {tool.stats}
        </p>
        <p className="text-text-secondary text-sm mt-3 leading-relaxed">
          {tool.description}
        </p>
        <span className="text-text-secondary group-hover:text-text-primary text-sm transition mt-5 inline-block">
          Explore &rarr;
        </span>
      </div>
    </Link>
  );
}
