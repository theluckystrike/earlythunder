import Link from "next/link";

const FOOTER_LINKS = {
  Platform: [
    { href: "/opportunities", label: "Opportunities" },
    { href: "/methodology", label: "Methodology" },
    { href: "/graveyard", label: "Graveyard" },
    { href: "/pricing", label: "Pricing" },
  ],
  Resources: [
    { href: "/blog", label: "Blog" },
    { href: "/methodology", label: "How It Works" },
  ],
  Legal: [
    { href: "/pricing", label: "Terms of Service" },
    { href: "/pricing", label: "Privacy Policy" },
  ],
} as const;

export default function Footer() {
  const sections = Object.entries(FOOTER_LINKS);

  return (
    <footer className="border-t border-border/50 bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link href="/" className="text-sm font-semibold tracking-tight text-text-primary">
              Early Thunder
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
              Pre-mainstream opportunity intelligence.
              Hear the storm before anyone else.
            </p>
          </div>

          {/* Link columns */}
          {sections.map(([title, links]) => (
            <LinkColumn key={title} title={title} links={links} />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 border-t border-border/50 pt-8">
          <p className="text-xs leading-relaxed text-text-tertiary">
            Disclaimer: Early Thunder provides research and analysis for
            informational purposes only. Nothing on this site constitutes
            financial advice, investment recommendations, or an offer to buy or
            sell any securities. Past performance does not guarantee future
            results. Always conduct your own research and consult a qualified
            financial advisor before making investment decisions.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-text-tertiary">
            &copy; 2026 AUTOM8 LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function LinkColumn({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly { readonly href: string; readonly label: string }[];
}) {
  if (typeof title !== "string" || title.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
