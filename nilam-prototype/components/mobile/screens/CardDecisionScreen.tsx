"use client";

import { CheckCircle2, XCircle, Loader2, Gavel, Sparkles } from "lucide-react";
import { CardVisual } from "./CardVisual";
import { formatRupiah } from "@/lib/formatRupiah";
import type { CreditCard, CardDecisionStatus } from "@/types/card";

interface CardDecisionScreenProps {
  card?: CreditCard;
  limit: number;
  status: CardDecisionStatus;
  nama?: string;
  onFinish: () => void;
}

/**
 * CardDecisionScreen — status-driven terminal screen for the credit-card flow:
 *   pending  → waiting for the Credit Analyst's decision (dashboard)
 *   approved → approved-card summary (limit, fee, benefits)
 *   rejected → rejection notice
 */
export function CardDecisionScreen({ card, limit, status, nama, onFinish }: CardDecisionScreenProps) {
  // ── Waiting for the analyst ───────────────────────────────────────────────
  if (status !== "approved" && status !== "rejected") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Loader2 size={64} className="absolute animate-spin text-bri-blue/30" strokeWidth={1.5} />
          <Gavel size={24} className="text-bri-blue" />
        </div>
        <h2 className="mt-3 text-[13px] font-bold text-bri-ink">Pengajuan Terkirim</h2>
        <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
          Terima kasih{nama ? `, ${nama.split(" ")[0]}` : ""}! Pengajuan {card?.name ?? "kartu kredit"} Anda sedang ditinjau Credit Analyst.
        </p>
        <div className="mt-4 flex w-full max-w-[220px] items-center gap-2 rounded-lg border border-bri-blue bg-bri-blue/5 px-2.5 py-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bri-blue/10 text-bri-blue">
            <Loader2 size={13} className="animate-spin" />
          </span>
          <span className="text-[9px] font-semibold text-bri-blue">Persetujuan Analis</span>
        </div>
        <p className="mt-3 text-[8px] text-bri-muted">Status diperbarui otomatis setelah analis memutuskan.</p>
      </div>
    );
  }

  // ── Rejected ──────────────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle size={32} className="text-red-500" strokeWidth={2} />
          </div>
          <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Pengajuan Belum Disetujui</h2>
          <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
            Mohon maaf, pengajuan {card?.name ?? "kartu kredit"} Anda belum disetujui analis saat ini.
          </p>
        </div>
        <div className="flex-1" />
        <button type="button" onClick={onFinish} className="mt-3 w-full rounded-bubble border border-bri-line py-2.5 text-[12px] font-semibold text-bri-ink transition-colors hover:bg-bri-bg">
          Kembali ke Awal
        </button>
      </div>
    );
  }

  // ── Approved ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2} />
        </div>
        <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Selamat! Kartu Disetujui</h2>
        <p className="mt-0.5 text-[9px] leading-relaxed text-bri-muted">
          Disetujui Credit Analyst. Kartu fisik akan dikirim ke alamat Anda.
        </p>
      </div>

      {card && (
        <>
          {/* Card visual — real BRI artwork */}
          <CardVisual card={card} className="mt-3" />

          {/* Approved limit headline */}
          <div className="mt-2 rounded-2xl bg-bri-navy px-3 py-2.5 text-white">
            <div className="flex items-end justify-between">
              <span className="text-[8px] uppercase tracking-[0.1em] text-white/70">Limit Disetujui</span>
              <span className="text-[18px] font-extrabold leading-none">{formatRupiah(limit)}</span>
            </div>
            <p className="mt-1 text-[8px] text-white/60">{card.annualFee === 0 ? "Bebas iuran tahunan" : card.annualFeeNote} · bunga {(card.interestMonthly * 100).toLocaleString("id-ID")}%/bln</p>
          </div>

          {/* What you get */}
          <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-bri-line bg-white p-2.5">
            <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
              <Sparkles size={10} className="text-bri-blue" /> Keuntungan Kartu Anda
            </p>
            {card.benefits.map((b) => (
              <div key={b} className="flex items-start gap-1.5 text-[9px] leading-relaxed text-bri-ink/85">
                <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" /> {b}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-2 text-center text-[8px] leading-relaxed text-bri-muted">
        Aktifkan kartu Anda melalui BRImo setelah kartu fisik diterima.
      </p>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onFinish}
        className="mt-3 w-full rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        Selesai
      </button>
    </div>
  );
}
