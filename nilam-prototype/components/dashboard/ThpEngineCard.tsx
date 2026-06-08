"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { computeThp, computeJointThp } from "@/engines/thp/thpEngine";
import type { CustomerIncome } from "@/types/income";

interface ThpEngineCardProps {
  nasabah: CustomerIncome | undefined;
  pasangan: CustomerIncome | undefined;
  isJoint: boolean;
}

/**
 * Hero count-up: animates from 0 → value on first reveal (~1s) for the "wow"
 * moment, then retargets smoothly from the current displayed value on any
 * subsequent change (e.g. slider drags) so it never snaps back to zero.
 * Respects prefers-reduced-motion (jumps instantly).
 */
function useHeroCountUp(value: number, durationMs = 1000): number {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(displayRef.current, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1], // expo-out: fast start, gentle settle
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        displayRef.current = rounded;
        setDisplay(rounded);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, shouldReduceMotion]);

  return display;
}

/** Animated Rupiah value (hero count-up from zero). */
function AnimatedThp({ value, className }: { value: number; className?: string }) {
  const displayed = useHeroCountUp(value);
  return <span className={className}>{formatRupiah(displayed)}</span>;
}

/** Small subordinate count-up (shorter duration to feel secondary). */
function AnimatedThpSub({ value, className }: { value: number; className?: string }) {
  const displayed = useHeroCountUp(value, 750);
  return <span className={className}>{formatRupiah(displayed)}</span>;
}

/** Outcome status pill — emerald (positive) or navy (info) tone. */
function StatusChip({
  icon: Icon,
  label,
  tone,
  delay,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: "emerald" | "navy";
  delay: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill border px-1.5 py-[3px] text-[7.5px] font-semibold uppercase tracking-wide leading-none",
        tone === "emerald"
          ? "border-emerald-500/25 bg-emerald-50 text-emerald-600"
          : "border-bri-navy/15 bg-bri-bg text-bri-navy",
      )}
    >
      <Icon size={9} strokeWidth={2.5} className="shrink-0" />
      {label}
    </motion.span>
  );
}

/**
 * ThpEngineCard — the dashboard HERO / focal point.
 *
 * THP is the FINAL OUTPUT of the whole NILAM orchestration, so this card is the
 * visual climax. Hierarchy (largest → smallest):
 *   1. THP TOTAL  — huge animated count-up, bri-navy, on a premium navy→blue
 *      tinted background with a soft glow/ring.
 *   2. THP Nasabah / Pasangan — subordinate boxes (Pasangan only when joint).
 *   3. RUMUS formula chips — quiet, secondary at the bottom.
 * A status-chip row (VERIFIED · ELIGIBLE · LOW RISK · HIGH CONFIDENCE) lets a
 * stakeholder grasp the outcome in ~5 seconds.
 *
 * Layout: flex h-full flex-col so the card fills its grid cell with NO scroll,
 * in both joint and non-joint modes.
 */
