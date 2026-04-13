import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Early Thunder pricing plans. Explorer, Analyst, and Builder tiers.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader />
      <PricingCards />
      <CTASection />
    </div>
  );
}

function PageHeader() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary">
        Pricing
      </h1>
      <p className="mt-3 text-lg text-text-secondary">Coming soon.</p>
    </div>
  );
}

function PricingCards() {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-3">
      <ExplorerCard />
      <AnalystCard />
      <BuilderCard />
    </div>
  );
}

function ExplorerCard() {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-8">
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
        Explorer
      </h2>
      <div className="mt-4 font-mono text-4xl font-semibold text-text-primary">
        $0
      </div>
      <p className="mt-1 text-sm text-text-secondary">Free forever</p>
      <FeatureList features={EXPLORER_FEATURES} />
      <Link
        href="/opportunities"
        className="mt-8 block rounded-full border border-border py-3 text-center text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
      >
        Get Started
      </Link>
    </div>
  );
}

function AnalystCard() {
  return (
    <div className="relative rounded-2xl border border-text-primary/20 bg-bg-card p-8">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-text-primary px-3 py-1 text-xs font-semibold text-black">
        Most popular
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
        Analyst
      </h2>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-semibold text-text-primary">
          $49
        </span>
        <span className="text-sm text-text-secondary">/mo</span>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Full intelligence access</p>
      <FeatureList features={ANALYST_FEATURES} />
      <Link
        href="#waitlist"
        className="mt-8 block rounded-full bg-text-primary py-3 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        Join Waitlist
      </Link>
    </div>
  );
}

function BuilderCard() {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-8">
      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
        Builder
      </h2>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-semibold text-text-primary">
          $199
        </span>
        <span className="text-sm text-text-secondary">/mo</span>
      </div>
      <p className="mt-1 text-sm text-text-secondary">API and team access</p>
      <FeatureList features={BUILDER_FEATURES} />
      <Link
        href="#waitlist"
        className="mt-8 block rounded-full border border-border py-3 text-center text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
      >
        Contact Us
      </Link>
    </div>
  );
}

function FeatureList({ features }: { readonly features: readonly string[] }) {
  return (
    <ul className="mt-8 space-y-3">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className="mt-0.5 text-text-tertiary">-</span>
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function CTASection() {
  return (
    <section id="waitlist" className="mt-20 text-center">
      <p className="text-sm text-text-tertiary">
        Join the waitlist for early access.
      </p>
      <div className="mt-6">
        <EmailCapture />
      </div>
    </section>
  );
}

const EXPLORER_FEATURES = [
  "Browse all opportunities",
  "Composite scores and tiers",
  "One-liner summaries",
  "Graveyard access",
  "Blog access",
] as const;

const ANALYST_FEATURES = [
  "Everything in Explorer",
  "Full thesis and deep analysis",
  "8-Signal radar charts",
  "Catalyst and risk tracking",
  "Weekly research reports",
  "Priority new listings",
] as const;

const BUILDER_FEATURES = [
  "Everything in Analyst",
  "REST API access",
  "Team seats (up to 5)",
  "Custom alert rules",
  "Data export (CSV, JSON)",
  "Priority support",
] as const;
