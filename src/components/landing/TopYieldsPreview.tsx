interface EarningsProtocol {
  readonly rank: number;
  readonly name: string;
  readonly symbol: string;
  readonly category: string;
  readonly earnings_yield_pct: number;
  readonly tier: string;
}

interface TopYieldsPreviewProps {
  readonly protocols: readonly EarningsProtocol[];
}

/** Format a number with commas and append %. */
function formatYield(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")}%`;
}

/** Single row in the yields table. */
function YieldRow({ protocol }: { readonly protocol: EarningsProtocol }) {
  const yieldColor =
    protocol.tier === "HYPERLIQUID-GRADE" ? "#34C759" : undefined;

  return (
    <tr className="border-t border-border">
      <td className="py-1.5 pr-3 text-text-tertiary">{protocol.rank}</td>
      <td className="py-1.5 pr-4 text-text-primary font-medium">
        {protocol.symbol}
      </td>
      <td className="py-1.5 pr-4" style={{ color: yieldColor }}>
        {formatYield(protocol.earnings_yield_pct)}
      </td>
      <td className="py-1.5 text-text-tertiary hidden md:table-cell">
        {protocol.category}
      </td>
    </tr>
  );
}

/** Mini earnings yield table showing the top 5 protocols by yield. */
export default function TopYieldsPreview({ protocols }: TopYieldsPreviewProps) {
  const top5 = protocols.slice(0, 5);
  if (top5.length === 0) return null;

  return (
    <section className="py-16 max-w-6xl mx-auto px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Top DeFi Yields
      </h2>
      <p className="text-text-secondary text-sm mt-2">
        Protocols earning more than their market cap
      </p>
      <div className="mt-6 bg-bg-card border border-border rounded-2xl p-5 overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="text-text-tertiary text-xs uppercase tracking-wider">
              <th className="text-left pb-2 pr-3">#</th>
              <th className="text-left pb-2 pr-4">Symbol</th>
              <th className="text-left pb-2 pr-4">Yield</th>
              <th className="text-left pb-2 hidden md:table-cell">Category</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((p) => (
              <YieldRow key={p.symbol} protocol={p} />
            ))}
          </tbody>
        </table>
      </div>
      <a
        href="/earnings/"
        className="text-text-secondary hover:text-text-primary text-sm transition mt-4 inline-block"
      >
        View all {protocols.length} protocols &rarr;
      </a>
    </section>
  );
}
