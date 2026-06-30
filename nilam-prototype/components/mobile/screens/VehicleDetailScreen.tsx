"use client";

import { Users, Fuel, Cog, Gauge, Calculator, Check, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import { computeAutoLoan } from "@/lib/autoLoan";
import {
  AUTO_SCHEMES,
  TENOR_OPTIONS_M,
  MIN_DP_PCT,
  MAX_DP_PCT,
  schemeById,
  bestSchemeForTenor,
} from "@/data/autoRates";
import type { Vehicle, AutoLoanCalc } from "@/types/auto";
import { VehiclePhoto } from "./VehiclePhoto";

/** Maximum discount (%) selectable on the calculator — bounds the slider & typed input. */
const MAX_DISCOUNT_PCT = 50;

interface VehicleDetailScreenProps {
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  setCalc: (patch: Partial<AutoLoanCalc>) => void;
  onAccept: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

function SpecChip({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-pill bg-bri-bg px-2 py-0.5 text-[8px] font-medium text-bri-ink">
      <Icon size={9} className="text-bri-blue" /> {label}
    </span>
  );
}

/**
 * VehicleDetailScreen — the chosen vehicle's description + specs, with the loan
 * calculator pinned at the bottom (tenor · down payment · rate → monthly
 * installment). "Setuju & Lanjut" advances to the appointment step.
 */
export function VehicleDetailScreen({ vehicle, calc, setCalc, onAccept, onGoBack, canGoBack }: VehicleDetailScreenProps) {
  if (!vehicle) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-bri-muted">
        <p className="text-[10px]">Belum ada kendaraan dipilih.</p>
        {canGoBack && (
          <button type="button" onClick={onGoBack} className="mt-2 text-[10px] text-bri-blue">← Pilih kendaraan</button>
        )}
      </div>
    );
  }

  const scheme = schemeById(calc.schemeId);
  const dpPctLabel = Math.round(calc.dpPct * 100);
  const discountPctLabel = Math.round((calc.discountPct ?? 0) * 100);
  const loan = computeAutoLoan(vehicle.price, calc.dpPct, scheme.rate, calc.tenorMonths, calc.discountPct);

  function pickTenor(m: number) {
    // Keep the rate scheme valid for the new tenor; auto-switch when needed.
    const stillValid = m >= scheme.minTenorM && m <= scheme.maxTenorM;
    setCalc({ tenorMonths: m, schemeId: stillValid ? scheme.id : bestSchemeForTenor(m).id });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      {/* Hero photo */}
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl">
        <VehiclePhoto vehicle={vehicle} iconSize={52} />
      </div>

      {/* Title + price */}
      <div className="mt-2">
        <h2 className="text-[13px] font-bold leading-tight text-bri-ink">{vehicle.fullName}</h2>
        <p className="text-[8px] text-bri-muted">{vehicle.category} · Tahun {vehicle.year}</p>
        <p className="mt-0.5 text-[14px] font-extrabold text-bri-blue">{formatRupiah(vehicle.price)}</p>
        <p className="text-[7.5px] text-bri-muted">Harga OTR (on the road) · estimasi</p>
      </div>

      {/* Spec chips */}
      <div className="mt-2 flex flex-wrap gap-1">
        <SpecChip icon={Users} label={`${vehicle.seats} kursi`} />
        <SpecChip icon={Cog} label={vehicle.transmission} />
        <SpecChip icon={Fuel} label={vehicle.fuel} />
        <SpecChip icon={Gauge} label={vehicle.engineCc > 0 ? `${vehicle.engineCc} cc` : "Listrik"} />
      </div>

      {/* Description */}
      <p className="mt-2 text-[9px] leading-relaxed text-bri-ink/80">{vehicle.description}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {vehicle.highlights.map((h) => (
          <span key={h} className="rounded-pill bg-bri-blue/10 px-1.5 py-px text-[7.5px] font-semibold text-bri-blue">
            {h}
          </span>
        ))}
      </div>

      {/* ── Loan calculator ───────────────────────────────────────────────── */}
      <div className="mt-3 rounded-2xl border border-bri-line bg-white p-2.5 shadow-soft">
        <div className="mb-2 flex items-center gap-1.5">
          <Calculator size={12} className="text-bri-blue" />
          <span className="text-[10px] font-bold text-bri-ink">Simulasi Kredit (KKB)</span>
        </div>

        {/* Tenor */}
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-bri-muted">Jangka Waktu</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {TENOR_OPTIONS_M.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pickTenor(m)}
              className={cn(
                "rounded-pill px-2.5 py-1 text-[9px] font-semibold transition-colors",
                calc.tenorMonths === m ? "bg-bri-navy text-white" : "bg-bri-bg text-bri-muted hover:text-bri-ink",
              )}
            >
              {m / 12} thn
            </button>
          ))}
        </div>

        {/* Down payment slider */}
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-bri-muted">Uang Muka (DP)</p>
          <span className="text-[9px] font-bold text-bri-ink">
            {dpPctLabel}% · {formatJuta(loan.dp)}
          </span>
        </div>
        <input
          type="range"
          min={MIN_DP_PCT * 100}
          max={MAX_DP_PCT * 100}
          step={5}
          value={dpPctLabel}
          onChange={(e) => setCalc({ dpPct: Number(e.target.value) / 100 })}
          className="mb-2 w-full accent-bri-blue"
        />

        {/* Rate scheme */}
        <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-bri-muted">Skema Bunga</p>
        <div className="mb-2 flex flex-col gap-1">
          {AUTO_SCHEMES.map((s) => {
            const allowed = calc.tenorMonths >= s.minTenorM && calc.tenorMonths <= s.maxTenorM;
            const active = scheme.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!allowed}
                onClick={() => setCalc({ schemeId: s.id })}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-1 text-left transition-colors",
                  active ? "border-bri-blue bg-bri-blue/5" : "border-bri-line bg-white",
                  !allowed && "cursor-not-allowed opacity-40",
                )}
              >
                <span className="text-[9px] font-semibold text-bri-ink">{s.label}</span>
                <span className="text-[9px] font-bold text-bri-blue">{s.rateLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Discount — editable (slider or typed %); the RM can later overwrite it. Defaults to 0%. */}
        <div className="mb-2 rounded-lg border border-bri-line bg-bri-bg/40 px-2 py-1.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-bri-muted">
              <Tag size={9} className="text-bri-blue" /> Diskon
            </span>
            <span className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Diskon (%)"
                value={discountPctLabel}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                  setCalc({ discountPct: Math.max(0, Math.min(MAX_DISCOUNT_PCT, n)) / 100 });
                }}
                className="w-8 rounded border border-bri-line bg-white px-1 py-0.5 text-right text-[9px] font-bold text-bri-blue tabular-nums outline-none focus:border-bri-blue"
              />
              <span className="text-[9px] font-bold text-bri-blue">%</span>
              {loan.discount > 0 && <span className="text-[8px] font-medium text-emerald-600">− {formatJuta(loan.discount)}</span>}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_DISCOUNT_PCT}
            step={1}
            value={Math.min(MAX_DISCOUNT_PCT, discountPctLabel)}
            onChange={(e) => setCalc({ discountPct: Number(e.target.value) / 100 })}
            className="w-full accent-bri-blue"
          />
        </div>

        {/* Result */}
        <div className="rounded-xl bg-bri-navy px-3 py-2 text-white">
          <div className="flex items-end justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] text-white/70">Angsuran / bulan</span>
            <span className="text-[16px] font-extrabold leading-none">{formatRupiah(loan.angsuran)}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[7px] text-white/60">DP</p>
              <p className="text-[8.5px] font-semibold">{formatJuta(loan.dp)}</p>
            </div>
            <div>
              <p className="text-[7px] text-white/60">Pokok Kredit</p>
              <p className="text-[8.5px] font-semibold">{formatJuta(loan.financed)}</p>
            </div>
            <div>
              <p className="text-[7px] text-white/60">Total Bayar</p>
              <p className="text-[8.5px] font-semibold">{formatJuta(loan.totalKeseluruhan)}</p>
            </div>
          </div>
        </div>
        <p className="mt-1 text-[7px] leading-snug text-bri-muted">
          *Estimasi {scheme.rateLabel} efektif p.a. selama {calc.tenorMonths / 12} tahun. Angka final mengikuti
          persetujuan kredit & survei agen.
        </p>
      </div>

      <div className="flex-1" />

      {/* Accept */}
      <button
        type="button"
        onClick={onAccept}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        <Check size={14} /> Setuju & Lanjut
      </button>

      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Ganti kendaraan
        </button>
      )}
    </div>
  );
}
