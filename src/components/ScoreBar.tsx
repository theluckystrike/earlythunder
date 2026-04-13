import { formatScore, getScoreColor } from "@/lib/format";

interface ScoreBarProps {
  readonly score: number;
  readonly showLabel?: boolean;
}

/** Horizontal score bar with color gradient based on score value. */
export default function ScoreBar({ score, showLabel = true }: ScoreBarProps) {
  if (typeof score !== "number" || isNaN(score)) {
    return <span className="text-xs text-text-secondary">—</span>;
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const widthPercent = `${clampedScore}%`;
  const colorClass = getScoreColor(clampedScore);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${getBarBgColor(clampedScore)}`}
          style={{ width: widthPercent }}
        />
      </div>
      {showLabel && (
        <span className={`font-mono text-sm font-semibold ${colorClass}`}>
          {formatScore(clampedScore)}
        </span>
      )}
    </div>
  );
}

function getBarBgColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-amber";
  if (score >= 40) return "bg-warning";
  return "bg-danger";
}
