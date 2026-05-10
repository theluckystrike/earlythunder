import Link from "next/link";

const SIGNALS = [
  { name: "Toy Phase", description: "Still dismissed by incumbents. Maximum asymmetry window.", href: "/opportunities" },
  { name: "Working Code", description: "Deployed, functional technology. Not vaporware.", href: "/opportunities" },
  { name: "Community", description: "Organic growth of genuine users and advocates.", href: "/opportunities" },
  { name: "Dev Activity", description: "Active development with contributor diversity.", href: "/opportunities" },
  { name: "Smart Money", description: "Sophisticated capital flowing before the crowd.", href: "/intelligence/" },
  { name: "Narrative", description: "Compelling story that spreads virally.", href: "/blog" },
  { name: "Earnings Yield", description: "131 protocols with real yield data. 24 Hyperliquid-grade.", href: "/earnings/" },
  { name: "Catalyst", description: "24 active deadlines tracked. Near-term events that drive repricing.", href: "/deadlines/" },
] as const;

/** The 8-Signal Pattern Filter section. */
export default function SignalsSection() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        The 8-Signal Pattern Filter
      </h2>
      <p className="text-text-secondary text-lg mt-4">
        Click any signal to explore the data behind it. 58 convergence events detected.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SIGNALS.map((signal, index) => (
          <SignalCard
            key={signal.name}
            number={String(index + 1).padStart(2, "0")}
            name={signal.name}
            description={signal.description}
            href={signal.href}
          />
        ))}
      </div>
      <div className="flex gap-6 mt-8">
        <Link
          href="/intelligence"
          className="text-text-secondary hover:text-text-primary text-sm transition"
        >
          View live convergence signals &rarr;
        </Link>
        <Link
          href="/methodology"
          className="text-text-secondary hover:text-text-primary text-sm transition"
        >
          Read full methodology &rarr;
        </Link>
      </div>
    </section>
  );
}

function SignalCard({
  number,
  name,
  description,
  href,
}: {
  readonly number: string;
  readonly name: string;
  readonly description: string;
  readonly href: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent transition-colors"
    >
      <div className="text-text-tertiary font-mono text-sm">{number}</div>
      <h3 className="text-text-primary text-lg font-semibold mt-4 tracking-tight flex items-center justify-between">
        {name}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">
          &rarr;
        </span>
      </h3>
      <p className="text-text-secondary text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
