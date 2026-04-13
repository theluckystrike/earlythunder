import Link from "next/link";

interface PaywallBlurProps {
  readonly children: React.ReactNode;
}

/**
 * Wraps content in a blur overlay with an upgrade CTA.
 * Used to gate premium content for free-tier users.
 */
export default function PaywallBlur({ children }: PaywallBlurProps) {
  if (!children) {
    return null;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-md" aria-hidden="true">
        {children}
      </div>
      <OverlayCTA />
    </div>
  );
}

function OverlayCTA() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-base/60 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
        <LockIcon />
        <h3 className="mt-4 font-display text-xl text-text-primary">
          Premium Analysis
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Unlock the full thesis, signal breakdown, catalysts, and risk analysis
          with Early Thunder Premium.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-amber-hover"
        >
          Unlock for $49/mo
        </Link>
        <p className="mt-3 text-xs text-text-secondary">
          7-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="mx-auto h-10 w-10 text-amber"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
