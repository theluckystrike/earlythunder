'use client';

import dynamic from 'next/dynamic';

/**
 * /discoveries route -- 1000x Intelligence Dashboard.
 * Loaded client-side only (ssr: false) because the dashboard
 * uses React.useState, React.useEffect, and browser fetch.
 */
const Dashboard1000x = dynamic(
  () => import('@/components/1000x-dashboard').then((mod) => ({
    default: mod.Dashboard1000x,
  })),
  { ssr: false }
);

export default function DiscoveriesPage() {
  return (
    <div>
      <Dashboard1000x />
      <RelatedToolsSection />
    </div>
  );
}

function RelatedToolsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-8 border-t border-border mt-16">
      <h3 className="text-sm font-mono uppercase tracking-wider text-text-tertiary mb-4">
        Also Explore
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <a
          href="/intelligence/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Intelligence Dashboard
          <span className="block mt-1 font-normal text-text-secondary">
            Live market signals and threat detection
          </span>
        </a>
        <a
          href="/earnings/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Earnings Scanner
          <span className="block mt-1 font-normal text-text-secondary">
            Upcoming earnings catalysts
          </span>
        </a>
        <a
          href="/deadlines/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Deadline Tracker
          <span className="block mt-1 font-normal text-text-secondary">
            Key dates and regulatory milestones
          </span>
        </a>
        <a
          href="/research/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-border-active hover:-translate-y-0.5"
        >
          Research Library
          <span className="block mt-1 font-normal text-text-secondary">
            analysis analysis and data reports
          </span>
        </a>
      </div>
    </section>
  );
}
