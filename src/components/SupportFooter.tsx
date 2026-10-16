"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BMC_URL, PAYPAL_3_URL, TIP_BTN, TIP_PRIMARY_STYLE, CupIcon, Portrait } from "./SupportCta";

/** No tip ask on pages that sell something, or on the support page itself. */
const NO_TIP_PATHS = new Set(["/pricing", "/welcome", "/about", "/support"]);

/** One delegated listener: report tip clicks to GA4 only when gtag exists (consent given). */
function useSupportClickTracking() {
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const target = ev.target as Element | null;
      const link = target?.closest?.("a[data-support-rail]") as HTMLAnchorElement | null;
      if (!link) return;
      const root = link.closest("[data-support-cta]") as HTMLElement | null;
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag === "function") {
        w.gtag("event", "support_click", {
          cta_position: root?.dataset.supportCta ?? "unknown",
          rail: link.dataset.supportRail,
          variant: root?.dataset.sctState ?? "na",
        });
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

/** CTA 2: footer support block, shown on every free page. */
export default function SupportFooter({
  tokenPages,
  posts,
}: {
  readonly tokenPages: number;
  readonly posts: number;
}) {
  useSupportClickTracking();
  const raw = usePathname() || "/";
  const path = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  if (NO_TIP_PATHS.has(path)) return null;

  return (
    <div
      data-support-cta="footer"
      className="mx-auto flex max-w-[1280px] flex-col gap-5 border-b border-border-subtle px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12"
    >
      <div className="flex max-w-2xl items-start gap-4">
        <Portrait size={44} />
        <div>
          <p className="text-base font-semibold tracking-tight text-text-primary">
            Early Thunder is one person&apos;s side project.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            I&apos;m Michael. Since April 2026 I have built {tokenPages} token research pages and {posts} posts. The
            domain costs about $11 a year, so a $3 tip covers three months of it, and the research stays free either way.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:shrink-0">
        <a href={PAYPAL_3_URL} target="_blank" rel="noopener" data-support-rail="paypal" className={TIP_BTN} style={TIP_PRIMARY_STYLE}>
          Tip $3 with PayPal
        </a>
        <a href={BMC_URL} target="_blank" rel="noopener" data-support-rail="bmc" className={TIP_BTN}>
          <CupIcon /> Buy me a coffee
        </a>
        <Link
          href="/support"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center px-1 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
        >
          Why I ask
        </Link>
      </div>
    </div>
  );
}
