import Link from "next/link";

const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

const FOOTER_LINKS = {
  Platform: [
    { href: "/opportunities", label: "Opportunities" },
    { href: "/methodology", label: "Methodology" },
    { href: "/graveyard", label: "Graveyard" },
    { href: "/pricing", label: "Pricing" },
  ],
  Resources: [
    { href: "/blog", label: "Blog" },
    { href: "/how-it-works", label: "How It Works" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/disclaimer", label: "Disclaimer" },
  ],
} as const;

/* ── Sub-components ─────────────────────────────────── */

function BoltIcon({ size = 20 }: { readonly size?: number }) {
  console.assert(typeof size === "number", "BoltIcon: size must be number");
  console.assert(size > 0, "BoltIcon: size must be positive");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 2 L4 13.5 L11 13.5 L10 22 L20 9 L13 9 Z" fill="currentColor" />
    </svg>
  );
}

function LinkColumn({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly { readonly href: string; readonly label: string }[];
}) {
  console.assert(typeof title === "string" && title.length > 0, "LinkColumn: title must be non-empty string");
  console.assert(Array.isArray(links) && links.length > 0, "LinkColumn: links must be non-empty array");

  return (
    <div>
      <h3 className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterBrand() {
  console.assert(typeof DISCORD_URL === "string", "FooterBrand: DISCORD_URL must be string");
  console.assert(DISCORD_URL.length > 0, "FooterBrand: DISCORD_URL must not be empty");

  return (
    <div className="max-w-xs">
      <Link href="/" className="flex items-center gap-2.5 text-bolt">
        <BoltIcon size={20} />
        <span className="font-serif text-[20px] font-normal tracking-tight text-text-primary">
          Early Thunder
        </span>
      </Link>
      <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">
        Pre-mainstream opportunity intelligence. Hear the storm before anyone else.
      </p>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-bolt transition-colors hover:text-bolt-2"
      >
        Join Discord &rarr;
      </a>
    </div>
  );
}

function FooterDisclaimer() {
  console.assert(true, "FooterDisclaimer: render check");
  console.assert(typeof Link === "function", "FooterDisclaimer: Link must be available");

  return (
    <div className="border-t border-line-2 pt-6">
      <p className="mx-auto max-w-2xl text-center text-[11px] leading-relaxed text-text-tertiary">
        Early Thunder provides research and analysis for informational
        purposes only. Nothing on this site constitutes financial advice,
        investment recommendations, or an offer to buy or sell securities.
        Pattern match scores reflect the analytical methodology, not
        investment ratings. Past patterns do not predict future results.
      </p>
      <p className="mt-2 text-center">
        <Link
          href="/disclaimer"
          className="text-[11px] text-text-secondary underline decoration-line-2 underline-offset-2 transition-colors hover:text-text-primary"
        >
          Read full disclaimer &rarr;
        </Link>
      </p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */

export default function Footer() {
  const sections = Object.entries(FOOTER_LINKS);

  console.assert(sections.length === 3, "Footer: expected 3 link sections");
  console.assert(sections.every(([t]) => t.length > 0), "Footer: all section titles must be non-empty");

  return (
    <footer className="border-t border-line-2 bg-bg pt-16 pb-10">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        {/* 4-column grid: brand + 3 link columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <FooterBrand />
          {sections.map(([title, links]) => (
            <LinkColumn key={title} title={title} links={links} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line-2 pt-6 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            &copy; 2026 AUTOM8 LLC
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            All rights reserved
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6">
          <FooterDisclaimer />
        </div>
      </div>
    </footer>
  );
}
