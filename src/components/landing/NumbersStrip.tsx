interface StatItem {
  readonly value: string;
  readonly label: string;
}

/** Pipeline-verified stats from autonomous intelligence system. */
const PIPELINE_STATS: readonly StatItem[] = [
  { value: "154+", label: "Protocols Scanned" },
  { value: "58", label: "Convergence Events" },
  { value: "24", label: "Active Deadlines" },
  { value: "88%", label: "Airdrops Lose Value in 90d" },
] as const;

/** Numbers strip showing real pipeline data counts. */
export default function NumbersStrip() {
  const stats = PIPELINE_STATS;

  return (
    <>
      <div className="divider" />
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <StatBlock key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>
    </>
  );
}

function StatBlock({ value, label }: StatItem) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
        {value}
      </div>
      <div className="text-sm text-text-tertiary mt-2 uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}
