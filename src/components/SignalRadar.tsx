import type { Signals } from "@/lib/types";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";

interface SignalRadarProps {
  readonly signals: Signals;
  readonly compositeScore?: number;
  readonly size?: number;
}

const TOTAL_SIGNALS = 8;
const DEFAULT_SIZE = 300;
const CENTER = 150;
const RADIUS = 120;
const LABEL_RADIUS = 140;

/** Monochromatic SVG radar chart. White outline on near-black. */
export default function SignalRadar({
  signals,
  compositeScore,
  size = DEFAULT_SIZE,
}: SignalRadarProps) {
  if (!signals || typeof signals !== "object") {
    return null;
  }

  const points = computePolygonPoints(signals);
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${DEFAULT_SIZE} ${DEFAULT_SIZE}`}
        width={size}
        height={size}
        className="max-w-full"
        role="img"
        aria-label="Signal radar chart"
      >
        <GridRings levels={gridLevels} />
        <GridAxes />
        <DataPolygon points={points} />
        <SignalLabelsGroup signals={signals} />
        {typeof compositeScore === "number" && (
          <CenterScore score={compositeScore} />
        )}
      </svg>
    </div>
  );
}

function computePolygonPoints(
  signals: Signals,
): readonly { x: number; y: number }[] {
  return SIGNAL_KEYS.map((key, i) => {
    const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
    const value = Math.max(0, Math.min(100, signals[key] ?? 0)) / 100;
    return {
      x: CENTER + Math.cos(angle) * RADIUS * value,
      y: CENTER + Math.sin(angle) * RADIUS * value,
    };
  });
}

function GridRings({ levels }: { readonly levels: readonly number[] }) {
  return (
    <g>
      {levels.map((level) => {
        const ringPoints = Array.from({ length: TOTAL_SIGNALS }, (_, i) => {
          const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
          const x = CENTER + Math.cos(angle) * RADIUS * level;
          const y = CENTER + Math.sin(angle) * RADIUS * level;
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={ringPoints}
            fill="none"
            stroke="#222222"
            strokeWidth="0.5"
          />
        );
      })}
    </g>
  );
}

function GridAxes() {
  return (
    <g>
      {SIGNAL_KEYS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
        const x2 = CENTER + Math.cos(angle) * RADIUS;
        const y2 = CENTER + Math.sin(angle) * RADIUS;
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x2}
            y2={y2}
            stroke="#222222"
            strokeWidth="0.5"
          />
        );
      })}
    </g>
  );
}

function DataPolygon({
  points,
}: {
  readonly points: readonly { x: number; y: number }[];
}) {
  const polygonStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <polygon
      points={polygonStr}
      fill="rgba(255,255,255,0.05)"
      stroke="#F5F5F7"
      strokeWidth="1"
    />
  );
}

function SignalLabelsGroup({ signals }: { readonly signals: Signals }) {
  return (
    <g>
      {SIGNAL_KEYS.map((key, i) => {
        const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
        const x = CENTER + Math.cos(angle) * LABEL_RADIUS;
        const y = CENTER + Math.sin(angle) * LABEL_RADIUS;
        const value = signals[key] ?? 0;
        const anchor =
          x < CENTER - 10 ? "end" : x > CENTER + 10 ? "start" : "middle";

        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="central"
            fill="#48484A"
            fontFamily="monospace"
            fontSize="10"
          >
            {SIGNAL_LABELS[key]} ({value})
          </text>
        );
      })}
    </g>
  );
}

function CenterScore({ score }: { readonly score: number }) {
  return (
    <text
      x={CENTER}
      y={CENTER}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#F5F5F7"
      fontFamily="monospace"
      fontSize="18"
      fontWeight="600"
    >
      {Math.round(score)}
    </text>
  );
}
