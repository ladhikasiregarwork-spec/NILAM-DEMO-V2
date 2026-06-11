"use client";

import { CheckCircle2, RefreshCw, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import type { AgunanData } from "@/types/agunan";

interface DisburseScreenProps {
  agunan?: AgunanData;
  /** Down payment (uang muka) — subtracted from the price, matching the offer. */
  uangMuka?: number;
  onFinish: () => void;
}

/**
 * DisburseScreen — langkah akhir: pencairan dana KPR. Dana cair = plafon =
 * harga agunan − uang muka (sama dengan penawaran).
 */
export function DisburseScreen({ agunan, uangMuka, onFinish }: DisburseScreenProps) {
  const plafon = agunan?.harga != null ? Math.max(0, agunan.harga - (uangMuka ?? 0)) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-5 py-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={1.8} />
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-bri-ink">Dana Dicairkan</p>
        <p className="mt-1 text-[10px] leading-relaxed text-bri-muted">
          KPR Anda telah disetujui &amp; dicairkan ke rekening.
        </p>
      </div>

      {plafon != null && (
        <div className="flex w-full items-center gap-2 rounded-bubble border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <Wallet size={18} className="shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-[8px] text-bri-muted">Dana Dicairkan</p>
            <p className="text-[15px] font-bold text-emerald-700 tabular-nums">{formatRupiah(plafon)}</p>
          </div>
        </div>
      )}

      <div className="rounded-bubble border border-bri-line bg-bri-bg px-4 py-2 text-center shadow-soft">
        <p className="text-[8px] text-bri-muted">Nomor Pencairan</p>
        <p className="mt-0.5 font-mono text-[11px] font-semibold text-bri-blue">KPR-2026-0000123</p>
      </div>

      <button
        type="button"
        onClick={onFinish}
        className="mt-1 flex items-center gap-1.5 text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
      >
        <RefreshCw size={11} />
        Selesai · mulai aplikasi baru
      </button>
    </div>
  );
}
