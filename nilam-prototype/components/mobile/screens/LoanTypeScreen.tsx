"use client";

import { Home, Car, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LoanType } from "@/types/auto";

interface LoanTypeScreenProps {
  loanType: LoanType | null;
  onSelect: (type: LoanType) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

const OPTIONS: {
  id: LoanType;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    id: "kpr",
    title: "KPR — Pemilikan Rumah",
    subtitle: "Kredit Pemilikan Rumah",
    desc: "Beli rumah / properti dengan agunan. Upload dokumen, taksiran agunan, & penawaran KPR.",
    icon: Home,
  },
  {
    id: "auto",
    title: "KKB — Kendaraan Bermotor",
    subtitle: "Kredit Kendaraan Bermotor",
    desc: "Beli mobil impian. Pilih kendaraan, hitung cicilan, lalu janji temu dengan agen kami.",
    icon: Car,
  },
  {
    id: "cc",
    title: "Kartu Kredit",
    subtitle: "BRI Credit Card",
    desc: "Ajukan BRI Touch atau BRI Easy. Pilih kartu, tentukan limit, lalu tunggu persetujuan analis.",
    icon: CreditCard,
  },
];

/**
 * LoanTypeScreen — after the agree (S&K) page the customer chooses a product:
 * KPR (existing mortgage flow) or KKB (new auto-loan flow). Selecting a card
 * branches the flow and advances immediately.
 */
export function LoanTypeScreen({ loanType, onSelect, onGoBack, canGoBack }: LoanTypeScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      <div className="mb-3">
        <h2 className="text-[13px] font-bold text-bri-ink">Pilih Jenis Pembiayaan</h2>
        <p className="text-[9px] text-bri-muted">Mau ajukan pembiayaan untuk apa hari ini?</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = loanType === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              className={cn(
                "group flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]",
                active
                  ? "border-bri-blue bg-bri-blue/5"
                  : "border-bri-line bg-white hover:border-bri-blue/50 hover:bg-bri-bg/40",
              )}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
              >
                <Icon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] font-bold text-bri-ink">{o.title}</p>
                  <ChevronRight size={14} className="shrink-0 text-bri-muted transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-blue">{o.subtitle}</p>
                <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">{o.desc}</p>
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
