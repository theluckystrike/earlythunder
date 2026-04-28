import { getAllOpportunities } from "@/lib/data";

interface StatItem {
  readonly value: string;
  readonly label: string;
}

/** Compute real stats from opportunity data. */
function computeStats(): readonly StatItem[] {
  const all = getAllOpportunities();
  console.assert(Array.isArray(all), "computeStats: getAllOpportunities must return array");

  const active = all.filter((o) => !o.is_graveyard);
  const categories = new Set(active.map((o) => o.category));

  const stats = [
    { value: String(active.length), label: "Opportunities" },
    { value: String(categories.size), label: "Categories" },
    { value: "3", label: "Asset Classes" },
    { value: "8", label: "Signal Dimensions" },
  ] as const;

  console.assert(stats.length === 4, "computeStats: expected exactly 4 stats");
  return stats;
}

/** Numbers strip — editorial stat bar with serif numbers and mono labels. */
export default function NumbersStrip() {
  const stats = computeStats();
  console.assert(stats.length > 0, "NumbersStrip: stats must not be empty");
  console.assert(stats.every((s) => s.value && s.label), "NumbersStrip: all stats need value+label");

  return (
    <section className="border-t border-b border-line-2">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <StatBlock
              key={stat.label}
              value={stat.value}
              label={stat.label}
              isLast={idx === stats.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  value,
  label,
  isLast,
}: StatItem & { readonly isLast: boolean }) {
  const borderClass = isLast ? "" : "border-r border-line-2";

  return (
    <div className={`px-6 py-2 ${borderClass}`}>
      <div className="font-serif text-[clamp(48px,6vw,80px)] leading-none tracking-tight text-text-primary">
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mt-3">
        {label}
      </div>
    </div>
  );
}
