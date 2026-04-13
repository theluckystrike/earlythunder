import Link from "next/link";

const SIGNALS = [
  { name: "Toy Phase", description: "Still dismissed by incumbents — maximum asymmetry window." },
  { name: "Working Code", description: "Deployed, functional technology — not vaporware." },
  { name: "Community", description: "Organic growth of genuine users and advocates." },
  { name: "Dev Activity", description: "Active development with contributor diversity." },
  { name: "Smart Money", description: "Sophisticated capital flowing before the crowd." },
  { name: "Narrative", description: "Compelling story that spreads virally." },
  { name: "Hard to Buy", description: "Friction creates opportunity for the diligent." },
  { name: "Catalyst", description: "Identifiable near-term events to unlock value." },
] as const;

/** The 8-Signal Pattern Filter section. */
export default function SignalsSection() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        The 8-Signal Pattern Filter
      </h2>
      <p className="text-text-secondary text-lg mt-4">
        Every opportunity evaluated across eight dimensions.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SIGNALS.map((signal, index) => (
          <SignalCard
            key={signal.name}
            number={String(index + 1).padStart(2, "0")}
            name={signal.name}
            description={signal.description}
          />
        ))}
      </div>
      <Link
        href="/methodology"
        className="text-text-secondary hover:text-text-primary text-sm mt-8 block transition"
      >
        Read full methodology &rarr;
      </Link>
    </section>
  );
}

function SignalCard({
  number,
  name,
  description,
}: {
  readonly number: string;
  readonly name: string;
  readonly description: string;
}) {
  return (
    <div className="bg-bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-border-hover transition">
      <div className="text-text-tertiary font-mono text-sm">{number}</div>
      <h3 className="text-text-primary text-lg font-semibold mt-4 tracking-tight">
        {name}
      </h3>
      <p className="text-text-secondary text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
