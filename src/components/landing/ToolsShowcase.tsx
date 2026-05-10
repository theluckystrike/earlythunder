interface ToolsShowcaseProps {
  readonly topYield: { name: string; symbol: string; yield_pct: number };
  readonly nearestDeadline: { protocol: string; end_date: string | null; urgency: string };
  readonly topScore: { name: string; score: number };
  readonly totalOpportunities: number;
}

interface ToolCard {
  readonly title: string;
  readonly liveData: string;
  readonly subtitle: string;
  readonly href: string;
  readonly accent: string;
}

function buildCards(props: ToolsShowcaseProps): readonly ToolCard[] {
  return [
    {
      title: "Convergence Signals",
      liveData: `${props.topScore.name} scored ${props.topScore.score}`,
      subtitle: "58 convergence events · 154+ protocols",
      href: "/intelligence/",
      accent: "#00d4aa",
    },
    {
      title: "Earnings Yield Scanner",
      liveData: `${props.topYield.symbol} · ${props.topYield.yield_pct}% yield`,
      subtitle: "24 Hyperliquid-grade protocols found",
      href: "/earnings/",
      accent: "#34C759",
    },
    {
      title: "Deadline Tracker",
      liveData: `${props.nearestDeadline.protocol} · ${props.nearestDeadline.urgency}`,
      subtitle: "23 active countdowns",
      href: "/deadlines/",
      accent: "#FF9F0A",
    },
    {
      title: "Research Library",
      liveData: "13 deep-dive analyses",
      subtitle: "Original research · 8,000+ words",
      href: "/research/",
      accent: "#3b82f6",
    },
  ] as const;
}

/** Live intelligence tools showcase -- 2x2 grid with real data previews. */
export default function ToolsShowcase(props: ToolsShowcaseProps) {
  const cards = buildCards(props);

  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Live Intelligence Tools
      </h2>
      <p className="text-text-secondary text-lg mt-4 max-w-2xl">
        Interactive data terminals. Updated daily from our autonomous pipeline.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <ToolPreviewCard key={card.href} tool={card} />
        ))}
      </div>
    </section>
  );
}

function ToolPreviewCard({ tool }: { readonly tool: ToolCard }) {
  return (
    <a
      href={tool.href}
      className="group bg-bg-card rounded-2xl border border-border hover:border-border-hover transition-all duration-200 overflow-hidden block"
    >
      <div className="h-1" style={{ background: tool.accent }} />
      <div className="p-6 md:p-8">
        <h3 className="text-text-primary text-xl font-semibold tracking-tight">
          {tool.title}
        </h3>
        <p className="font-mono text-sm mt-3" style={{ color: tool.accent }}>
          {tool.liveData}
        </p>
        <p className="text-text-secondary text-sm mt-2 leading-relaxed">
          {tool.subtitle}
        </p>
        <span className="text-text-secondary group-hover:text-text-primary text-sm transition mt-5 inline-block">
          Explore &rarr;
        </span>
      </div>
    </a>
  );
}
