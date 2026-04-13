import { getAllOpportunities } from "@/lib/data";

interface StatItem {
  readonly value: string;
  readonly label: string;
}

/** Compute real stats from opportunity data. */
function computeStats(): readonly StatItem[] {
  const all = getAllOpportunities();
  const active = all.filter((o) => !o.is_graveyard);
  const categories = new Set(active.map((o) => o.category));

  return [
    { value: String(active.length), label: "Opportunities" },
    { value: String(categories.size), label: "Categories" },
    { value: "3", label: "Asset Classes" },
    { value: "8", label: "Signal Dimensions" },
  ] as const;
}

/** Numbers strip showing real data counts. */
export default function NumbersStrip() {
  const stats = computeStats();

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
