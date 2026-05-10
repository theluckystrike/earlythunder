"use client";

import Link from "next/link";
import { useState } from "react";

/** Primary nav: alpha tools showcased front and center */
const PRIMARY_NAV = [
  { href: "/intelligence/", label: "Intelligence", isNextRoute: false },
  { href: "/opportunities", label: "Opportunities", isNextRoute: true },
  { href: "/research/", label: "Research", isNextRoute: false },
  { href: "/earnings/", label: "Earnings", isNextRoute: false },
  { href: "/deadlines/", label: "Deadlines", isNextRoute: false },
] as const;

/** Secondary nav: shown only in mobile menu below a divider */
const SECONDARY_NAV = [
  { href: "/methodology", label: "Methodology", isNextRoute: true },
  { href: "/how-it-works", label: "How It Works", isNextRoute: true },
  { href: "/graveyard", label: "Graveyard", isNextRoute: true },
  { href: "/pricing", label: "Pricing", isNextRoute: true },
  { href: "/blog", label: "Blog", isNextRoute: true },
] as const;

type NavItem = { readonly href: string; readonly label: string; readonly isNextRoute: boolean };

function NavLink({ item, className, onClick }: {
  readonly item: NavItem;
  readonly className: string;
  readonly onClick?: () => void;
}) {
  if (item.isNextRoute) {
    return (
      <Link href={item.href} className={className} onClick={onClick}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-text-primary"
        >
          Early Thunder
        </Link>

        {/* Center: Primary Nav */}
        <DesktopNav />

        {/* Right: CTA */}
        <div className="hidden md:block">
          <a
            href="/intelligence/"
            className="rounded-full bg-text-primary px-4 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Explore Alpha
          </a>
        </div>

        {/* Mobile: Hamburger */}
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <MobileMenuIcon open={mobileOpen} />
        </button>
      </div>

      {mobileOpen && (
        <MobileNav onClose={() => setMobileOpen(false)} />
      )}
    </header>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {PRIMARY_NAV.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        />
      ))}
    </nav>
  );
}

function MobileNav({ onClose }: { readonly onClose: () => void }) {
  const linkClass = "rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary";

  return (
    <div className="border-t border-border/50 bg-black px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-1">
        {/* Primary alpha tools */}
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} className={linkClass} onClick={onClose} />
        ))}

        {/* Divider */}
        <div className="my-2 border-t border-border/30" />

        {/* Secondary links */}
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} className={linkClass} onClick={onClose} />
        ))}

        {/* CTA */}
        <a
          href="/intelligence/"
          onClick={onClose}
          className="mt-2 rounded-full bg-text-primary px-4 py-2 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Explore Alpha
        </a>
      </nav>
    </div>
  );
}

function MobileMenuIcon({ open }: { readonly open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
