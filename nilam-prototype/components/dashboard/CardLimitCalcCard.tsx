"use client";

import { useState } from "react";
import { Calculator, Gauge, Wallet, Landmark, ArrowDownCircle, ArrowUpCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { grantedFromMax, type CardLimitBreakdown } from "@/lib/cardAnalytics";
import type { CardDecisionStatus } from "@/types/card";
import type { FlowStep } from "@/types/flow";

interface CardLimitCalcCardProps {
  breakdown: CardLimitBreakdown;
  cardDecision: CardDecisionStatus;
  /** Approve/reject; on approval passes the granted limit (pct × max). */
  onDecision: (decision: "approved" | "rejected", grantedLimit?: number) => void;
  currentStep: FlowStep;
}

const INPUT_ICONS = {
  score: Gauge,
  income: Wallet,
  slik: Landmark,
  credit: ArrowDownCircle,
  debit: ArrowUpCircle,
} as const;

/**
 * CardLimitCalcCard — the analyst's primary action in the reordered CC flow.
 * Shows the maximum-limit calculation from five inputs (application score,
 * income, SLIK, 30-day credit avg, 30-day debit avg), an editable "granted %"
 * control (default 80%), the resulting granted limit, and Approve/Reject.
 *
 * NOTE: the limit math is DUMMY (see lib/cardAnalytics.ts) pending a real model.
 */
export function CardLimitCalcCard({ breakdown, cardDecision, onDecision, currentStep }: CardLimitCalcCardProps) {
  const { inputs, maxLimit, parts } = breakdown;
  // Granted limit is the source of truth (analyst may type either the amount or
  // the %); the percentage is derived from it. Defaults to 80% of the maximum.
  const [grantedLimit, setGrantedLimit] = useState(() => grantedFromMax(maxLimit, 0.8));
  const pct = maxLimit > 0 ? grantedLimit / maxLimit : 0;
  const decided = cardDecision === "approved" || cardDecision === "rejected";

  const inputTiles: { key: keyof typeof INPUT_ICONS; label: string; value: string }[] = [
    { key: "score", label: "Skor Aplikasi", value: `${Math.round(inputs.applicationScore)}/100` },
    { key: "income", label: "Penghasilan / bln", value: formatRupiah(inputs.monthlyIncome) },
    { key: "slik", label: "Angsuran SLIK", value: formatRupiah(inputs.slikAngsuran) },
    { key: "credit", label: "Avg Kredit 30h", value: formatRupiah(inputs.creditTxnAvg30d) },
    { key: "debit", label: "Avg Debit 30h", value: formatRupiah(inputs.debitTxnAvg30d) },
  ];

  return (
    <div className="flex flex-col rounded-card border border-bri-line bg-white p-3 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-bri-bg text-bri-blue"><Calculator size={13} /></span>
        <h3 className="text-[12px] font-bold text-bri-navy">Perhitungan Maksimum Limit</h3>
        <span className="ml-auto rounded-pill bg-amber-100 px-1.5 py-px text-[7px] font-bold text-amber-700">DUMMY</span>
      </div>

      {/* Five inputs */}
      <div className="grid grid-cols-5 gap-1.5">
        {inputTiles.map((t) => {
          const Icon = INPUT_ICONS[t.key];
          return (
            <div key={t.key} className="rounded-lg border border-bri-line bg-bri-bg/40 px-2 py-1.5">
              <p className="flex items-center gap-0.5 text-[7px] uppercase tracking-[0.04em] text-bri-muted"><Icon size={9} className="text-bri-blue" /> {t.label}</p>
              <p className="mt-0.5 text-[10px] font-bold tabular-nums leading-tight text-bri-ink">{t.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_220px] gap-3">
        {/* Formula breakdown */}
        <div className="flex flex-col justify-center gap-1 rounded-lg border border-bri-line bg-white px-3 py-2">
          {parts.map((p) => (
            <div key={p.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[9px] text-bri-muted">
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-bri-bg text-[9px] font-bold text-bri-navy">{p.op}</span>
                {p.label}
                {p.note && <span className="text-[7.5px] text-bri-muted/70">· {p.note}</span>}
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-bri-ink">
                {p.op === "×" ? `${p.value.toFixed(2)}×` : formatRupiah(p.value)}
              </span>
            </div>
          ))}
          <div className="mt-0.5 flex items-center justify-between border-t border-bri-line pt-1">
            <span className="text-[9px] font-semibold text-bri-navy">Maksimum Limit</span>
            <span className="text-[14px] font-extrabold tabular-nums text-bri-navy">{formatRupiah(maxLimit)}</span>
          </div>
        </div>

        {/* Granted % + decision (navy) */}
        <div className="flex flex-col rounded-lg px-3 py-2.5 text-white shadow-soft" style={{ background: "linear-gradient(135deg, #00305C 0%, #00529C 100%)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] text-white/70">Limit Diberikan</span>
            <span className="flex items-center gap-0.5 rounded-pill bg-white/15 px-1.5 py-0.5 text-[8px] font-bold text-white">
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(pct * 100)}
                disabled={decided}
                onChange={(e) => setGrantedLimit(grantedFromMax(maxLimit, Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100))}
                aria-label="Persentase limit diberikan"
                className="w-7 bg-transparent text-right tabular-nums text-white outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              % dari maks
            </span>
          </div>
          {/* Editable granted amount (kept ≤ maximum limit). */}
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[13px] font-bold text-white/90">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={grantedLimit.toLocaleString("id-ID")}
              disabled={decided}
              onChange={(e) => setGrantedLimit(Math.min(maxLimit, Number(e.target.value.replace(/[^\d]/g, "")) || 0))}
              aria-label="Nominal limit diberikan"
              className="min-w-0 flex-1 bg-transparent text-[22px] font-extrabold leading-none tabular-nums text-white outline-none disabled:opacity-70"
            />
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={pct}
            disabled={decided}
            onChange={(e) => setGrantedLimit(grantedFromMax(maxLimit, Number(e.target.value)))}
            className="mt-2 w-full accent-white disabled:opacity-50"
          />
          <div className="flex justify-between text-[7px] text-white/60"><span>0%</span><span>100%</span></div>

          <div className="mt-2 border-t border-white/20 pt-2">
            {cardDecision === "approved" ? (
              <span className="flex items-center gap-1.5 rounded-pill bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200"><CheckCircle2 size={13} /> LIMIT DISETUJUI</span>
            ) : cardDecision === "rejected" ? (
              <span className="flex w-fit items-center gap-1.5 rounded-pill bg-red-400/20 px-2.5 py-1 text-[11px] font-bold text-red-200"><XCircle size={13} /> DITOLAK</span>
            ) : cardDecision === "pending" ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => onDecision("approved", grantedLimit)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-[10px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]">
                  <CheckCircle2 size={12} /> Setujui
                </button>
                <button type="button" onClick={() => onDecision("rejected")} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/40 bg-white/10 py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98]">
                  <XCircle size={12} /> Tolak
                </button>
              </div>
            ) : (
              <p className="text-[8.5px] text-white/70">
                {currentStep === "card_review" ? "Menunggu nasabah mengajukan…" : "Belum ada pengajuan kartu."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
