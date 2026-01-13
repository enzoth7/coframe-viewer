"use client";

import { joyrideWide } from "@/app/fonts";

export type Segment = {
  label: string;
  value: number;
  color?: string;
  brandId?: string;
};

type FuturisticDonutProps = {
  segments: Segment[];
  costoPorMarca?: Record<string, number>;
  costoExtraPorMarca?: Record<string, number>;
  cpsPorMarca?: Record<string, number>;
};

const COLORS = [
  "#29A9FF",
  "#6C5BFF",
  "#38FFD9",
  "#FF8F3F",
  "#6FFFA3",
];

const SIZE = 360;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 120;
const STROKE_WIDTH = 40;
const INNER_GLOW_RADIUS = 80;
const GAP_RATIO = 0.015;

const formatLegendCurrency = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "$0.00";
  }
  return `$${value.toFixed(2)}`;
};

export default function FuturisticDonut({
  segments,
  costoPorMarca,
  costoExtraPorMarca,
  cpsPorMarca,
}: FuturisticDonutProps) {
  const normalizedSegments = segments.map((segment) => ({
    ...segment,
    value: Math.max(0, segment.value || 0),
  }));

  const total = normalizedSegments.reduce(
    (sum, segment) => sum + segment.value,
    0,
  );

  if (!total) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/50 p-6 text-center text-sm text-white/60">
        Asigna segundos a las marcas para ver el grafico
      </div>
    );
  }

  const filteredSegments = normalizedSegments.filter(
    (segment) => segment.value > 0,
  );


  const circumference = 2 * Math.PI * RADIUS;
  const gapLength = circumference * GAP_RATIO;

  const computeSegmentLength = (value: number) => {
    const ratio = value / total;
    const rawLength = circumference * ratio;
    return Math.max(0, rawLength - gapLength);
  };

  const getOffsetForIndex = (segmentIndex: number) => {
    if (segmentIndex === 0) {
      return 0;
    }
    return filteredSegments
      .slice(0, segmentIndex)
      .reduce(
        (sum, prev) => sum + computeSegmentLength(prev.value) + gapLength,
        0,
      );
  };

  const arcSegments = filteredSegments
    .map((segment, index) => {
      const segmentLength = computeSegmentLength(segment.value);

      if (segmentLength <= 0) return null;

      const color = segment.color ?? COLORS[index % COLORS.length];

      const config = {
        gradientId: `segment-gradient-${index}`,
        color,
        length: segmentLength,
        offset: getOffsetForIndex(index),
        brandId: segment.brandId,
      };

      return config;
    })
    .filter(
      (
        entry,
      ): entry is {
        gradientId: string;
        color: string;
        length: number;
        offset: number;
        brandId?: string;
      } => Boolean(entry),
    );

  const LEGEND_ITEMS = filteredSegments.map((segment, index) => ({
    ...segment,
    color: segment.color ?? COLORS[index % COLORS.length],
    percentage: total > 0 ? (segment.value / total) * 100 : 0,
  }));

  return (
    <div
      className={`${joyrideWide.variable} rounded-3xl border border-white/10 bg-gradient-to-b from-black/70 to-zinc-900/40 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)]`}
    >
      <div className="relative mx-auto flex h-[360px] w-[360px] items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="drop-shadow-[0_0_35px_rgba(0,0,0,0.9)]"
        >
          <defs>
            {/* Inner glow */}
            <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,122,26,1)" />
              <stop offset="40%" stopColor="rgba(255,122,26,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Segment glow */}
            <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Segment gradients */}
            {arcSegments.map((segment) => (
              <linearGradient
                key={segment.gradientId}
                id={segment.gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={segment.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={segment.color} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>

          <circle cx={CX} cy={CY} r={RADIUS + STROKE_WIDTH / 2} fill="#050509" />

          <g
            transform={`rotate(-90 ${CX} ${CY})`}
            className="origin-center animate-spin-slow"
          >
            {[...arcSegments].reverse().map((segment) => (
              <circle
                key={segment.gradientId}
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={`url(#${segment.gradientId})`}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${circumference}`}
                strokeDashoffset={-segment.offset}
                filter="url(#arcGlow)"
              />
            ))}
          </g>

          <circle cx={CX} cy={CY} r={INNER_GLOW_RADIUS + 18} fill="#050509" />
          <circle cx={CX} cy={CY} r={INNER_GLOW_RADIUS} fill="url(#innerGlow)" />

          <text
            x={CX}
            y={CY - 2}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="40"
            className="font-joyride-wide"
          >
            CO
          </text>
          <text
            x={CX}
            y={CY + 22}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="16"
            className="font-joyride-wide"
          >
            FRAME
          </text>
        </svg>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {LEGEND_ITEMS.map((segment, index) => (
          <div
            key={`legend-${index}`}
            className="rounded-2xl border border-white/10 bg-black/30 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate text-base font-semibold text-white">
                  {segment.label}
                </span>
              </div>
              <span
                className="text-base font-semibold"
                style={{ color: segment.color }}
              >
                {segment.value}s | {segment.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-zinc-200">
              <div className="flex justify-between">
                <span>Costo de marca:</span>
                <span className="font-semibold text-amber-300">
                  {formatLegendCurrency(
                    costoPorMarca?.[segment.brandId ?? ""] ?? 0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Costo extra:</span>
                <span className="font-semibold text-amber-300">
                  {formatLegendCurrency(
                    costoExtraPorMarca?.[segment.brandId ?? ""] ?? 0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CPS:</span>
                <span className="font-semibold text-amber-300">
                  {formatLegendCurrency(cpsPorMarca?.[segment.brandId ?? ""])}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
