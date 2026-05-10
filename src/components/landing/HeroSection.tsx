import Link from "next/link";

/** Apple-style hero with massive typography and generous whitespace. */
export default function HeroSection() {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center max-w-6xl mx-auto px-6">
      <h1 className="text-5xl md:text-7xl lg:text-[80px] font-semibold tracking-tighter leading-[1.05]">
        <span className="text-text-primary">Follow the money</span>
        <br />
        <span className="text-text-secondary">that cannot lie.</span>
      </h1>
      <p className="text-xl md:text-2xl text-text-secondary font-normal mt-8 max-w-2xl leading-relaxed">
        4 live intelligence tools scanning 154+ protocols for convergence
        signals, earnings yield, and deadline catalysts &mdash; updated daily,
        entirely free.
      </p>
      <HeroButtons />
      <ToolBadgeStrip />
    </section>
  );
}

function HeroButtons() {
  return (
    <div className="flex gap-4 mt-10">
      <a
        href="/intelligence/"
        className="bg-text-primary text-black font-medium px-7 py-3 rounded-full text-base hover:opacity-90 transition"
      >
        Open Intelligence Terminal &rarr;
      </a>
      <Link
        href="/opportunities"
        className="text-text-secondary hover:text-text-primary font-medium text-base transition flex items-center"
      >
        Browse 172 Opportunities
      </Link>
    </div>
  );
}

/** Badge data for each live tool. */
const TOOL_BADGES = [
  { label: "Convergence Signals", href: "/intelligence/" },
  { label: "Earnings Scanner", href: "/earnings/" },
  { label: "Deadline Tracker", href: "/deadlines/" },
  { label: "13 Research Briefs", href: "/research/" },
] as const;

/** Horizontal strip of small pill badges linking to each tool page. */
function ToolBadgeStrip() {
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {TOOL_BADGES.map((badge) => (
        <a
          key={badge.href}
          href={badge.href}
          className="inline-flex items-center font-mono text-xs border border-border-primary text-text-secondary rounded-full px-3 py-1 hover:border-accent hover:text-text-primary transition"
        >
          {badge.label}
        </a>
      ))}
    </div>
  );
}
