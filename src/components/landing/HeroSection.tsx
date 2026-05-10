import Link from "next/link";

/* ─── Live data constants (will become API-driven) ─── */

const LIVE_PULSE_DATA = [
  { label: "MARKET REGIME", value: "RISK_OFF", color: "bg-teal-400" },
  { label: "NEXT DEADLINE", value: "Limitless \u00b7 15d", color: "bg-amber-400" },
  { label: "TOP YIELD", value: "2,077% \u00b7 BabySwap", color: "bg-green-400" },
] as const;

/* ─── Types ─── */

interface PulseItem {
  readonly label: string;
  readonly value: string;
  readonly color: string;
}

interface LivePulseStripProps {
  readonly items: readonly PulseItem[];
}

/* ─── LivePulseStrip ─── */

/** Bloomberg-style data ticker showing live pipeline intelligence. */
function LivePulseStrip({ items }: LivePulseStripProps) {
  if (!items || items.length === 0) return null;
  if (typeof items[0].label !== "string") return null;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-text-secondary">
      {items.map((item, idx) => (
        <span key={item.label} className="flex items-center gap-x-2">
          {idx > 0 && (
            <span className="text-border-primary mr-2 hidden sm:inline">|</span>
          )}
          <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
          <span className="uppercase tracking-wide">{item.label}:</span>
          <span className="text-text-primary font-semibold">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── HeroButtons ─── */

/** Primary and secondary CTAs for the hero section. */
function HeroButtons() {
  return (
    <div className="flex flex-wrap gap-4 mt-10">
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
        Scan 172 Opportunities
      </Link>
    </div>
  );
}

/* ─── HeroSection (main export) ─── */

/** Data-dense hero with live pipeline intelligence pulse strip. */
export default function HeroSection() {
  return (
    <section className="min-h-[75vh] flex flex-col justify-center max-w-6xl mx-auto px-6">
      <h1 className="text-5xl md:text-7xl lg:text-[80px] font-semibold tracking-tighter leading-[1.05]">
        <span className="text-text-primary">Follow the money</span>
        <br />
        <span className="text-text-secondary">that cannot lie.</span>
      </h1>
      <LivePulseStrip items={LIVE_PULSE_DATA} />
      <HeroButtons />
    </section>
  );
}
