/**
 * Voluntary tip links (support my work). Plain links, no widget scripts.
 * The Workbench stays the primary (amber) offer, so tip buttons use the
 * secondary button style. Clicks are tracked by SupportFooter's listener.
 */

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

/** CTA 1: small thank-you card placed after the research content. */
export function SupportResultCard({
  heading,
  body,
  flush = false,
}: {
  readonly heading: string;
  readonly body: string;
  /** Drop the top margin when the parent already spaces sections. */
  readonly flush?: boolean;
}) {
  return (
    <aside
      data-support-cta="result"
      aria-label="Support this research"
      className={`${flush ? "" : "mt-12 "}max-w-3xl rounded-2xl border border-border bg-bg-card p-6`}
    >
      <h2 className="text-lg font-semibold tracking-tight text-text-primary">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={BMC_URL} target="_blank" rel="noopener" data-support-rail="bmc" className={TIP_BTN}>
          <CupIcon /> Buy me a coffee
        </a>
        <a href={PAYPAL_3_URL} target="_blank" rel="noopener" data-support-rail="paypal" className={TIP_BTN}>
          Tip $3 with PayPal
        </a>
      </div>
    </aside>
  );
}
