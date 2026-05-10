import Link from "next/link";

/** Routes served as standalone HTML from public/ — use <a> tags, not <Link>. */
const STANDALONE_ROUTES = new Set([
  "/intelligence/",
  "/earnings/",
  "/deadlines/",
  "/research/",
]);

interface FooterLink {
  readonly href: string;
  readonly label: string;
}

const FOOTER_SECTIONS: readonly { readonly title: string; readonly links: readonly FooterLink[] }[] = [
  {
    title: "INTELLIGENCE",
    links: [
      { href: "/intelligence/", label: "Dashboard" },
      { href: "/earnings/", label: "Earnings Scanner" },
      { href: "/deadlines/", label: "Deadline Tracker" },
      { href: "/discoveries", label: "Convergence Signals" },
    ],
  },
  {
    title: "RESEARCH",
    links: [
      { href: "/research/", label: "Library" },
      { href: "/blog", label: "Blog" },
      { href: "/graveyard", label: "Graveyard" },
      { href: "/performance", label: "Performance" },
    ],
  },
  {
    title: "ABOUT",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

/** Render a single link — standalone <a> or Next.js <Link>. */
function FooterAnchor({ href, label }: FooterLink) {
  const cls = "footer__link";
  if (STANDALONE_ROUTES.has(href)) {
    return <a href={href} className={cls}>{label}</a>;
  }
  return <Link href={href} className={cls}>{label}</Link>;
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        {/* Brand column */}
        <div className="footer__brand">
          <Link href="/" className="footer__logo">EarlyThunder</Link>
          <p className="footer__tagline">Pre-mainstream opportunity intelligence.</p>
          <p className="footer__status">
            <span className="footer__dot" /> Pipeline operational &middot; 154 protocols
          </p>
        </div>

        {/* Link columns */}
        <div className="footer__links">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="footer__col">
              <h3 className="footer__col-title">{section.title}</h3>
              <ul className="footer__col-list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bot">
        <p className="footer__copy">&copy; 2026 AUTOM8 LLC</p>
        <p className="footer__disclaimer">
          Not financial advice. Past patterns do not predict future results.{" "}
          <Link href="/disclaimer" className="footer__disclaimer-link">
            Full disclaimer &rarr;
          </Link>
        </p>
      </div>
    </footer>
  );
}
