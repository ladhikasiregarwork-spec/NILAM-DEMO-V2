"use client";

import { motion } from "framer-motion";

interface SpiderChartProps {
  scores: number[];        // each 0..1
  labels?: string[];
  size?: number;           // outer SVG size in px (default 100)
}

/**
 * SpiderChart — pure-SVG radar/spider chart.
 *
 * Draws N evenly-spaced axes around a center point, 3 concentric grid rings,
 * and a filled translucent blue polygon connecting the scored points.
 * The data polygon animates scale-in via Framer Motion on mount.
 */
export function SpiderChart({ scores, labels, size = 100 }: SpiderChartProps) {
  const n = scores.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.78; // leave room for labels
  const rings = [0.33, 0.66, 1.0];

  // Angle for axis i: start at top (-π/2), spread evenly clockwise
  function axisAngle(i: number): number {
    return (2 * Math.PI * i) / n - Math.PI / 2;
  }

  // Convert polar (r, angle) to SVG x/y
  function toXY(r: number, angle: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Build polygon points string from scores
  function buildPolygonPoints(scoresArr: number[]): string {
    return scoresArr
      .map((s, i) => {
        const r = Math.max(0, Math.min(1, s)) * maxR;
        const [x, y] = toXY(r, axisAngle(i));
        return `${x},${y}`;
      })
      .join(" ");
  }

  // Build each ring as a polygon
  function buildRingPoints(frac: number): string {
    return Array.from({ length: n }, (_, i) => {
      const [x, y] = toXY(frac * maxR, axisAngle(i));
      return `${x},${y}`;
    }).join(" ");
  }

  const dataPoints = buildPolygonPoints(scores);
  const idlePoints = buildPolygonPoints(scores.map(() => 0.05));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Grid rings */}
      {rings.map((frac, ri) => (
        <polygon
          key={ri}
          points={buildRingPoints(frac)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={0.8}
        />
      ))}

      {/* Axis spokes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = toXY(maxR, axisAngle(i));
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Data polygon — animated scale-in, bri-navy stroke/fill */}
      <motion.polygon
        points={dataPoints}
        fill="rgba(0,82,156,0.12)"
        stroke="#00529C"
        strokeWidth={1.4}
        strokeLinejoin="round"
        initial={{ points: idlePoints, opacity: 0 }}
        animate={{ points: dataPoints, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Score dots */}
      {scores.map((s, i) => {
        const r = Math.max(0, Math.min(1, s)) * maxR;
        const [x, y] = toXY(r, axisAngle(i));
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={2.2}
            fill="#00529C"
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: 1, r: 2.2 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.07 }}
          />
        );
      })}

      {/* Optional axis labels */}
      {labels &&
        labels.map((lbl, i) => {
          const labelR = maxR + 9;
          const [x, y] = toXY(labelR, axisAngle(i));
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6"
              fill="#6B7280"
            >
              {lbl}
            </text>
          );
        })}
    </svg>
  );
}
