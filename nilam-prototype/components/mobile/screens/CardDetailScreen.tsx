"use client";

import { Check, Sparkles, Wallet, BadgePercent, ShieldCheck, Info, BadgeCheck } from "lucide-react";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import { recommendedLimit } from "@/lib/creditCard";
import { CardVisual } from "./CardVisual";
import type { CreditCard } from "@/types/card";

interface CardDetailScreenProps {
  card?: CreditCard;
  limit: number;
  setLimit: (limit: number) => void;
  /** Monthly income (from OCR) — drives the recommended-limit hint. */
  monthlyIncome: number;
  /** Maximum limit approved by the analyst (hard cap for the slider). */
  grantedLimit?: number;
  onSubmit: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * CardDetailScreen — final step: confirm the chosen card and set the limit,
 * capped to the analyst's approved (granted) limit. The analyst has already
 * approved, so "Terbitkan Kartu" finishes the flow.
 */
export function CardDetailScreen({ card, limit, setLimit, monthlyIncome, grantedLimit, onSubmit, onGoBack, canGoBack }: CardDetailScreenProps) {
  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-bri-muted">
        <p className="text-[10px]">Belum ada kartu dipilih.</p>
        {canGoBack && (
          <button type="button" onClick={onGoBack} className="mt-2 text-[10px] text-bri-blue">← Pilih kartu</button>
        )}
      </div>
    );
  }

  const recommended = recommendedLimit(card, monthlyIncome);
  const overRecommended = limit > recommended;
  // Hard cap = the analyst's granted limit (never exceed the card's own max).
  const effMax = grantedLimit != null ? Math.min(card.maxLimit, grantedLimit) : card.maxLimit;
  const effLimit = Math.min(limit, effMax);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      {/* Card visual — real BRI artwork */}
      <CardVisual card={card} className="shrink-0" />

      <div className="mt-2">
        <h2 className="text-[13px] font-bold leading-tight text-bri-ink">{card.name}</h2>
        <p className="text-[8.5px] text-bri-muted">{card.tagline}</p>
      </div>

      {/* Fees / requirement chips */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <SpecBox icon={Wallet} label="Iuran / thn" value={card.annualFee === 0 ? "Gratis" : formatRupiah(card.annualFee)} sub={card.annualFeeNote} />
        <SpecBox icon={BadgePercent} label="Bunga / bln" value={`${(card.interestMonthly * 100).toLocaleString("id-ID")}%`} sub="finance charge" />
        <SpecBox icon={ShieldCheck} label="Min. gaji" value={formatJuta(card.minIncomeMonthly)} sub="per bulan" />
      </div>

      {/* Benefits */}
      <div className="mt-2 rounded-2xl border border-bri-line bg-white p-2.5 shadow-soft">
        <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-bri-muted">
          <Sparkles size={11} className="text-bri-blue" /> Keuntungan Kartu
        </p>
        <ul className="flex flex-col gap-1">
          {card.benefits.map((b) => (
            <li key={b} className="flex items-start gap-1.5 text-[9px] leading-relaxed text-bri-ink/85">
              <Check size={11} className="mt-0.5 shrink-0 text-emerald-500" /> {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Limit slider — capped to the analyst's granted limit */}
      <div className="mt-2 rounded-2xl border border-bri-line bg-white p-2.5 shadow-soft">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-bri-muted">Limit Kartu</p>
          <span className="text-[12px] font-extrabold text-bri-blue">{formatRupiah(effLimit)}</span>
        </div>
        <input
          type="range"
          min={card.minLimit}
          max={effMax}
          step={1_000_000}
          value={effLimit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full accent-bri-blue"
        />
        <div className="flex justify-between text-[7.5px] text-bri-muted">
          <span>{formatJuta(card.minLimit)}</span>
          <span>{formatJuta(effMax)}</span>
        </div>
        {grantedLimit != null && (
          <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-emerald-50 px-2 py-1.5">
            <BadgeCheck size={10} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-[8px] leading-relaxed text-emerald-700">
              Limit disetujui analis: <span className="font-semibold">{formatRupiah(grantedLimit)}</span>. Anda dapat memilih limit hingga nilai ini.
            </p>
          </div>
        )}
        <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-bri-bg/60 px-2 py-1.5">
          <Info size={10} className={`mt-0.5 shrink-0 ${overRecommended ? "text-amber-500" : "text-bri-blue"}`} />
          <p className="text-[8px] leading-relaxed text-bri-muted">
            Rekomendasi berdasarkan penghasilan Anda: <span className="font-semibold text-bri-ink">{formatRupiah(recommended)}</span>.
          </p>
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onSubmit}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        <Check size={14} /> Terbitkan Kartu
      </button>

      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Ganti kartu
        </button>
      )}
    </div>
  );
}

function SpecBox({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-bri-line bg-bri-bg/40 px-2 py-1.5">
      <p className="flex items-center gap-0.5 text-[7.5px] uppercase tracking-[0.08em] text-bri-muted">
        <Icon size={9} className="text-bri-blue" /> {label}
      </p>
      <p className="text-[11px] font-bold leading-tight text-bri-ink">{value}</p>
      {sub && <p className="text-[7px] text-bri-muted">{sub}</p>}
    </div>
  );
}
