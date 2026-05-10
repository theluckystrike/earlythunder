import Link from "next/link";

interface StatItem {
  readonly value: string;
  readonly label: string;
  readonly href: string;
}

/** Pipeline-verified stats from autonomous intelligence system. */
const PIPELINE_STATS: readonly StatItem[] = [
  { value: "154+", label: "Protocols Scanned", href: "/opportunities" },
  { value: "58", label: "Convergence Events", href: "/intelligence/" },
  { value: "24", label: "Active Deadlines", href: "/deadlines/" },
  { value: "88%", label: "Airdrops Lose Value in 90d", href: "/research/airdrop-performance-data/" },
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
            <StatBlock key={stat.label} value={stat.value} label={stat.label} href={stat.href} />
          ))}
        </div>
      </section>
    </>
  );
}

/** Single clickable stat linking to its tool page. */
function StatBlock({ value, label, href }: StatItem) {
  return (
    <Link
      href={href}
      className="group block cursor-pointer transition-opacity duration-200 hover:opacity-80"
    >
      <div className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
        {value}
      </div>
      <div className="text-sm text-text-tertiary mt-2 uppercase tracking-widest group-hover:underline group-hover:underline-offset-4">
        {label}
        <span className="inline-block ml-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
