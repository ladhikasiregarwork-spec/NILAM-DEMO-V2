"use client";

import { CreditCard as CardIcon, Loader2, Gavel, XCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { CardDecisionStatus } from "@/types/card";

interface CardReviewScreenProps {
  /** Analyst decision stage (drives the whole screen). */
  status: CardDecisionStatus;
  nama?: string;
  /** Submit the application → hands off to the Credit Analyst. */
  onSubmit: () => void;
  /** Restart the flow (after a rejection). */
  onRestart: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * CardReviewScreen — FIRST step of the reordered credit-card flow. The customer
 * submits their application (documents already uploaded) BEFORE picking a card;
 * the Credit Analyst then computes a maximum limit and approves a granted limit
 * in the dashboard.
 *   none     → review + "Ajukan" (submit)
 *   pending  → waiting for the analyst's limit decision
 *   rejected → rejection notice
 *   approved → the state machine advances to card_select (brief success shown)
 */
export function CardReviewScreen({ status, nama, onSubmit, onRestart, onGoBack, canGoBack }: CardReviewScreenProps) {
  // ── Waiting for the analyst ─────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Loader2 size={64} className="absolute animate-spin text-bri-blue/30" strokeWidth={1.5} />
          <Gavel size={24} className="text-bri-blue" />
        </div>
        <h2 className="mt-3 text-[13px] font-bold text-bri-ink">Pengajuan Terkirim</h2>
        <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
          Terima kasih{nama ? `, ${nama.split(" ")[0]}` : ""}! Credit Analyst sedang menghitung <b>maksimum limit</b> dan meninjau pengajuan Anda.
        </p>
        <div className="mt-4 flex w-full max-w-[230px] items-center gap-2 rounded-lg border border-bri-blue bg-bri-blue/5 px-2.5 py-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bri-blue/10 text-bri-blue">
            <Loader2 size={13} className="animate-spin" />
          </span>
          <span className="text-[9px] font-semibold text-bri-blue">Persetujuan Limit oleh Analis</span>
        </div>
        <p className="mt-3 text-[8px] text-bri-muted">Setelah limit disetujui, Anda dapat memilih kartu.</p>
      </div>
    );
  }

  // ── Rejected ────────────────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle size={32} className="text-red-500" strokeWidth={2} />
          </div>
          <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Pengajuan Belum Disetujui</h2>
          <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
            Mohon maaf, pengajuan kartu kredit Anda belum disetujui analis saat ini.
          </p>
        </div>
        <div className="flex-1" />
        <button type="button" onClick={onRestart} className="mt-3 w-full rounded-bubble border border-bri-line py-2.5 text-[12px] font-semibold text-bri-ink transition-colors hover:bg-bri-bg">
          Kembali ke Awal
        </button>
      </div>
    );
  }

  // ── Approved (transient — flow advances to card_select) ─────────────────────
  if (status === "approved") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={30} className="text-emerald-500" strokeWidth={2} />
        </div>
        <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Limit Disetujui</h2>
        <p className="mt-1 text-[9px] text-bri-muted">Menyiapkan pilihan kartu Anda…</p>
      </div>
    );
  }

  // ── Review + submit (status === "none") ─────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      <div className="mb-2 shrink-0">
        <h2 className="text-[13px] font-bold text-bri-ink">Pengajuan Kartu Kredit</h2>
        <p className="text-[9px] text-bri-muted">Konfirmasi pengajuan — analis akan meninjau profil Anda.</p>
      </div>

      {/* Hero */}
      <div
        className="relative flex h-28 w-full shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-3 text-white shadow-soft"
        style={{ background: "linear-gradient(135deg, #0B1E3B 0%, #00305C 55%, #00529C 100%)" }}
      >
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">BRI Credit Card</span>
          <CardIcon size={16} className="text-white/70" />
        </div>
        <div className="h-5 w-7 rounded bg-white/25" />
        <span className="text-[9px] text-white/70">Limit ditentukan oleh Credit Analyst berdasarkan profil Anda.</span>
      </div>

      {/* Profile-review notice + confirmation */}
      <div className="mt-2 rounded-2xl border border-bri-line bg-white p-3 shadow-soft">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-bri-ink">
          <ShieldCheck size={13} className="text-bri-blue" /> Peninjauan Profil
        </p>
        <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
          Credit Analyst akan memeriksa profil Anda terlebih dahulu sebelum menentukan persetujuan kartu kredit. Lanjutkan pengajuan?
        </p>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onSubmit}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        <CheckCircle2 size={14} /> Ya, Ajukan Kartu Kredit
      </button>

      {canGoBack && (
        <button type="button" onClick={onGoBack} className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue">
          ← Kembali
        </button>
      )}
    </div>
  );
}
