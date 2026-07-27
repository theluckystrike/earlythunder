import type { ReactNode } from "react";

/**
 * Shared page primitives lifted from the crafted pages (performance, scorecard,
 * portfolio) so every route renders the same type scale, measure and card style.
 *
 * Reference implementation: src/app/performance/page.tsx.
 */

/** Optimal reading measure. Prose wider than this is what makes a page feel cluttered. */
const PROSE_MEASURE = "max-w-3xl";

interface PageHeaderProps {
  readonly title: string;
  readonly lead: string;
  /** Small uppercase status pill shown above the title. */
  readonly eyebrow?: string;
  /** Byline and updated stamp, rendered small under the lead. */
  readonly meta?: string;
}

/** Page title block. Matches the h1 scale and lead measure used site-wide. */
export function PageHeader({ title, lead, eyebrow, meta }: PageHeaderProps) {
  console.assert(typeof title === "string" && title.length > 0, "PageHeader: title required");
  console.assert(typeof lead === "string", "PageHeader: lead required");
  if (typeof title !== "string" || title.length === 0) return null;

  return (
    <header>
      {eyebrow && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-amber">
          {eyebrow}
        </div>
      )}
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-xl leading-relaxed text-text-secondary">
        {lead}
      </p>
      {meta && (
        <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-text-tertiary">
          {meta}
        </p>
      )}
    </header>
  );
}

interface SectionLabelProps {
  readonly number: string;
  readonly title: string;
}

/** Numbered section heading. The signature structural device on this site. */
export function SectionLabel({ number, title }: SectionLabelProps) {
  console.assert(typeof number === "string" && number.length > 0, "SectionLabel: number required");
  console.assert(typeof title === "string" && title.length > 0, "SectionLabel: title required");
  if (typeof title !== "string" || title.length === 0) return null;

  return (
    <div>
      <span className="font-mono text-sm text-text-tertiary">{number}</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
    </div>
  );
}

/** Body copy held to a readable measure. Use for every standalone paragraph. */
export function Prose({ children }: { readonly children: ReactNode }) {
  return (
    <p className={`mt-4 ${PROSE_MEASURE} text-[1.0625rem] leading-[1.75] text-text-secondary`}>
      {children}
    </p>
  );
}

/** Small uppercase label used above tables and link lists. */
export function EyebrowLabel({ children }: { readonly children: ReactNode }) {
  return (
    <h3 className="mb-4 font-mono text-sm uppercase tracking-wider text-text-tertiary">
      {children}
    </h3>
  );
}

interface CardLinkProps {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  /** Set for routes served as static HTML outside the Next router. */
  readonly external?: boolean;
}

/** Card-style link matching the Explore More blocks on the crafted pages. */
export function CardLink({ href, title, description, external }: CardLinkProps) {
  console.assert(typeof href === "string" && href.length > 0, "CardLink: href required");
  if (typeof href !== "string" || href.length === 0) return null;

  const className =
    "block h-full rounded-2xl border border-border bg-bg-card p-6 transition-all duration-200 hover:border-border-active hover:-translate-y-0.5";

  const inner = (
    <>
      <span className="block text-sm font-semibold leading-snug text-text-primary">
        {title}
      </span>
      <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
        {description}
      </span>
    </>
  );

  return (
    <a href={href} className={className} {...(external ? {} : {})}>
      {inner}
    </a>
  );
}

/** Section wrapper with the standard vertical rhythm. */
export function Section({
  children,
  divider,
}: {
  readonly children: ReactNode;
  readonly divider?: boolean;
}) {
  return (
    <section className={divider ? "mt-16 border-t border-border pt-10" : "mt-16"}>
      {children}
    </section>
  );
}