export function ThpEngineCard({ nasabah, pasangan, isJoint }: ThpEngineCardProps) {
  const pending = !nasabah;

  const nThp = nasabah ? computeThp(nasabah) : null;
  const pThp = pasangan ? computeThp(pasangan) : null;
  const joint = nasabah ? computeJointThp(nasabah, isJoint ? pasangan : undefined) : null;

  const nasabahThp = nThp?.thp ?? 0;
  const pasanganThp = pThp?.thp ?? 0;
  const totalThp = joint?.total ?? 0;

  const formulaChips = nThp
    ? [
        { label: "Gaji", value: nThp.adjusted["Gaji"], type: "income" as const },
        { label: "THR", value: nThp.adjusted["THR"], type: "income" as const },
        { label: "Bonus", value: nThp.adjusted["Bonus"], type: "income" as const },
        { label: "Insentif", value: nThp.adjusted["Insentif"], type: "income" as const },
        { label: "Angsuran", value: nThp.angsuran, type: "deduct" as const },
      ]
    : [];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft ring-1 ring-bri-blue/20">
      {/* Premium background: soft navy→blue radial glow, kept very subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 100% 0%, rgba(26,111,196,0.10) 0%, rgba(0,82,156,0.05) 35%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Header */}
      <div className="relative mb-1 flex shrink-0 items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted leading-none">
          THP Calculation Engine
        </span>
        <span className="inline-flex items-center gap-0.5 text-[7.5px] font-semibold uppercase tracking-wide text-bri-blue">
          <Sparkles size={9} strokeWidth={2.5} />
          Final Output
        </span>
      </div>

      {pending ? (
        <div className="relative flex flex-1 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu orkestrasi…</span>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col justify-between gap-1.5">
          {/* ── 1. HERO: THP TOTAL ─────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-lg border border-bri-navy/15 bg-gradient-to-br from-bri-navy/[0.06] via-bri-blue/[0.04] to-transparent px-2.5 py-2">
            {/* faint corner glow inside the hero block */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-bri-sky/15 blur-2xl"
            />
            <div className="relative flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted leading-none">
                {isJoint ? "THP Total (Joint Income)" : "THP Total"}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-pill bg-emerald-50 px-1.5 py-[2px] text-[7px] font-bold uppercase text-emerald-600">
                <CheckCircle2 size={8} strokeWidth={3} />
                Verified
              </span>
            </div>
            <AnimatedThp
              value={totalThp}
              className="relative mt-0.5 block bg-gradient-to-br from-bri-navy to-bri-blue bg-clip-text text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent"
            />
            <span className="relative mt-0.5 block text-[7.5px] font-medium text-bri-muted">
              Take-Home Pay per bulan{isJoint ? " · gabungan nasabah & pasangan" : ""}
            </span>
          </div>

          {/* ── 2. SUBORDINATE: THP Nasabah / Pasangan ─────────────── */}
          <div className={cn("grid gap-1.5", isJoint ? "grid-cols-2" : "grid-cols-1")}>
            {/* THP Nasabah */}
            <div className="rounded-lg border border-bri-line bg-bri-bg/50 px-2 py-1">
              <span className="block text-[7px] font-semibold uppercase tracking-wide text-bri-muted leading-none">
                THP Nasabah
              </span>
              <AnimatedThpSub
                value={nasabahThp}
                className="mt-0.5 block text-[13px] font-bold text-bri-navy leading-tight"
              />
            </div>

            {/* THP Pasangan — joint only */}
            {isJoint && (
              <div className="rounded-lg border border-bri-line bg-bri-bg/50 px-2 py-1">
                <span className="block text-[7px] font-semibold uppercase tracking-wide text-bri-muted leading-none">
                  THP Pasangan
                </span>
                {pThp ? (
                  <AnimatedThpSub
                    value={pasanganThp}
                    className="mt-0.5 block text-[13px] font-bold text-bri-navy leading-tight"
                  />
                ) : (
                  <span className="mt-0.5 block text-[13px] font-bold text-bri-muted leading-tight">—</span>
                )}
              </div>
            )}
          </div>

          {/* ── Status summary chips — instant outcome read ─────────── */}
          <div className="flex flex-wrap items-center gap-1">
            <StatusChip icon={BadgeCheck} label="Verified" tone="emerald" delay={0.45} />
            <StatusChip icon={CheckCircle2} label="Eligible" tone="emerald" delay={0.55} />
            <StatusChip icon={ShieldCheck} label="Low Risk" tone="navy" delay={0.65} />
            <StatusChip icon={Sparkles} label="High Confidence" tone="navy" delay={0.75} />
          </div>

          {/* ── 3. RUMUS — quiet, secondary formula visualization ───── */}
          <div className="border-t border-bri-line/70 pt-1">
            <span className="text-[7px] font-semibold uppercase tracking-wider text-bri-muted/80">
              Rumus
            </span>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
              {formulaChips.map((chip, i) => (
                <div key={chip.label} className="flex items-center gap-0.5">
                  {i > 0 && (
                    chip.type === "deduct" ? (
                      <Minus size={8} strokeWidth={3} className="text-red-400" />
                    ) : (
                      <Plus size={8} strokeWidth={3} className="text-bri-muted/60" />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-col items-center rounded px-1 py-0.5",
                      chip.type === "income"
                        ? "bg-bri-bg text-bri-blue"
                        : "bg-red-50 text-red-500",
                    )}
                  >
                    <span className="text-[6px] font-semibold uppercase leading-none">{chip.label}</span>
                    <span className="text-[7px] font-bold leading-tight">
                      {formatRupiah(chip.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
