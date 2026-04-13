import Link from "next/link";

interface PaywallBlurProps {
  readonly children: React.ReactNode;
}

/** Wraps content in a blur overlay with an upgrade CTA. */
export default function PaywallBlur({ children }: PaywallBlurProps) {
  if (!children) {
    return null;
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none filter blur-[6px] saturate-[30%]"
        aria-hidden="true"
      >
        {children}
      </div>
      <OverlayCTA />
    </div>
  );
}

function OverlayCTA() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
      <p className="font-semibold text-text-primary text-lg mt-3">
        Full analysis
      </p>
      <p className="text-text-secondary text-sm mt-1">
        Available with Early Thunder access.
      </p>
      <Link
        href="/pricing"
        className="bg-text-primary text-black text-sm font-medium px-5 py-2 rounded-full mt-4 hover:opacity-90 transition"
      >
        Unlock Access
      </Link>
    </div>
  );
}
