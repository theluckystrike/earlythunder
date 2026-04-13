import type { Tier, AssetClass } from "./types";

/** Format a composite score (0-100) as a display string. */
export function formatScore(score: number): string {
  if (typeof score !== "number" || isNaN(score)) return "—";
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return String(clamped);
}

/** Get the color class for a score value. */
export function getScoreColor(score: number): string {
  if (typeof score !== "number" || isNaN(score)) return "text-text-secondary";
  if (score >= 70) return "text-score-high";
  if (score >= 40) return "text-score-mid";
  return "text-score-low";
}

/** Get the background color class for a tier badge. */
export function getTierBgColor(tier: Tier): string {
  const tierColors: Record<Tier, string> = {
    1: "bg-success/20 text-success border-success/30",
    2: "bg-amber/20 text-amber border-amber/30",
    3: "bg-danger/20 text-danger border-danger/30",
  };
  return tierColors[tier] ?? "bg-text-secondary/20 text-text-secondary";
}

/** Get human-readable tier label. */
export function getTierLabel(tier: Tier): string {
  const labels: Record<Tier, string> = {
    1: "Tier 1",
    2: "Tier 2",
    3: "Tier 3",
  };
  return labels[tier] ?? "Unknown";
}

/** Get human-readable asset class label. */
export function getAssetClassLabel(assetClass: AssetClass): string {
  const labels: Record<AssetClass, string> = {
    digital_assets: "Digital Assets",
    public_equities: "Public Equities",
    private_markets: "Private Markets",
  };
  return labels[assetClass] ?? "Unknown";
}

/** Format a USD price for display. Handles sub-dollar and large values. */
export function formatPrice(price: number | null): string {
  if (price === null || typeof price !== "number" || isNaN(price)) return "—";
  if (price < 0.01) return `$${price.toPrecision(4)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a market cap value for display (e.g. $1.2B, $340.5M). */
export function formatMarketCap(cap: number | null): string {
  if (cap === null || typeof cap !== "number" || isNaN(cap)) return "—";
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(1)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(1)}M`;
  if (cap >= 1_000) return `$${(cap / 1_000).toFixed(1)}K`;
  return `$${cap.toFixed(0)}`;
}

/** Format a 24h volume value for display (e.g. $45.2M). */
export function formatVolume(vol: number | null): string {
  if (vol === null || typeof vol !== "number" || isNaN(vol)) return "—";
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

/** Format a date string for display. */
export function formatDate(dateStr: string): string {
  if (typeof dateStr !== "string" || dateStr.length === 0) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
