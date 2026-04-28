const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

/** Discord CTA — centered editorial section replacing email capture. */
export default function NewsletterCTA() {
  console.assert(typeof DISCORD_URL === "string", "NewsletterCTA: DISCORD_URL required");
  console.assert(DISCORD_URL.startsWith("https://"), "NewsletterCTA: DISCORD_URL must be https");

  return (
    <section className="py-32 text-center mx-auto max-w-[1280px] px-6 lg:px-12">
      {/* Title */}
      <h2 className="font-serif text-[clamp(36px,6vw,72px)] leading-[0.95] tracking-[-0.03em]">
        Hear the storm.
        <br />
        <em className="italic text-bolt">Before anyone else.</em>
      </h2>

      {/* Subtitle */}
      <p className="mt-8 text-lg leading-relaxed text-text-primary/75 max-w-[520px] mx-auto tracking-tight">
        Join our Discord to discuss opportunities, pricing, and get early access to research.
      </p>

      {/* Large Discord button */}
      <div className="mt-10">
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bolt inline-flex items-center gap-2 rounded-full px-12 py-[18px] text-[17px] font-medium"
        >
          Join the Discord →
        </a>
      </div>

      {/* Mono note */}
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
        Community · researchers · operators
      </p>
    </section>
  );
}
