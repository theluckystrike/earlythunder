import Link from "next/link";

interface Signal {
  readonly name: string;
  readonly hint: string;
  readonly weight: string;
  readonly href: string;
  readonly external: boolean;
}

const SIGNALS: readonly Signal[] = [
  { name: "Toy Phase", hint: "Pre-hype asymmetry", weight: "12.5%", href: "/opportunities", external: false },
  { name: "Working Code", hint: "Deployed technology", weight: "12.5%", href: "/opportunities", external: false },
  { name: "Community", hint: "Organic user growth", weight: "12.5%", href: "/opportunities", external: false },
  { name: "Dev Activity", hint: "Active contributors", weight: "12.5%", href: "/opportunities", external: false },
  { name: "Smart Money", hint: "Capital inflows", weight: "12.5%", href: "/intelligence/", external: true },
  { name: "Narrative", hint: "Viral story potential", weight: "12.5%", href: "/blog", external: false },
  { name: "Earnings Yield", hint: "Revenue vs market cap", weight: "12.5%", href: "/earnings/", external: true },
  { name: "Catalyst", hint: "Near-term triggers", weight: "12.5%", href: "/deadlines/", external: true },
] as const;

/** Scoring methodology at a glance — 8 signals with weights. */
export default function SignalsSection() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        How We Score: 8 Signals
      </h2>
      <p className="text-text-secondary text-lg mt-4">
        Every opportunity is scored across 8 dimensions. Combined score determines conviction.
      </p>
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SIGNALS.map((signal, index) => (
          <SignalCard
            key={signal.name}
            number={String(index + 1).padStart(2, "0")}
            signal={signal}
          />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href="/opportunities"
          className="text-text-secondary hover:text-text-primary text-sm transition"
        >
          View all 172 scored opportunities &rarr;
        </Link>
      </div>
    </section>
  );
}

function SignalCard({
  number,
  signal,
}: {
  readonly number: string;
  readonly signal: Signal;
}) {
  const classes =
    "group block bg-bg-card rounded-xl p-4 md:p-5 border border-border hover:border-accent transition-colors";

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-text-tertiary font-mono text-xs">{number}</span>
        <span className="text-text-tertiary font-mono text-xs">{signal.weight}</span>
      </div>
      <h3 className="text-text-primary text-sm font-semibold mt-2 tracking-tight flex items-center justify-between">
        {signal.name}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">
          &rarr;
        </span>
      </h3>
      <p className="text-text-tertiary text-xs mt-1">{signal.hint}</p>
    </>
  );

  if (signal.external) {
    return (
      <a href={signal.href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={signal.href} className={classes}>
      {content}
    </Link>
  );
}
