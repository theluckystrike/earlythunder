"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

const NAV_LINKS = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/methodology", label: "Methodology" },
  { href: "/graveyard", label: "Graveyard" },
  { href: "/pricing", label: "Pricing" },
] as const;

/* ── Sub-components ─────────────────────────────────── */

function BoltIcon({ size = 22 }: { readonly size?: number }) {
  console.assert(typeof size === "number", "BoltIcon: size must be number");
  console.assert(size > 0, "BoltIcon: size must be positive");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 2 L4 13.5 L11 13.5 L10 22 L20 9 L13 9 Z" fill="currentColor" />
    </svg>
  );
}

function MobileMenuIcon({ open }: { readonly open: boolean }) {
  console.assert(typeof open === "boolean", "MobileMenuIcon: open must be boolean");
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

function MobileNav({ onClose }: { readonly onClose: () => void }) {
  console.assert(typeof onClose === "function", "MobileNav: onClose must be function");
  console.assert(NAV_LINKS.length > 0, "MobileNav: NAV_LINKS must not be empty");
  return (
    <div className="border-t border-line-2 bg-bg px-6 py-5 md:hidden">
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-[14px] font-[450] tracking-tight text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
          >
            {link.label}
          </Link>
        ))}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="btn-bolt mt-3 rounded-full px-4 py-2.5 text-center text-[13px] font-medium"
        >
          Join Discord &rarr;
        </a>
      </nav>
    </div>
  );
}

/* ── Header bar content ─────────────────────────────── */

interface HeaderBarProps {
  readonly mobileOpen: boolean;
  readonly onToggleMobile: () => void;
}

function HeaderBar({ mobileOpen, onToggleMobile }: HeaderBarProps) {
  console.assert(typeof mobileOpen === "boolean", "HeaderBar: mobileOpen must be boolean");
  console.assert(typeof onToggleMobile === "function", "HeaderBar: onToggleMobile must be function");

  return (
    <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6 lg:px-12">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 text-bolt">
          <BoltIcon size={22} />
          <span className="font-serif text-[22px] font-normal tracking-tight text-text-primary hidden sm:inline">
            Early Thunder
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-[450] tracking-tight text-text-primary/70 transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3.5">
        <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-secondary sm:flex">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-bolt animate-pulse" />
          Live
        </span>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bolt hidden rounded-full px-4 py-1.5 text-[13px] font-medium sm:inline-flex"
        >
          Join Discord &rarr;
        </a>
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary md:hidden"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <MobileMenuIcon open={mobileOpen} />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */

export default function Header() {
  console.assert(NAV_LINKS.length > 0, "Header: NAV_LINKS must not be empty");
  console.assert(typeof DISCORD_URL === "string", "Header: DISCORD_URL must be string");

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 z-50 w-full backdrop-blur-xl bg-bg/80"
      style={{
        borderBottom: scrolled
          ? "1px solid oklch(0.35 0.01 250 / 0.48)"
          : "1px solid transparent",
      }}
    >
      <HeaderBar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </header>
  );
}
