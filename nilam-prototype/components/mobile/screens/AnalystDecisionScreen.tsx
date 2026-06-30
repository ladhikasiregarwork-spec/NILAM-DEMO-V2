"use client";

import { Loader2, Gauge, Clock, XCircle, PencilLine, ShieldCheck, RefreshCw } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import type { AgunanData } from "@/types/agunan";
import type { AnalystDecisionStatus } from "@/types/flow";

interface AnalystDecisionScreenProps {
  status: AnalystDecisionStatus;
  agunan?: AgunanData;
  /** Appraised value approved by the collateral appraisal (shown as context). */
  surveyValue?: number;
  /** Jump back to the Agunan step to swap the collateral and re-apply. */
  onEditAgunan: () => void;
  /** Restart the whole application. */
  onRestart: () => void;
}

/**
 * AnalystDecisionScreen — shown after the collateral appraisal is approved (or,
 * for sub-threshold applications, right after processing). The customer waits
 * here while a Credit Analyst reviews the application in the dashboard. The offer
 * is released (flow advances to `offering`) only once the analyst approves.
 *   pending  → "Menunggu Keputusan Analis Kredit" (waiting)
 *   rejected → analyst declined, with "Ganti Agunan" / restart
 */
export function AnalystDecisionScreen({ status, agunan, surveyValue, onEditAgunan, onRestart }: AnalystDecisionScreenProps) {
  // ── Rejected ───────────────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <XCircle size={30} className="text-red-500" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-bri-ink">Pengajuan Belum Disetujui</p>
          <p className="mt-1 text-[10px] leading-relaxed text-bri-muted">
            Mohon maaf, berdasarkan penilaian Credit Analyst pengajuan KPR Anda belum dapat disetujui saat ini.
          </p>
        </div>
        <button
          type="button"
          onClick={onEditAgunan}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-bubble bg-bri-blue px-4 py-2 text-[11px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <PencilLine size={13} /> Ganti Agunan
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          <RefreshCw size={11} /> Mulai aplikasi baru
        </button>
      </div>
    );
  }

  // ── Pending (waiting for the Credit Analyst's decision) ─────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-5">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <Loader2 size={64} className="absolute animate-spin text-bri-blue/30" strokeWidth={1.5} />
        <Gauge size={28} className="text-bri-blue" strokeWidth={2} />
      </div>

      <div className="text-center">
        <p className="text-[13px] font-bold text-bri-ink">Menunggu Keputusan Analis Kredit</p>
        <p className="mx-auto mt-1 max-w-[250px] text-[10px] leading-relaxed text-bri-muted">
          Pengajuan Anda sedang ditinjau oleh <b>Credit Analyst</b> kami. Penawaran KPR akan diterbitkan setelah
          pengajuan disetujui.
        </p>
      </div>

      {/* Appraisal-passed context */}
      {surveyValue != null && (
        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span className="text-[9px] font-semibold text-emerald-700">Penilaian Agunan Disetujui</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[9px] text-bri-muted">Nilai taksiran agunan</span>
            <span className="text-[12px] font-bold tabular-nums text-bri-navy">{formatRupiah(surveyValue)}</span>
          </div>
        </div>
      )}

      {/* Application reference */}
      <div className="w-full rounded-xl border border-bri-line bg-bri-bg/50 px-3 py-2 text-center">
        <p className="text-[8px] text-bri-muted">Nomor Pengajuan</p>
        <p className="mt-0.5 font-mono text-[11px] font-semibold text-bri-blue">NILAM-2026-0000123</p>
      </div>

      <div className="flex items-center gap-1.5 rounded-pill bg-amber-50 px-3 py-1 text-[9px] font-semibold text-amber-700">
        <Clock size={11} /> Sedang ditinjau analis — mohon menunggu
      </div>

      <button
        type="button"
        onClick={onEditAgunan}
        className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-bri-blue transition-colors hover:underline"
      >
        <PencilLine size={12} /> Ganti Agunan
      </button>
    </div>
  );
}
