"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NodeStatus } from "@/types/orchestration";
import type { FraudResult } from "@/types/engines";

interface FraudDetectionCardProps {
  status: NodeStatus;
  result: FraudResult | undefined;
  /** True when card is in a 2-col row (wider); adjusts interior proportions */
  isWide?: boolean;
}

/** Placeholder labels shown while the engine is idle / running. */
const PLACEHOLDER_CHECKS = [
  "Slip Gaji Authentic",
  "Mutasi Valid (12 Bulan)",
  "Consistency Check",
  "Pattern Analysis",
];

/**
 * Returns the bar/text accent for a confidence score.
 * High (>=0.9) → emerald (strong/passed). Medium → bri-blue. Low → amber.
 */
function tone(score: number) {
  if (score >= 0.9) {
    return {
      bar: "from-emerald-400 to-emerald-600",
      pct: "text-emerald-600",
      icon: "text-emerald-500",
      passed: true,
    };
  }
  if (score >= 0.7) {
    return {
      bar: "from-bri-sky to-bri-blue",
      pct: "text-bri-blue",
      icon: "text-bri-blue",
      passed: true,
    };
  }
  return {
    bar: "from-amber-400 to-amber-600",
    pct: "text-amber-600",
    icon: "text-amber-500",
    passed: false,
  };
}

/**
 * FraudDetectionCard — Row B, first column.
 *
 * Layout: flex h-full flex-col so card fills its grid cell (no internal scroll).
 * Header shrink-0; body flex-1 distributing confidence bars evenly;
 * Overall Confidence pinned at bottom with a track bar.
 *
 * Success: per-check animated horizontal confidence bars (emerald = strong),
 * each with a validation check icon, then a prominent overall confidence.
 * Idle/running: faint placeholder bars with a subtle shimmer + "Menunggu…".
 */
export function FraudDetectionCard({ status, result, isWide = false }: FraudDetectionCardProps) {
  const isSuccess = status === "success" && !!result;
  const isRunning = status === "running";

  const overallPct = isSuccess ? Math.round(result.overall * 100) : 0;
  const passedCount = isSuccess
    ? result.checks.filter((c) => tone(c.score).passed).length
    : 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-bri-navy to-bri-blue shadow-sm">
            <ShieldCheck size={10} className="text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            Fraud Detection
          </span>
        </div>
        {isSuccess && (
          <span className="flex items-center gap-1 rounded-pill bg-emerald-50 px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 size={8} strokeWidth={3} />
            {passedCount}/{result.checks.length} Lolos
          </span>
        )}
      </div>

      {/* ── Idle / running state ──────────────────────────────────── */}
      {!isSuccess ? (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="flex flex-1 flex-col justify-between gap-1.5">
            {PLACEHOLDER_CHECKS.map((lbl) => (
              <div key={lbl} className="flex flex-col gap-0.5">
                <span className="text-[8.5px] font-medium text-bri-muted/40">{lbl}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bri-bg">
                  {isRunning && (
                    <motion.div
                      className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-bri-sky/50 to-transparent"
                      animate={{ x: ["-120%", "320%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex shrink-0 items-center gap-1.5 border-t border-bri-line pt-1.5">
            <span className="text-[8.5px] text-bri-muted/60">Overall Confidence</span>
            <span className="text-[8px] italic text-bri-muted/40">
              {isRunning ? "Menganalisis…" : "Menunggu…"}
            </span>
          </div>
        </div>
      ) : (
        /* ── Success state ───────────────────────────────────────── */
        <div className="flex flex-1 flex-col min-h-0">
          {/* Confidence bars — fill available height, distribute evenly */}
          <div className="flex flex-1 flex-col justify-between gap-1.5">
            {result.checks.map((check, i) => {
              const pct = Math.round(check.score * 100);
              const t = tone(check.score);
              return (
                <div key={check.name} className="flex flex-col gap-0.5">
                  {/* Label row: name + validation icon left, % right */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <CheckCircle2
                        size={isWide ? 11 : 10}
                        className={cn("shrink-0", t.icon)}
                        strokeWidth={2.5}
                      />
                      <span className={cn("truncate font-medium text-bri-ink", isWide ? "text-[10px]" : "text-[9px]")}>
                        {check.name}
                      </span>
                    </div>
                    <span className={cn("shrink-0 font-semibold tabular-nums", t.pct, isWide ? "text-[11px]" : "text-[10px]")}>
                      {pct}%
                    </span>
                  </div>

                  {/* Animated confidence bar (scaleX → reliable inside flex) */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bri-bg">
                    <motion.div
                      key={`fill-${check.name}`}
                      className={cn("h-full w-full origin-left rounded-full bg-gradient-to-r", t.bar)}
                      initial={{ scaleX: 0, x: 0 }}
                      animate={{ scaleX: check.score, x: 0 }}
                      transition={{ duration: 0.7, delay: 0.12 * i, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall confidence — pinned at bottom */}
          <div className="mt-2 shrink-0 border-t border-bri-line pt-1.5">
            <div className="flex items-end justify-between">
              <span className="text-[9px] font-medium text-bri-muted">Overall Confidence</span>
              <span className={cn("font-bold leading-none text-emerald-500 tabular-nums", isWide ? "text-[24px]" : "text-[20px]")}>
                {overallPct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bri-bg">
              <motion.div
                className="h-full w-full origin-left rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: result.overall }}
                transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
