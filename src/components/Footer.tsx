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
} as const;

const MAX_SECTIONS = 5;

export default function Footer() {
  const sections = Object.entries(FOOTER_LINKS);
  if (sections.length > MAX_SECTIONS) {
    throw new Error("Footer link sections exceed maximum allowed count.");
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <BrandColumn />
          {sections.map(([title, links]) => (
            <LinkColumn key={title} title={title} links={links} />
          ))}
        </div>

        <Disclaimer />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-text-secondary">
            &copy; {new Date().getFullYear()} Early Thunder. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/pricing" className="text-xs text-text-secondary hover:text-text-primary">
              Terms
            </Link>
            <Link href="/pricing" className="text-xs text-text-secondary hover:text-text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function BrandColumn() {
  return (
    <div className="md:col-span-2">
      <Link href="/" className="font-display text-xl text-amber">
        Early Thunder
      </Link>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
        Automated intelligence tracking pre-mainstream asymmetric investment
        opportunities. Hear the storm before anyone else.
      </p>
    </div>
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
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
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

function Disclaimer() {
  return (
    <div className="mt-8 rounded-lg border border-border bg-base p-4">
      <p className="text-xs leading-relaxed text-text-secondary">
        <strong className="text-warning">Disclaimer:</strong> Early Thunder
        provides research and analysis for informational purposes only. Nothing
        on this site constitutes financial advice, investment recommendations, or
        an offer to buy or sell any securities. Past performance does not
        guarantee future results. Always conduct your own research and consult a
        qualified financial advisor before making investment decisions.
      </p>
    </div>
  );
}
