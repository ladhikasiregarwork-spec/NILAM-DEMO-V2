"use client";

import { Loader2, ClipboardCheck, MapPin, Clock, XCircle, PencilLine, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import type { AgunanData } from "@/types/agunan";
import type { SurveyStatus } from "@/types/flow";

interface SurveyScreenProps {
  status: SurveyStatus;
  /** Credit Analyst decision (only relevant after CA approval). */
  analystStatus: SurveyStatus;
  agunan?: AgunanData;
  /** CA survey note (shown on rejection). */
  note?: string;
  /** CA appraised value. */
  surveyValue?: number;
  /** Go back to the agunan step to swap the collateral and re-apply. */
  onEditAgunan: () => void;
}

/**
 * SurveyScreen — the borrower's waiting/result screen between submission and the
 * offer, with two sequential gates:
 *   1. Collateral Appraisal (CA): status pending → waiting; rejected → notice.
 *   2. Credit Analyst: once CA approved (status="approved"), analystStatus
 *      pending → waiting; rejected → notice. On analyst approval the flow
 *      navigates to the offer, so this screen no longer renders.
 */
export function SurveyScreen({ status, analystStatus, agunan, note, surveyValue, onEditAgunan }: SurveyScreenProps) {
  const lokasi = agunan
    ? [agunan.kelurahan, agunan.kecamatan, agunan.kota, agunan.provinsi].filter(Boolean).join(", ")
    : "";

  // ── Rejected — by CA or by Credit Analyst ──────────────────────────────────
  const rejectedByCa = status === "rejected";
  const rejectedByAnalyst = analystStatus === "rejected";
  if (rejectedByCa || rejectedByAnalyst) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <XCircle size={30} className="text-red-500" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-bri-ink">
            {rejectedByCa ? "Hasil Survey: Belum Memenuhi Syarat" : "Pengajuan Belum Disetujui"}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-bri-muted">
            {rejectedByCa
              ? "Mohon maaf, agunan Anda belum dapat disetujui berdasarkan hasil survey Collateral Appraisal."
              : "Mohon maaf, pengajuan Anda belum dapat disetujui berdasarkan keputusan Credit Analyst."}
          </p>
        </div>
        {rejectedByCa && note && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-left">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-red-500">Catatan Surveyor</p>
            <p className="mt-0.5 text-[9.5px] leading-relaxed text-red-700">{note}</p>
            {surveyValue != null && (
              <p className="mt-1 text-[9px] text-red-600">
                Nilai taksiran survey: <b>{formatRupiah(surveyValue)}</b>
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onEditAgunan}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-bubble bg-bri-blue px-4 py-2 text-[11px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <PencilLine size={13} /> Ganti Agunan
        </button>
      </div>
    );
  }

  // ── Waiting — for CA survey (status=pending) or Credit Analyst (status=approved) ──
  const waitingAnalyst = status === "approved";
  const title = waitingAnalyst ? "Menunggu Keputusan Analis" : "Menunggu Survey Agunan";
  const subtitle = waitingAnalyst
    ? "Agunan Anda telah disetujui Collateral Appraisal. Pengajuan sedang ditinjau Credit Analyst sebelum penawaran diterbitkan."
    : "Agunan Anda akan disurvey oleh tim Collateral Appraisal kami sebelum penawaran diterbitkan.";
  const badge = waitingAnalyst ? "Ditinjau Credit Analyst — mohon menunggu" : "Survey dijadwalkan — mohon menunggu";
  const showCaValue = waitingAnalyst && surveyValue != null;

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-5">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <Loader2 size={64} className="absolute animate-spin text-bri-blue/30" strokeWidth={1.5} />
        {waitingAnalyst
          ? <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={2} />
          : <ClipboardCheck size={28} className="text-bri-blue" strokeWidth={2} />}
      </div>

      <div className="text-center">
        <p className="text-[13px] font-bold text-bri-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-[240px] text-[10px] leading-relaxed text-bri-muted">{subtitle}</p>
      </div>

      {/* Collateral summary */}
      {agunan?.harga != null && (
        <div className="w-full rounded-xl border border-bri-line bg-bri-bg/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] text-bri-muted">{showCaValue ? "Nilai Taksiran (CA)" : "Nilai Agunan Diajukan"}</span>
            <span className="text-[12px] font-bold text-bri-navy tabular-nums">{formatRupiah(showCaValue ? surveyValue! : agunan.harga)}</span>
          </div>
          {(agunan.luasBangunan || agunan.luasTanah) && (
            <p className="mt-0.5 text-[8.5px] text-bri-muted">
              LB {agunan.luasBangunan ?? "—"} m² · LT {agunan.luasTanah ?? "—"} m²
            </p>
          )}
          {lokasi && (
            <div className="mt-1 flex items-start gap-1 border-t border-bri-line pt-1">
              <MapPin size={9} className="mt-0.5 shrink-0 text-bri-muted" />
              <span className="text-[8.5px] text-bri-ink">{lokasi}</span>
            </div>
          )}
        </div>
      )}

      <div className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-[9px] font-semibold ${waitingAnalyst ? "bg-bri-blue/10 text-bri-blue" : "bg-amber-50 text-amber-700"}`}>
        <Clock size={11} /> {badge}
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
