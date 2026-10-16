/**
 * Voluntary tip links (support my work). Plain links, no widget scripts.
 * The Workbench stays the primary (amber) offer, so tip buttons use the
 * secondary button style. Clicks are tracked by SupportFooter's listener.
 */

import SctMount from "./SctMount";

export const BMC_URL = "https://buymeacoffee.com/michaellip";
export const PAYPAL_URL = "https://paypal.me/najzzz";
export const PAYPAL_3_URL = "https://paypal.me/najzzz/3USD";

/** Shared look for tip buttons: site secondary button, 44px tall, visible focus ring. */
export const TIP_BTN =
  "secondary-btn min-h-[44px] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary";

export function CupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  );
}

export function Portrait({ size = 44 }: { readonly size?: number }) {
  return (
    <picture>
      <source srcSet="/michael-128.webp" type="image/webp" />
      <img
        src="/michael-128.jpg"
        width={size}
        height={size}
        loading="lazy"
        alt="Michael Lip"
        className="shrink-0 rounded-full border border-border"
        style={{ width: size, height: size }}
      />
    </picture>
  );
}

/** Inline style that lifts the $3 PayPal button above the BMC button without competing with the amber Workbench offer. */
export const TIP_PRIMARY_STYLE = { borderColor: "var(--text-secondary)", fontWeight: 600 } as const;

/**
 * CTA 1 (v3): result-first card after the research content.
 * support-v3.js swaps the first/returning copy and handles "Not now" (30 days, this browser only).
 */
export function SupportResultCard({
  heading,
  flush = false,
}: {
  readonly heading: string;
  /** Drop the top margin when the parent already spaces sections. */
  readonly flush?: boolean;
}) {
  return (
    <aside
      data-support-cta="result"
      data-sct-always=""
      aria-label="Support this research"
      className={`${flush ? "" : "mt-12 "}max-w-3xl rounded-2xl border border-border bg-bg-card p-6`}
    >
      <div className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3">
        <Portrait size={32} />
        <div>
          <div data-sct-variant="first">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">{heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              I&apos;m Michael, and I research these pages myself. The domain is about $11 a year, so $3 covers three
              months of it. Tips unlock nothing, and the research stays free. Research notes, not advice.
            </p>
          </div>
          <div data-sct-variant="returning" hidden>
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Back again? That&apos;s visit <span data-sct-uses="" />.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Glad the research keeps earning a spot in your routine. If it has saved you some digging, $3 keeps the
              domain paid for three months. Same free pages either way. Research notes, not advice.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={PAYPAL_3_URL} target="_blank" rel="noopener" data-support-rail="paypal" className={TIP_BTN} style={TIP_PRIMARY_STYLE}>
          Tip $3 with PayPal
        </a>
        <a href={BMC_URL} target="_blank" rel="noopener" data-support-rail="bmc" className={TIP_BTN}>
          <CupIcon /> Buy me a coffee
        </a>
        <span className="text-xs text-text-tertiary">card, no account</span>
        <button
          type="button"
          data-sct-dismiss=""
          className="inline-flex min-h-[44px] items-center px-1 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
        >
          Not now
        </button>
      </div>
      <SctMount />
    </aside>
  );
}
