import Link from "next/link";

interface NumbersStripProps {
  readonly totalProtocols: number;
  readonly convergenceEvents: number;
  readonly activeDeadlines: number;
  readonly criticalDeadlines: number;
}

interface StatItem {
  readonly value: string;
  readonly label: string;
  readonly href: string;
  readonly useNextLink: boolean;
}

/** Numbers strip showing computed pipeline data counts. */
export default function NumbersStrip({
  totalProtocols,
  convergenceEvents,
  activeDeadlines,
  criticalDeadlines,
}: NumbersStripProps) {
  const stats: readonly StatItem[] = [
    { value: `${totalProtocols}+`, label: "Protocols Scanned", href: "/opportunities", useNextLink: true },
    { value: `${convergenceEvents}`, label: "Convergence Events", href: "/intelligence/", useNextLink: false },
    { value: `${activeDeadlines}`, label: "Active Deadlines", href: "/deadlines/", useNextLink: false },
    { value: `${criticalDeadlines} critical`, label: "Critical Deadlines", href: "/deadlines/", useNextLink: false },
  ];

  return (
    <>
      <div className="divider" />
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <StatBlock key={stat.label} stat={stat} />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-score-high animate-pulse" />
          <span className="text-xs text-text-tertiary font-mono">
            Pipeline updated daily
          </span>
        </div>
      </section>
    </>
  );
}

/** Single clickable stat linking to its tool page. */
function StatBlock({ stat }: { readonly stat: StatItem }) {
  const inner = (
    <>
      <div className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary">
        {stat.value}
      </div>
      <div className="text-sm text-text-tertiary mt-2 uppercase tracking-widest group-hover:underline group-hover:underline-offset-4">
        {stat.label}
        <span className="inline-block ml-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          &rarr;
        </span>
      </div>
    </>
  );

  if (stat.useNextLink) {
    return (
      <Link
        href={stat.href}
        className="group block cursor-pointer transition-opacity duration-200 hover:opacity-80"
      >
        {inner}
      </Link>
    );
  }

  return (
    <a
      href={stat.href}
      className="group block cursor-pointer transition-opacity duration-200 hover:opacity-80"
    >
      {inner}
    </a>
  );
}
