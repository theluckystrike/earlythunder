import Link from "next/link";

const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

export default function HeroSection() {
  console.assert(typeof DISCORD_URL === "string", "HeroSection: DISCORD_URL required");
  console.assert(DISCORD_URL.startsWith("https://"), "HeroSection: DISCORD_URL must be https");

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden pt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12 relative z-10">
        {/* Tag */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-border px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-text-primary bg-bg-card/60 mb-12">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-bolt animate-pulse" />
          Pre-mainstream opportunity intelligence
        </div>

        {/* Headline — serif, massive */}
        <h1 className="font-serif font-normal text-[clamp(48px,10vw,160px)] leading-[0.88] tracking-[-0.04em] max-w-[1200px]" style={{ fontVariationSettings: "'opsz' 144" }}>
          Hear the storm
          <br />
          before <em className="italic text-bolt" style={{ fontVariationSettings: "'opsz' 144" }}>anyone&nbsp;else.</em>
        </h1>

        {/* Sub */}
        <p className="mt-12 max-w-[600px] text-lg leading-relaxed text-text-primary/75 tracking-tight">
          Systematic research identifying asymmetric opportunities{" "}
          <strong className="font-medium text-text-primary">6–18 months before consensus</strong>{" "}
          — across digital assets, public equities, and private markets.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex gap-3 items-center flex-wrap">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-bolt rounded-full px-5 py-3 text-sm font-medium"
          >
            Join Discord →
          </a>
          <Link href="/methodology" className="btn rounded-full px-5 py-3 text-sm">
            See the methodology
          </Link>
        </div>
      </div>
    </section>
  );
}
