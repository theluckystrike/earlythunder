"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/methodology", label: "Methodology" },
  { href: "/graveyard", label: "Graveyard" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
] as const;

const MAX_NAV_LINKS = 10;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (NAV_LINKS.length > MAX_NAV_LINKS) {
    throw new Error("Navigation links exceed maximum allowed count.");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl tracking-tight text-amber"
        >
          <ThunderIcon />
          <span>Early Thunder</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/pricing"
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-amber-hover"
          >
            Get Early Access
          </Link>
        </div>

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
    <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-card hover:text-text-primary"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/pricing"
          onClick={onClose}
          className="mt-2 rounded-lg bg-amber px-4 py-2 text-center text-sm font-semibold text-base transition-colors hover:bg-amber-hover"
        >
          Get Early Access
        </Link>
      </nav>
    </div>
  );
}

function ThunderIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill="currentColor"
      />
    </svg>
  );
}

function MobileMenuIcon({ open }: { readonly open: boolean }) {
  if (open) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
