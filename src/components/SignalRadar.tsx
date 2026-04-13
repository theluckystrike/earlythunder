import type { Signals } from "@/lib/types";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";

interface SignalRadarProps {
  readonly signals: Signals;
  readonly size?: number;
}

const TOTAL_SIGNALS = 8;
const DEFAULT_SIZE = 300;
const CENTER_OFFSET = 150;
const RADIUS = 120;
const LABEL_RADIUS = 140;

/** SVG radar/spider chart visualizing 8 signal scores. */
export default function SignalRadar({
  signals,
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
        <DataPoints points={points} signals={signals} />
        <SignalLabels signals={signals} />
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
      x: CENTER_OFFSET + Math.cos(angle) * RADIUS * value,
      y: CENTER_OFFSET + Math.sin(angle) * RADIUS * value,
    };
  });
}

function GridRings({
  levels,
}: {
  readonly levels: readonly number[];
}) {
  return (
    <g>
      {levels.map((level) => {
        const ringPoints = Array.from({ length: TOTAL_SIGNALS }, (_, i) => {
          const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
          const x = CENTER_OFFSET + Math.cos(angle) * RADIUS * level;
          const y = CENTER_OFFSET + Math.sin(angle) * RADIUS * level;
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={ringPoints}
            fill="none"
            stroke="#1E293B"
            strokeWidth="1"
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
        const x2 = CENTER_OFFSET + Math.cos(angle) * RADIUS;
        const y2 = CENTER_OFFSET + Math.sin(angle) * RADIUS;
        return (
          <line
            key={i}
            x1={CENTER_OFFSET}
            y1={CENTER_OFFSET}
            x2={x2}
            y2={y2}
            stroke="#1E293B"
            strokeWidth="1"
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
      fill="rgba(245, 166, 35, 0.15)"
      stroke="#F5A623"
      strokeWidth="2"
    />
  );
}

function DataPoints({
  points,
  signals,
}: {
  readonly points: readonly { x: number; y: number }[];
  readonly signals: Signals;
}) {
  return (
    <g>
      {points.map((point, i) => {
        const key = SIGNAL_KEYS[i];
        if (!key) return null;
        const value = signals[key] ?? 0;
        return (
          <circle
            key={key}
            cx={point.x}
            cy={point.y}
            r={value >= 80 ? 4 : 3}
            fill={value >= 80 ? "#22C55E" : "#F5A623"}
            stroke="#0B0F1A"
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

function SignalLabels({
  signals,
}: {
  readonly signals: Signals;
}) {
  return (
    <g>
      {SIGNAL_KEYS.map((key, i) => {
        const angle = (Math.PI * 2 * i) / TOTAL_SIGNALS - Math.PI / 2;
        const x = CENTER_OFFSET + Math.cos(angle) * LABEL_RADIUS;
        const y = CENTER_OFFSET + Math.sin(angle) * LABEL_RADIUS;
        const value = signals[key] ?? 0;
        const anchor = x < CENTER_OFFSET - 10 ? "end" : x > CENTER_OFFSET + 10 ? "start" : "middle";

        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-text-secondary text-[8px]"
          >
            {SIGNAL_LABELS[key]} ({value})
          </text>
        );
      })}
    </g>
  );
}
