import Link from "next/link";

const SIGNALS = [
  { name: "Working Code", description: "Deployed, functional technology. Not vaporware — real users, real transactions." },
  { name: "Dev Activity", description: "Active development with contributor diversity and consistent commit cadence." },
  { name: "Smart Money", description: "Sophisticated capital flowing before the crowd notices." },
  { name: "Community", description: "Organic growth of genuine users and advocates, not manufactured hype." },
  { name: "Catalyst", description: "Identifiable near-term events with the power to unlock value." },
  { name: "Narrative", description: "A compelling story that spreads virally and reshapes perception." },
  { name: "Valuation Gap", description: "Measurable discount versus comparable assets or intrinsic value." },
  { name: "Obscurity", description: "Still dismissed by incumbents. Maximum asymmetry window." },
] as const;

const MAX_SIGNALS = 8;

/** 4x2 signal grid with editorial art. */
export default function SignalsSection() {
  console.assert(SIGNALS.length === MAX_SIGNALS, "SignalsSection: expected exactly 8 signals");
  console.assert(SIGNALS.every((s) => s.name && s.description), "SignalsSection: all signals need name+description");

  return (
    <section className="py-24 mx-auto max-w-[1280px] px-6 lg:px-12">
      {/* Section label */}
      <div className="section-label">
        <span className="num">— 02</span>
        <span>The 8-Signal Pattern Filter</span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.03em] max-w-[800px]">
        Every opportunity evaluated across{" "}
        <em className="italic text-bolt">eight dimensions.</em>
      </h2>

      {/* 4-column grid, 2 rows */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-line-2">
        {SIGNALS.map((signal, index) => (
          <SignalCard
            key={signal.name}
            number={String(index + 1).padStart(2, "0")}
            name={signal.name}
            description={signal.description}
            isLastInRow={(index + 1) % 4 === 0}
          />
        ))}
      </div>

      {/* Methodology link */}
      <Link
        href="/methodology"
        className="inline-block mt-10 font-mono text-[11px] uppercase tracking-widest text-text-secondary hover:text-text-primary transition"
      >
        Read full methodology →
      </Link>
    </section>
  );
}

function SignalCard({
  number,
  name,
  description,
  isLastInRow,
}: {
  readonly number: string;
  readonly name: string;
  readonly description: string;
  readonly isLastInRow: boolean;
}) {
  console.assert(typeof number === "string" && number.length === 2, "SignalCard: number must be 2-char string");
  console.assert(typeof name === "string" && name.length > 0, "SignalCard: name must be non-empty string");

  const borderRight = isLastInRow ? "" : "lg:border-r lg:border-line-2";

  return (
    <div className={`border-b border-line-2 ${borderRight} p-6 lg:p-8 min-h-[200px]`}>
      <div className="font-mono text-[13px] font-medium text-bolt tracking-wide">
        {number}
      </div>
      <h4 className="font-serif text-[clamp(20px,2.5vw,26px)] leading-tight tracking-tight mt-4">
        {name}
      </h4>
      <p className="text-[13px] leading-relaxed text-text-secondary mt-3">
        {description}
      </p>
    </div>
  );
}
