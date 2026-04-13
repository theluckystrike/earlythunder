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
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-amber";
  if (score >= 40) return "text-warning";
  return "text-danger";
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
