import type { Tier } from "@/lib/types";

interface TierBadgeProps {
  readonly tier: Tier;
}

/** Tier indicator using brightness hierarchy. No backgrounds, no borders. */
export default function TierBadge({ tier }: TierBadgeProps) {
  if (tier < 1 || tier > 3) {
    return null;
  }

  const colorClass = getTierColor(tier);

  return (
    <span className={`font-mono text-xs font-bold ${colorClass}`}>
      T{tier}
    </span>
  );
}

function getTierColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    1: "text-text-primary",
    2: "text-text-secondary",
    3: "text-text-tertiary",
  };
  return colors[tier] ?? "text-text-tertiary";
}
