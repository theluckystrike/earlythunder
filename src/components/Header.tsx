"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/methodology", label: "Methodology" },
  { href: "/graveyard", label: "Graveyard" },
  { href: "/pricing", label: "Pricing" },
] as const;

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

        {/* Center: Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA */}
        <div className="hidden md:block">
          <Link
            href="/pricing"
            className="rounded-full bg-text-primary px-4 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Get Access
          </Link>
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

function MobileNav({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="border-t border-border/50 bg-black px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/pricing"
          onClick={onClose}
          className="mt-2 rounded-full bg-text-primary px-4 py-2 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Get Access
        </Link>
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
