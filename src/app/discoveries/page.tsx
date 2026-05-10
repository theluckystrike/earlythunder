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
  return <Dashboard1000x />;
}
