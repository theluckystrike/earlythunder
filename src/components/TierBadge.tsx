import type { Tier } from "@/lib/types";
import { getTierBgColor, getTierLabel } from "@/lib/format";

interface TierBadgeProps {
  readonly tier: Tier;
}

export default function TierBadge({ tier }: TierBadgeProps) {
  if (tier < 1 || tier > 3) {
    return <span className="text-xs text-text-secondary">—</span>;
  }

  const colorClass = getTierBgColor(tier);
  const label = getTierLabel(tier);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
