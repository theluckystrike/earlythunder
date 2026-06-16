"use client";

import { useState, useMemo } from "react";

/* ─── Types ─── */

interface Protocol {
  readonly rank: number;
  readonly name: string;
  readonly symbol: string;
  readonly category: string;
  readonly earnings_yield_pct: number;
  readonly annualized_revenue: number;
  readonly mcap: number;
}

interface YieldsTableProps {
  readonly protocols: readonly Protocol[];
}

type SortKey = "rank" | "symbol" | "category" | "mcap" | "annualized_revenue" | "earnings_yield_pct";
type SortDir = "asc" | "desc";

/* ─── Filter Categories ─── */

const FILTER_CHIPS: readonly { readonly label: string; readonly match: string }[] = [
  { label: "All", match: "All" },
  { label: "Dexs", match: "Dexs" },
  { label: "Lending", match: "Lending" },
  { label: "Liquidity Mgr", match: "Liquidity Manager" },
  { label: "Interface", match: "Interface" },
  { label: "Yield Agg", match: "Yield Aggregator" },
] as const;

/* ─── Format Helpers (pure) ─── */

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${(value / 1_000).toFixed(0)}K`;
}

function formatYield(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/* ─── Sparkline Helpers (pure) ─── */

function generatePoints(rank: number): number[] {
  const pts: number[] = [];
  let seed = rank * 7919;
  for (let i = 0; i < 14; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    pts.push((seed % 100) / 100);
  }
  return pts;
}

function buildSparkPath(points: number[]): string {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / 13) * 78;
      const y = 20 - ((p - min) / range) * 18;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* ─── MiniRow Sparkline ─── */

function MiniRow({ rank }: { readonly rank: number }) {
  const points = useMemo(() => generatePoints(rank), [rank]);
  const trendUp = points[points.length - 1] > points[0];
  const stroke = trendUp ? "var(--color-positive)" : "var(--color-negative)";
  const d = buildSparkPath(points);

  return (
    <svg className="mini-row" width="78" height="22" viewBox="0 0 78 22" fill="none">
      <path d={d} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Sort Indicator ─── */

function SortIndicator({ active, dir }: { readonly active: boolean; readonly dir: SortDir }) {
  if (!active) return null;
  return <span aria-hidden="true">{dir === "desc" ? " \u25BE" : " \u25B4"}</span>;
}

/* ─── Table Header Cell ─── */

function Th({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
}: {
  readonly label: string;
  readonly sortKey: SortKey;
  readonly activeKey: SortKey;
  readonly activeDir: SortDir;
  readonly onSort: (key: SortKey) => void;
}) {
  return (
    <th onClick={() => onSort(sortKey)} style={{ cursor: "pointer" }}>
      {label}
      <SortIndicator active={activeKey === sortKey} dir={activeDir} />
    </th>
  );
}

/* ─── Table Row ─── */

function YieldRow({ protocol }: { readonly protocol: Protocol }) {
  const hue = (protocol.rank * 137) % 360;
  const avatarColor = `hsl(${hue}, 60%, 55%)`;

  return (
    <tr>
      <td>{protocol.rank}</td>
      <td>
        <span className="sym-cell">
          <span className="sym-cell__avatar" style={{ background: avatarColor }} />
          <span className="sym-cell__sym">{protocol.symbol}</span>
        </span>
      </td>
      <td>{protocol.category}</td>
      <td>{formatCompact(protocol.mcap)}</td>
      <td>{formatCompact(protocol.annualized_revenue)}</td>
      <td className="yield-cell">{formatYield(protocol.earnings_yield_pct)}</td>
      <td><MiniRow rank={protocol.rank} /></td>
    </tr>
  );
}

/* ─── Compare (sort helper) ─── */

function compareValues(a: Protocol, b: Protocol, key: SortKey, dir: SortDir): number {
  let aVal: string | number = a[key];
  let bVal: string | number = b[key];

  if (typeof aVal === "string" && typeof bVal === "string") {
    const cmp = aVal.localeCompare(bVal);
    return dir === "asc" ? cmp : -cmp;
  }

  aVal = aVal as number;
  bVal = bVal as number;
  return dir === "asc" ? aVal - bVal : bVal - aVal;
}

/* ─── Main Component ─── */

export default function TopYieldsPreview({ protocols }: YieldsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("earnings_yield_pct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    if (activeFilter === "All") return protocols;
    const chip = FILTER_CHIPS.find((c) => c.label === activeFilter);
    const match = chip ? chip.match : activeFilter;
    return protocols.filter((p) => p.category === match);
  }, [protocols, activeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compareValues(a, b, sortKey, sortDir));
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <section className="section">
      <SectionHeader count={sorted.length} total={protocols.length} />
      <FilterChips active={activeFilter} onSelect={setActiveFilter} />
      <div className="table-wrap table-wrap--striped">
        <table className="data-table">
          <thead>
            <tr>
              <Th label="#" sortKey="rank" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <Th label="SYMBOL" sortKey="symbol" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <Th label="CATEGORY" sortKey="category" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <Th label="MARKET CAP" sortKey="mcap" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <Th label="ANNUALIZED REV" sortKey="annualized_revenue" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <Th label="YIELD" sortKey="earnings_yield_pct" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
              <th>7D</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <YieldRow key={p.symbol} protocol={p} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Section Header ─── */

function SectionHeader({ count, total }: { readonly count: number; readonly total: number }) {
  return (
    <div className="section__head">
      <div>
        <div className="section__eyebrow mono">03, EARNINGS SCANNER</div>
        <h2 className="section__title">Protocols earning more than their market cap</h2>
        <p className="section__sub">
          Annualized revenue &divide; FDV. Sorted by yield. {count} of {total} shown.
        </p>
      </div>
      <a className="ghost-btn" href="/earnings/">Open scanner <span className="arr">&rarr;</span></a>
    </div>
  );
}

/* ─── Filter Chips ─── */

function FilterChips({
  active,
  onSelect,
}: {
  readonly active: string;
  readonly onSelect: (chip: string) => void;
}) {
  return (
    <div className="table-filters">
      <div className="table-filters__chips">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className={`chip${chip.label === active ? " chip--active" : ""}`}
            onClick={() => onSelect(chip.label)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <span className="table-filters__updated">UPDATED DAILY</span>
    </div>
  );
}
