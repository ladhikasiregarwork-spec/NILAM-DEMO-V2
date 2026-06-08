"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Users,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface AiInsightCardProps {
  /** Include the joint-income insight when true. */
  isJoint?: boolean;
  /** When false, render a subtle "waiting for analysis" placeholder. Defaults to true. */
  ready?: boolean;
}

interface Insight {
  icon: LucideIcon;
  text: string;
  /** Optional trailing chip (used to highlight a key conclusion). */
  chip?: string;
  /** Stronger visual weight for hero conclusions. */
  emphasis?: boolean;
}

/**
 * AiInsightCard — premium "AI Underwriting Insight" panel.
 *
 * Shows the AI's CONCLUSIONS (not the workflow), so NILAM reads as an
 * intelligent reasoning engine rather than a process dashboard.
 *
 * Layout: flex h-full flex-col so the card fills its grid cell with no scroll.
 * Header (shrink-0) carries a softly shimmering AI glyph + "reasoning" tag.
 * Body (flex-1) distributes insight bullets with justify-between; bullets
 * stagger in via framer-motion. One hero conclusion (affordability HIGH)
 * is highlighted with an emerald chip for hierarchy.
 *
 * Designed for a NARROW column (~200px).
 */
export function AiInsightCard({ isJoint = false, ready = true }: AiInsightCardProps) {
  // Self-contained demo insights (AI conclusions).
  const insights: Insight[] = [
    { icon: CheckCircle2, text: "Konsistensi penghasilan stabil" },
    { icon: ShieldCheck, text: "Probabilitas fraud rendah" },
    { icon: CheckCircle2, text: "Pola payroll terverifikasi" },
    ...(isJoint
      ? [
          {
            icon: Users,
            text: "Joint income menaikkan eligibility",
          } as Insight,
        ]
      : []),
    {
      icon: TrendingUp,
      text: "Estimasi affordability",
      chip: "HIGH",
      emphasis: true,
    },
    { icon: Gauge, text: "Debt ratio dalam ambang aman" },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Faint AI gradient accent — top-right glow, kept subtle/executive */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-bri-sky/20 via-bri-blue/10 to-transparent blur-xl"
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative z-10 mb-1.5 flex shrink-0 items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* AI glyph in a navy-accent chip with a soft shimmer pulse */}
          <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-bri-navy to-bri-blue shadow-sm">
            <Sparkles size={9} className="text-white" strokeWidth={2.5} />
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-md ring-1 ring-bri-sky/60"
              animate={{ opacity: [0, 0.7, 0], scale: [0.9, 1.25, 1.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
          </span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            AI Underwriting Insight
          </span>
        </div>

        {/* "reasoning" tag */}
        <span className="flex shrink-0 items-center gap-0.5 rounded-pill bg-bri-bg px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-bri-navy">
          <motion.span
            aria-hidden
            className="h-1 w-1 rounded-full bg-bri-blue"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Reasoning
        </span>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      {!ready ? (
        /* Idle / waiting placeholder */
        <div className="relative z-10 flex flex-1 flex-col justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5 opacity-40">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-bri-line" />
              <div
                className="h-1.5 rounded-full bg-bri-line"
                style={{ width: `${70 - i * 8}%` }}
              />
            </div>
          ))}
          <p className="mt-1 text-[8px] italic text-bri-muted/50">
            Menunggu analisis…
          </p>
        </div>
      ) : (
        /* Conclusions — staggered fade-in, distributed to fill height */
        <motion.ul
          className="relative z-10 flex flex-1 flex-col justify-between gap-1"
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
          {insights.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.li
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -6 },
                  show: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md",
                  it.emphasis &&
                    "border border-emerald-200 bg-emerald-50/70 px-1.5 py-1",
                )}
              >
                <Icon
                  size={it.emphasis ? 12 : 11}
                  strokeWidth={2.4}
                  className={cn(
                    "shrink-0",
                    it.emphasis ? "text-emerald-600" : "text-bri-blue",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate leading-tight",
                    it.emphasis
                      ? "text-[9.5px] font-semibold text-bri-ink"
                      : "text-[9px] font-medium text-bri-ink",
                  )}
                >
                  {it.text}
                </span>
                {it.chip && (
                  <span className="shrink-0 rounded-pill bg-emerald-500 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {it.chip}
                  </span>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      {/* ── Footer — AI confidence signature, pinned bottom ─────── */}
      {ready && (
        <div className="relative z-10 mt-1.5 flex shrink-0 items-center justify-between border-t border-bri-line pt-1.5">
          <span className="text-[8px] text-bri-muted">Keyakinan model</span>
          <span className="flex items-center gap-1 text-[10px] font-bold leading-none text-bri-navy">
            <Sparkles size={9} className="text-bri-blue" strokeWidth={2.5} />
            96%
          </span>
        </div>
      )}
    </div>
  );
}
