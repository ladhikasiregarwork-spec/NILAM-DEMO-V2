"use client";

import { TrendingUp, Lock } from "lucide-react";

interface IncomeTypeScreenProps {
  onPickFix: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * Income Type selection screen.
 * "Fix Income" card is selectable (blue ring, TrendingUp icon, "Tersedia" pill).
 * "Non Fix Income" is disabled (lock icon, "Segera hadir" pill).
 */
export function IncomeTypeScreen({ onPickFix, onGoBack, canGoBack }: IncomeTypeScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-4 py-3">
      {/* Title */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-bri-ink">Pilih Tipe Penghasilan</h2>
        <p className="mt-0.5 text-[10px] text-bri-muted">Sesuai dengan profil Anda</p>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Fix Income — active/selectable, bri-navy accent */}
        <button
          type="button"
          onClick={onPickFix}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-bri-navy bg-bri-bg p-3 transition-all hover:bg-blue-50 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bri-navy text-white">
            <TrendingUp size={16} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-bold text-bri-ink">Fix Income</p>
            <p className="text-[9px] text-bri-muted">Penghasilan tetap bulanan</p>
          </div>
          <span className="shrink-0 rounded-pill bg-bri-navy px-2 py-0.5 text-[8px] font-semibold text-white">
            Tersedia
          </span>
        </button>

        {/* Non Fix Income — disabled */}
        <div className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border-2 border-bri-line bg-gray-50 p-3 opacity-60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-bri-muted">
            <Lock size={16} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-bold text-bri-muted">Non Fix Income</p>
            <p className="text-[9px] text-bri-muted">Penghasilan variabel</p>
          </div>
          <span className="shrink-0 rounded-pill bg-bri-line px-2 py-0.5 text-[8px] font-semibold text-bri-muted">
            Segera hadir
          </span>
        </div>
      </div>

      {/* Back */}
      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-3 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
