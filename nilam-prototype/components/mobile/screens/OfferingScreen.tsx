"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Home, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { buildSchedule, maxTenorByAge, maxPlafond } from "@/lib/kpr";
import { KPR_SCHEMES, ratePlan, FLOATING_RATE } from "@/data/kprRates";
import { usiaDariKtp } from "@/lib/usia";
import type { AgunanData } from "@/types/agunan";

interface OfferingScreenProps {
  agunan?: AgunanData;
  tanggalLahir?: string;
  /** Down payment (uang muka) — subtracted from the price to get the plafond. */
  uangMuka?: number;
  /** Nasabah's desired tenor (years). */
  jangkaWaktu?: number;
  /** Monthly payment capacity — angsuran above this is flagged red. */
  kemampuan?: number;
  onAccept: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

const RETIREMENT = 56;
const pct = (r: number) => `${(r * 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",")}%`;
const ALT_TENORS = [5, 10, 15, 20, 25];

/**
 * OfferingScreen — penawaran KPR. Plafon = harga agunan − uang muka. Tenor
 * mengikuti input nasabah (dibatasi usia pensiun 56). Tiap skema bisa dibuka
 * (fixed → floating 12,5%). Angsuran yang melebihi kemampuan bayar ditandai
 * MERAH. Di bawah penawaran ada rekomendasi tenor lain.
 */
export function OfferingScreen({ agunan, tanggalLahir, uangMuka, jangkaWaktu, kemampuan, onAccept, onGoBack, canGoBack }: OfferingScreenProps) {
  const harga = agunan?.harga ?? 0;
  const dp = uangMuka ?? 0;
  const plafon = Math.max(0, harga - dp);
  const usia = usiaDariKtp(tanggalLahir);
  const tenorMaks = maxTenorByAge(usia, RETIREMENT);
  const tenorNasabah = Math.max(1, Math.min(jangkaWaktu ?? 15, tenorMaks));
  // Nasabah can switch to a recommended tenor below.
  const [tenorPilih, setTenorPilih] = useState<number | null>(null);
  const tenor = tenorPilih ?? tenorNasabah;

  const mampu = (angsuran: number) => kemampuan == null || kemampuan <= 0 || angsuran <= kemampuan;
  // Extra DP needed so the (promo-rate) angsuran fits the payment capacity.
  const tambahanDp = (rate: number, tenorYears: number) => {
    if (kemampuan == null || kemampuan <= 0 || harga <= 0) return 0;
    return Math.max(0, harga - dp - maxPlafond(kemampuan, rate, tenorYears * 12));
  };

  const options = useMemo(
    () =>
      KPR_SCHEMES.filter((s) => s.minTenor <= tenorMaks).map((s) => {
        const t = Math.max(s.minTenor, Math.min(s.maxTenor, tenor));
        const schedule = plafon > 0 ? buildSchedule(plafon, t, ratePlan(s, t)) : [];
        return { scheme: s, tenor: t, schedule, promo: schedule[0]?.angsuran ?? 0 };
      }),
    [tenor, tenorMaks, plafon],
  );

  const [selected, setSelected] = useState(options[0]?.scheme.id ?? "");
  const active = options.find((o) => o.scheme.id === selected) ?? options[0];

  // Recommended alternative tenors for the selected scheme.
  const altRows = useMemo(() => {
    if (!active) return [];
    const s = active.scheme;
    const tenors = Array.from(new Set([tenor, ...ALT_TENORS]))
      .filter((t) => t >= s.minTenor && t <= Math.min(s.maxTenor, tenorMaks))
      .sort((a, b) => a - b);
    return tenors.map((t) => {
      const sched = plafon > 0 ? buildSchedule(plafon, t, ratePlan(s, t)) : [];
      const promo = sched[0]?.angsuran ?? 0;
      return { t, promo, rate: sched[0]?.rate ?? 0, ok: mampu(promo), isNasabah: t === tenorNasabah, isSelected: t === tenor };
    });
  }, [active, tenor, tenorNasabah, tenorMaks, plafon, kemampuan]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <BadgeCheck size={14} className="text-emerald-500" />
        <h2 className="text-[13px] font-bold text-bri-ink">Penawaran KPR</h2>
      </div>
      <p className="mb-2 text-[9px] text-bri-muted">Klik skema untuk rincian. Angsuran melebihi kemampuan ditandai merah.</p>

      {/* Plafon hero */}
      <div className="rounded-xl border border-bri-navy/30 px-3 py-2.5 shadow-soft" style={{ background: "linear-gradient(135deg, #00305C 0%, #00529C 100%)" }}>
        <span className="text-[9px] text-white/70">Plafon (Harga − Uang Muka)</span>
        <div className="text-[22px] font-bold leading-tight text-white tabular-nums">{formatRupiah(plafon)}</div>
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-white/20 pt-1.5 text-[8.5px] text-white/85">
          <span>Harga {formatRupiah(harga)} − DP {formatRupiah(dp)}</span>
          <span>Tenor <b className="text-white">{tenor} thn</b>{usia != null ? ` · maks ${tenorMaks}` : ""}</span>
        </div>
        {kemampuan != null && kemampuan > 0 && (
          <div className="mt-1 text-[8px] text-white/70">Kemampuan bayar: <b className="text-white">{formatRupiah(kemampuan)}</b>/bln</div>
        )}
      </div>

      {/* Scheme options */}
      <p className="mb-1 mt-2.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-bri-muted">
        Skema Bunga <span className="font-normal normal-case text-bri-muted/70">· tenor {tenor} thn · floating {pct(FLOATING_RATE)}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {options.map(({ scheme, tenor: t, schedule, promo }) => {
          const on = scheme.id === selected;
          const ok = mampu(promo);
          return (
            <div key={scheme.id} className={cn("overflow-hidden rounded-xl border transition-all", on ? (ok ? "border-bri-blue ring-1 ring-bri-blue" : "border-red-400 ring-1 ring-red-400") : ok ? "border-bri-line" : "border-red-200")}>
              <button type="button" onClick={() => setSelected(scheme.id)} className={cn("flex w-full items-center gap-2 px-2.5 py-2 text-left", on ? "bg-bri-blue/5" : "bg-white hover:bg-bri-bg/40")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-bri-ink">{scheme.label}</span>
                    <span className="shrink-0 rounded-pill bg-bri-bg px-1.5 py-px text-[8px] font-semibold text-bri-navy">{scheme.rateLabel}</span>
                  </div>
                  <p className="truncate text-[7.5px] text-bri-muted">{scheme.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn("text-[11px] font-bold tabular-nums", ok ? "text-bri-blue" : "text-red-500")}>{formatRupiah(promo)}</div>
                  <div className={cn("text-[7px]", ok ? "text-bri-muted" : "font-semibold text-red-500")}>
                    {ok ? `awal /bln · ${t} thn` : `tambah DP ${formatRupiah(tambahanDp(schedule[0]?.rate ?? 0, t))}`}
                  </div>
                </div>
                <ChevronDown size={14} className={cn("shrink-0 text-bri-muted transition-transform", on && "rotate-180")} />
              </button>
              {on && schedule.length > 0 && (
                <div className="border-t border-bri-line bg-bri-bg/30 px-2.5 py-1.5">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 text-[8.5px]">
                    {schedule.map((p, i) => (
                      <div key={i} className="contents">
                        <span className="text-bri-ink">
                          Thn {p.fromYear}–{p.toYear}
                          <span className={cn("ml-1 rounded px-1 py-px text-[6.5px] font-semibold", p.floating ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-600")}>{p.floating ? "floating" : "fixed"}</span>
                        </span>
                        <span className="text-right tabular-nums text-bri-ink">{pct(p.rate)}</span>
                        <span className={cn("text-right font-semibold tabular-nums", mampu(p.angsuran) ? (p.floating ? "text-amber-700" : "text-bri-blue") : "text-red-500")}>{formatRupiah(p.angsuran)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alternative tenor recommendations */}
      {active && altRows.length > 0 && (
        <>
          <p className="mb-1 mt-2.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-bri-muted">
            Rekomendasi Tenor Lain <span className="font-normal normal-case text-bri-muted/70">· {active.scheme.label} · klik untuk pilih</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {altRows.map(({ t, promo, rate, ok, isNasabah, isSelected }) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenorPilih(t)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-1.5 text-left transition-all",
                  isSelected ? "border-bri-blue bg-bri-blue/10 ring-1 ring-bri-blue" : ok ? "border-bri-line bg-white hover:border-bri-blue/50" : "border-red-200 bg-red-50/40",
                )}
              >
                <span className="text-[9px] font-semibold text-bri-ink">
                  {t} thn{isNasabah && <span className="ml-1 text-[7px] text-bri-blue">(input)</span>}
                </span>
                <span className="text-right">
                  <span className={cn("block text-[10px] font-bold tabular-nums", ok ? "text-bri-ink" : "text-red-500")}>{formatRupiah(promo)}</span>
                  {!ok && <span className="block text-[6.5px] font-semibold text-red-500">tambah DP {formatRupiah(tambahanDp(rate, t))}</span>}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Agunan ref */}
      {agunan?.kelurahan && (
        <div className="mt-2 flex items-start gap-1 rounded-bubble bg-bri-bg px-2.5 py-2">
          <Home size={10} className="mt-0.5 shrink-0 text-bri-blue" />
          <span className="text-[8.5px] text-bri-ink">{[agunan.kelurahan, agunan.kecamatan, agunan.kota, agunan.provinsi, agunan.kodepos].filter(Boolean).join(", ")}</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Selected scheme summary + extra-DP warning */}
      {active && (
        active.promo <= (kemampuan ?? Infinity) || kemampuan == null || kemampuan <= 0 ? (
          <div className="mt-2 rounded-bubble bg-bri-bg px-2.5 py-1.5 text-[8.5px] text-bri-ink">
            Dipilih: <b>{active.scheme.label}</b> · {active.tenor} thn · angsuran awal{" "}
            <b className="text-bri-blue">{formatRupiah(active.promo)}</b>/bln (lalu floating {pct(FLOATING_RATE)})
          </div>
        ) : (
          <div className="mt-2 rounded-bubble border border-red-200 bg-red-50/60 px-2.5 py-1.5 text-[8.5px] text-red-600">
            <b>{active.scheme.label} · {active.tenor} thn</b> melebihi kemampuan — perlu{" "}
            <b>tambah DP {formatRupiah(tambahanDp(active.schedule[0]?.rate ?? 0, active.tenor))}</b> agar bisa pakai penawaran ini.
          </div>
        )
      )}

      <button
        type="button"
        onClick={onAccept}
        disabled={!active}
        className={cn("mt-2 w-full rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all", active ? "hover:opacity-90 active:scale-[0.98]" : "cursor-not-allowed opacity-60")}
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        Terima Penawaran
      </button>
      {canGoBack && (
        <button type="button" onClick={onGoBack} className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue">← Kembali</button>
      )}
    </div>
  );
}
