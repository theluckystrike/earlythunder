/**
 * Analytics placeholder component.
 * Renders a tracking script tag when NEXT_PUBLIC_ANALYTICS_ID is configured.
 * Supports Cloudflare Web Analytics or Plausible.
 *
 * Usage:
 *   <Analytics /> in app/layout.tsx body
 *
 * Configure via environment variable:
 *   NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
 */

const ANALYTICS_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID ?? "";

const CLOUDFLARE_BEACON_URL =
  "https://static.cloudflareinsights.com/beacon.min.js" as const;
const PLAUSIBLE_SCRIPT_URL =
  "https://plausible.io/js/script.js" as const;

/** Detect analytics provider from the ID format. */
function getProviderUrl(analyticsId: string): string {
  if (typeof analyticsId !== "string" || analyticsId.length === 0) {
    return "";
  }
  // Cloudflare Web Analytics tokens are 32-char hex strings
  if (/^[a-f0-9]{32}$/i.test(analyticsId)) {
    return CLOUDFLARE_BEACON_URL;
  }
  // Plausible uses domain names as identifiers
  if (analyticsId.includes(".")) {
    return PLAUSIBLE_SCRIPT_URL;
  }
  // Default to Cloudflare
  return CLOUDFLARE_BEACON_URL;
}

export default function Analytics() {
  if (ANALYTICS_ID.length === 0) {
    return null;
  }

  const providerUrl = getProviderUrl(ANALYTICS_ID);

  if (providerUrl.length === 0) {
    return null;
  }

  // Cloudflare Web Analytics
  if (providerUrl === CLOUDFLARE_BEACON_URL) {
    return (
      <script
        defer
        src={providerUrl}
        data-cf-beacon={`{"token":"${ANALYTICS_ID}"}`}
      />
    );
  }

  // Plausible Analytics
  return (
    <script
      defer
      data-domain={ANALYTICS_ID}
      src={providerUrl}
    />
  );
}
