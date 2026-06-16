import Link from "next/link";

/** Routes served as standalone HTML from public/, use <a> tags, not <Link>. */
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

interface FooterSection {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

const FOOTER_SECTIONS: readonly FooterSection[] = [
  {
    title: "INTELLIGENCE",
    links: [
      { href: "/intelligence/", label: "Dashboard" },
      { href: "/earnings/", label: "Earnings Scanner" },
      { href: "/deadlines/", label: "Deadline Tracker" },
      { href: "/intelligence/", label: "Convergence Signals" },
    ],
  },
  {
    title: "RESEARCH",
    links: [
      { href: "/research/", label: "Library" },
      { href: "/guides", label: "Guides" },
      { href: "/blog", label: "Blog" },
      { href: "/graveyard", label: "Graveyard" },
      { href: "/performance", label: "Performance" },
    ],
  },
  {
    title: "ABOUT",
    links: [
      { href: "/about", label: "About" },
      { href: "/methodology", label: "Methodology" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
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

/** Render a single link, standalone <a> or Next.js <Link>. */
function FooterAnchor({ href, label }: FooterLink) {
  if (STANDALONE_ROUTES.has(href)) {
    return <a href={href}>{label}</a>;
  }
  return <Link href={href}>{label}</Link>;
}

/** Render one column of footer links. */
function FooterColumn({ section }: { section: FooterSection }) {
  return (
    <div>
      <div className="footer__head mono">{section.title}</div>
      {section.links.map((link) => (
        <FooterAnchor key={link.href + link.label} href={link.href} label={link.label} />
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <div className="logo">EarlyThunder</div>
          <p className="footer__tag">
            Pre-mainstream opportunity intelligence. Hear the storm before anyone else.
          </p>
          <div className="footer__status mono">
            <span className="dot dot--positive pulse" /> Pipeline operational &middot; 154 protocols &middot; updated daily
          </div>
        </div>
        <div className="footer__cols">
          {FOOTER_SECTIONS.map((section) => (
            <FooterColumn key={section.title} section={section} />
          ))}
        </div>
      </div>
      <div className="footer__bot">
        <div className="mono t-tert">&copy; 2026 AUTOM8 LLC &middot; All rights reserved</div>
        <div className="t-tert">
          For informational purposes only. Nothing constitutes financial advice.{" "}
          <Link href="/disclaimer">Read full disclaimer &rarr;</Link>
        </div>
      </div>
    </footer>
  );
}
