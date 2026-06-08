"use client";

import { CheckCircle2, Loader2, Clock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

type AppStatus = "idle" | "processing" | "eligible";

interface ApplicationStatusBarProps {
  status: AppStatus;
  /** Headline confidence percentage shown on the right (eligible state). */
  confidence?: number;
}

/**
 * ApplicationStatusBar — slim, full-width top status bar.
 *
 * Purpose: a stakeholder grasps the underwriting OUTCOME in 3-5 seconds.
 *   LEFT  = "APPLICATION STATUS" label + a strong status BADGE (the headline).
 *   RIGHT = "Confidence Score" + big % + optional "LOW RISK" chip.
 *
 * States:
 *   idle       → muted, calm ("Menunggu Pengajuan").
 *   processing → spinning Loader2, bri-blue ("MEMPROSES…").
 *   eligible   → bold emerald "VERIFIED & ELIGIBLE" + soft glow,
 *                large confidence %, and an emerald "LOW RISK" chip.
 *
 * Fixed ~44px height (h-11), no internal scroll; uses flex to fill width.
 * Subtle framer-motion only: badge fade/scale-in + gentle status-dot pulse.
 */
export function ApplicationStatusBar({
  status,
  confidence = 94,
}: ApplicationStatusBarProps) {
  const isEligible = status === "processing" ? false : status === "eligible";
  const isProcessing = status === "processing";

  // Per-state presentation config (badge text, icon, color tone, dot color).
  const config = {
    idle: {
      label: "Menunggu Pengajuan",
      Icon: Clock,
      dot: "bg-bri-muted",
      badgeText: "text-bri-muted",
      badgeBg: "bg-bri-bubble",
      badgeBorder: "border-bri-line",
      iconClass: "text-bri-muted",
    },
    processing: {
      label: "MEMPROSES…",
      Icon: Loader2,
      dot: "bg-bri-blue",
      badgeText: "text-bri-blue",
      badgeBg: "bg-bri-bg",
      badgeBorder: "border-bri-blue/30",
      iconClass: "text-bri-blue animate-spin",
    },
    eligible: {
      label: "VERIFIED & ELIGIBLE",
      Icon: CheckCircle2,
      dot: "bg-emerald-500",
      badgeText: "text-emerald-700",
      badgeBg: "bg-emerald-50",
      badgeBorder: "border-emerald-500/40",
      iconClass: "text-emerald-600",
    },
  }[status];

  const { Icon } = config;

  return (
    <div
      className={cn(
        "relative flex h-11 w-full items-center justify-between overflow-hidden rounded-xl border bg-white px-3 shadow-soft transition-colors duration-500",
        isEligible
          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-50/60 via-white to-white"
          : isProcessing
          ? "border-bri-blue/25 bg-gradient-to-r from-bri-bg/60 via-white to-white"
          : "border-bri-line"
      )}
    >
      {/* Soft success glow — pinned to the left edge behind the badge. */}
      {isEligible && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-emerald-400/10 to-transparent"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── LEFT: status label + headline badge ─────────────────────── */}
      <div className="relative z-10 flex min-w-0 items-center gap-2.5">
        <span className="hidden shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted sm:block">
          Application Status
        </span>

        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-bri-line sm:block" />

        {/* Pulsing status dot */}
        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
          {(isProcessing || isEligible) && (
            <motion.span
              className={cn("absolute inset-0 rounded-full", config.dot)}
              animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <span className={cn("relative h-2 w-2 rounded-full", config.dot)} />
        </span>

        {/* Headline BADGE — the outcome a stakeholder reads first. */}
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, scale: 0.94, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-pill border px-2.5 py-1",
              config.badgeBg,
              config.badgeBorder,
              isEligible && "shadow-[0_0_0_3px_rgba(16,185,129,0.10)]"
            )}
          >
            <Icon size={14} strokeWidth={2.5} className={cn("shrink-0", config.iconClass)} />
            <span
              className={cn(
                "truncate text-[12px] font-bold uppercase tracking-[0.04em] leading-none",
                config.badgeText
              )}
            >
              {config.label}
            </span>
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── RIGHT: confidence score + low-risk chip ─────────────────── */}
      <div className="relative z-10 flex shrink-0 items-center gap-3">
        <AnimatePresence mode="wait">
          {isEligible ? (
            <motion.div
              key="confidence"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              {/* Confidence score */}
              <div className="flex items-baseline gap-1.5">
                <span className="hidden text-[9px] font-semibold uppercase tracking-[0.10em] text-bri-muted sm:block">
                  Confidence Score
                </span>
                <span className="text-[22px] font-bold leading-none text-emerald-600 tabular-nums">
                  {confidence}
                  <span className="text-[13px] font-semibold">%</span>
                </span>
              </div>

              {/* LOW RISK chip */}
              <span className="flex shrink-0 items-center gap-1 rounded-pill border border-emerald-500/40 bg-emerald-500 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                <ShieldCheck size={11} strokeWidth={2.5} />
                Low Risk
              </span>
            </motion.div>
          ) : isProcessing ? (
            <motion.span
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] font-medium italic text-bri-blue/80"
            >
              Menganalisis dokumen &amp; skor risiko…
            </motion.span>
          ) : (
            <motion.span
              key="awaiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] italic text-bri-muted/70"
            >
              Confidence Score: —
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
