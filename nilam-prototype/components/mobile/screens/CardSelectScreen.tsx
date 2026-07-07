"use client";

import { CreditCard as CardIcon, ChevronRight, Wifi, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatJuta, formatRupiah } from "@/lib/formatRupiah";
import { CREDIT_CARDS } from "@/data/creditCards";
import type { CreditCard } from "@/types/card";

interface CardSelectScreenProps {
  selected?: CreditCard;
  onSelect: (card: CreditCard) => void;
  /** Maximum limit approved by the analyst (caps every card). */
  grantedLimit?: number;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * CardSelectScreen — the customer picks a card product (BRI Touch vs BRI Easy).
 * Each option shows a mini card visual, limit range, and highlight chips. Tapping
 * a card advances to the specification (limit) screen.
 */
export function CardSelectScreen({ selected, onSelect, grantedLimit, onGoBack, canGoBack }: CardSelectScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      <div className="mb-2 shrink-0">
        <h2 className="text-[13px] font-bold text-bri-ink">Pilih Kartu Kredit</h2>
        <p className="text-[9px] text-bri-muted">Dua pilihan kartu BRI — sesuaikan dengan gaya hidup Anda.</p>
      </div>

      {grantedLimit != null && grantedLimit > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
          <BadgeCheck size={14} className="shrink-0 text-emerald-600" />
          <p className="text-[9px] leading-tight text-emerald-700">
            Limit disetujui analis: <b className="text-[10px]">{formatRupiah(grantedLimit)}</b>. Semua kartu dibatasi hingga limit ini.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {CREDIT_CARDS.map((c) => {
          const active = selected?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className={cn(
                "group flex flex-col gap-2 rounded-2xl border p-2.5 text-left transition-all active:scale-[0.99]",
                active ? "border-bri-blue bg-bri-blue/5" : "border-bri-line bg-white hover:border-bri-blue/50 hover:bg-bri-bg/40",
              )}
            >
              {/* Mini card visual */}
              <div
                className="relative flex h-24 w-full flex-col justify-between overflow-hidden rounded-xl p-2.5 text-white shadow-soft"
                style={{ background: c.gradient }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/85">{c.name}</span>
                  <Wifi size={13} className="rotate-90 text-white/70" />
                </div>
                <div className="h-4 w-6 rounded bg-white/25" />
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-white/80">•••• •••• •••• 8021</span>
                  <span className="text-[9px] font-bold italic text-white/90">{c.network}</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-bri-ink">{c.name}</p>
                  <p className="text-[8.5px] leading-relaxed text-bri-muted">{c.tagline}</p>
                </div>
                <ChevronRight size={14} className="mt-0.5 shrink-0 text-bri-muted transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="flex flex-wrap gap-1">
                <span className="flex items-center gap-1 rounded-pill bg-bri-bg px-2 py-0.5 text-[8px] font-semibold text-bri-ink">
                  <CardIcon size={9} className="text-bri-blue" /> Limit {formatJuta(c.minLimit)}–{formatJuta(c.maxLimit)}
                </span>
                {c.highlights.map((h) => (
                  <span key={h} className="rounded-pill bg-bri-blue/10 px-1.5 py-0.5 text-[8px] font-semibold text-bri-blue">
                    {h}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
