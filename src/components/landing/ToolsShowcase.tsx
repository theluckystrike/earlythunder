/* ─── Types ─── */

interface ToolsBentoProps {
  readonly topScores: readonly { name: string; ticker: string; score: number; yield?: string }[];
  readonly topDeadlines: readonly { name: string; daysLeft: string; urgency: string }[];
  readonly topResearch: readonly { title: string; date: string; words: string }[];
  readonly totalOpportunities: number;
}

interface ToolDef {
  readonly name: string;
  readonly count: string;
  readonly headline: string;
  readonly href: string;
  readonly size: "large" | "medium";
}

/* ─── Tool Definitions ─── */

function buildTools(total: number): readonly ToolDef[] {
  return [
    {
      name: "Convergence Signals",
      count: `${total} active`,
      headline: "Multi-factor scoring · daily refresh",
      href: "/intelligence/",
      size: "large",
    },
    {
      name: "Earnings Yield Scanner",
      count: "24 protocols",
      headline: "Real yield · fee revenue · buybacks",
      href: "/earnings/",
      size: "medium",
    },
    {
      name: "Deadline Tracker",
      count: "23 countdowns",
      headline: "TGE · open · snapshot deadlines",
      href: "/deadlines/",
      size: "medium",
    },
    {
      name: "Research Library",
      count: "13 analyses",
      headline: "Original research · 8,000+ words avg",
      href: "/research/",
      size: "medium",
    },
  ] as const;
}

/* ─── MiniTable (Convergence) ─── */

function MiniTable(
  { rows }: { readonly rows: readonly { name: string; ticker: string; score: number; yield?: string }[] },
) {
  const display = rows.slice(0, 4);

  return (
    <div className="mini-table">
      <div className="mini-table__row mini-table__row--head">
        <span>#</span>
        <span>SYMBOL</span>
        <span>YIELD</span>
        <span>SCORE</span>
      </div>
      {display.map((row, idx) => (
        <div key={row.ticker} className="mini-table__row">
          <span>{String(idx + 1).padStart(2, "0")}</span>
          <span>{row.ticker}</span>
          <span>{row.yield ?? ", "}</span>
          <span>{row.score}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── MiniSparkline (Earnings) ─── */

function MiniSparkline() {
  const points = [12, 18, 14, 22, 19, 28, 24, 32, 29, 35, 31, 38];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 60;
  const w = 200;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * h;
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");
  const fillPath = `M0,${h} L${coords.join(" L")} L${w},${h} Z`;

  return (
    <div className="mini-spark">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="60">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-score-high)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-score-high)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#spark-fill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-score-high)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/* ─── MiniCountdown (Deadlines) ─── */

function MiniCountdown(
  { rows }: { readonly rows: readonly { name: string; daysLeft: string; urgency: string }[] },
) {
  const display = rows.slice(0, 3);

  function urgencyColor(urgency: string): string {
    if (urgency === "critical") return "var(--color-negative, #EF4444)";
    if (urgency === "warning") return "var(--color-warning, #EAB308)";
    return "var(--color-positive, #22C55E)";
  }

  return (
    <div className="mini-countdown">
      {display.map((row) => (
        <div key={row.name} className="mini-countdown__row">
          <span className="mini-countdown__name">{row.name}</span>
          <span style={{ color: urgencyColor(row.urgency) }}>{row.daysLeft}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── MiniResearch (Research Library) ─── */

function MiniResearch(
  { rows }: { readonly rows: readonly { title: string; date: string; words: string }[] },
) {
  const display = rows.slice(0, 3);

  return (
    <div className="mini-research">
      {display.map((row) => (
        <div key={row.title} className="mini-research__row">
          <span className="mini-research__title">{row.title}</span>
          <span className="mini-research__meta">{row.date} &middot; {row.words}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── ToolCard ─── */

function ToolCard(
  { tool, children }: { readonly tool: ToolDef; readonly children: React.ReactNode },
) {
  const sizeClass = tool.size === "large" ? "tool--large" : "tool--medium";

  return (
    <a href={tool.href} className={`tool ${sizeClass}`}>
      <div className="tool__head">
        <div>
          <span className="tool__name">{tool.name}</span>
          <span className="tool__count">{tool.count}</span>
        </div>
        <span className="tool__live">&#9679; LIVE</span>
      </div>
      <div className="tool__preview">
        {children}
      </div>
      <div className="tool__foot">
        <span className="tool__head-line">{tool.headline}</span>
        <span className="tool__cta">Explore &rarr;</span>
      </div>
    </a>
  );
}

/* ─── ToolsBento (main export) ─── */

export default function ToolsShowcase({
  topScores,
  topDeadlines,
  topResearch,
  totalOpportunities,
}: ToolsBentoProps) {
  const tools = buildTools(totalOpportunities);

  return (
    <section className="bento-section">
      <div className="section__head">
        <div>
          <div className="section__eyebrow mono">01, TERMINAL</div>
          <h2 className="section__title">Live intelligence tools</h2>
          <p className="section__sub">
            Four interactive data terminals. Updated daily from our autonomous research pipeline.
          </p>
        </div>
        <a className="ghost-btn" href="/intelligence/">View all tools <span className="arr">&rarr;</span></a>
      </div>
      <div className="bento">
        <ToolCard tool={tools[0]}>
          <MiniTable rows={topScores} />
        </ToolCard>
        <ToolCard tool={tools[1]}>
          <MiniSparkline />
        </ToolCard>
        <ToolCard tool={tools[2]}>
          <MiniCountdown rows={topDeadlines} />
        </ToolCard>
        <ToolCard tool={tools[3]}>
          <MiniResearch rows={topResearch} />
        </ToolCard>
      </div>
    </section>
  );
}
