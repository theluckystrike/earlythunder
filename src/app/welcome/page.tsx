import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome to EarlyThunder Pro",
  description:
    "Your subscription is active. Full intelligence access is now unlocked.",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <SuccessIcon />
      <Heading />
      <Details />
      <Actions />
    </div>
  );
}

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-score-high/30 bg-score-high/10">
      <svg
        className="h-8 w-8 text-score-high"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    </div>
  );
}

function Heading() {
  return (
    <>
      <h1 className="mt-8 text-3xl font-semibold tracking-tighter text-text-primary">
        Welcome to EarlyThunder Pro
      </h1>
      <p className="mt-3 text-lg text-text-secondary">
        Your subscription is active. Full intelligence access is now unlocked.
      </p>
    </>
  );
}

function Details() {
  return (
    <div className="mt-10 rounded-2xl border border-border bg-bg-card p-6 text-left">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
        What you get
      </h2>
      <ul className="mt-4 space-y-3">
        {FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-text-secondary"
          >
            <span className="mt-0.5 text-score-high">-</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Actions() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Link
        href="/opportunities"
        className="rounded-full bg-text-primary px-8 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        Browse Opportunities
      </Link>
      <Link
        href="/"
        className="rounded-full border border-border px-8 py-3 text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
      >
        Back to Home
      </Link>
    </div>
  );
}

const FEATURES = [
  "Full thesis and deep analysis for every opportunity",
  "8-Signal radar charts with composite scoring",
  "Catalyst and risk tracking dashboards",
  "Weekly research reports delivered to your inbox",
  "Priority access to newly listed opportunities",
] as const;
