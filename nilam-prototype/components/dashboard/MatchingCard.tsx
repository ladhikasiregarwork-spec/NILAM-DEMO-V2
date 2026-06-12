"use client";

import { useMemo, useState } from "react";
import { GitCompareArrows, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { buildMatch, type MonthlyRecap } from "@/engines/matching/matchSlipMutasi";
import type { NodeStatus } from "@/types/orchestration";
import type { MutasiExtract, SlipGajiExtract } from "@/types/ocrExtract";

interface MatchingCardProps {
  status: NodeStatus;
  mutasi?: MutasiExtract;
  slip?: SlipGajiExtract;
  missing?: boolean;
}

const TXN_GRID = "grid grid-cols-[60px_1fr_1fr_1fr_2.2fr] items-center gap-1.5";
// Bulan · 8 editable cols · Total Income Mutasi (computed) · Status
const REC_GRID = "grid grid-cols-[56px_repeat(9,1fr)_50px] items-center gap-1";

type Field =
  | "incomeSlip" | "potonganNet" | "gajiSlip" | "thrSlip" | "bonusSlip"
  | "gajiMutasi" | "thrMutasi" | "bonusMutasi";

const COLS: { f: Field; label: string }[] = [
  { f: "incomeSlip", label: "Income Slip" },
  { f: "potonganNet", label: "Potongan Slip" },
  { f: "gajiSlip", label: "Gaji Slip" },
  { f: "thrSlip", label: "THR Slip" },
  { f: "bonusSlip", label: "Bonus Slip" },
  { f: "gajiMutasi", label: "Gaji Mut." },
  { f: "thrMutasi", label: "THR Mut." },
  { f: "bonusMutasi", label: "Bonus Mut." },
];
const FIELDS: Field[] = COLS.map((c) => c.f);

/** Slip ↔ mutasi counterpart, for the green/red match colouring. */
const PAIR: Partial<Record<Field, Field>> = {
  gajiSlip: "gajiMutasi", gajiMutasi: "gajiSlip",
  thrSlip: "thrMutasi", thrMutasi: "thrSlip",
  bonusSlip: "bonusMutasi", bonusMutasi: "bonusSlip",
};

/**
 * MatchingCard — "Matching Salary Slip & Bank Statement". Per-month recap
 * (Income/Potongan/Gaji/THR/Bonus from the SLIP, then Gaji/THR/Bonus from the
 * MUTASI + total mutasi income) above the raw income transactions. Amounts
 * editable; green/red flags whether slip matches mutasi; Status = Edited.
 */
export function MatchingCard({ status, mutasi, slip, missing }: MatchingCardProps) {
  const ready = status === "success" && !missing;
  const { txns, recaps } = useMemo(() => buildMatch(mutasi, slip), [mutasi, slip]);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const eff = (key: string, field: Field, original?: number) => {
    const e = edits[`${key}|${field}`];
    return e != null ? e : original;
  };
  const isEdited = (key: string, r: MonthlyRecap) =>
    FIELDS.some((f) => {
      const e = edits[`${key}|${f}`];
      return e != null && e !== (r[f] ?? 0);
    });
  const matchColor = (field: Field, key: string, r: MonthlyRecap): string => {
    const other = PAIR[field];
    if (!other) return "text-bri-ink";
    const a = eff(key, field, r[field]);
    const b = eff(key, other, r[other]);
    if (a == null || b == null || a <= 0 || b <= 0) return "text-bri-ink";
    return Math.abs(a - b) / Math.max(a, b) <= 0.05 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold";
  };

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2 shadow-soft">
      <div className="mb-1.5 flex items-center gap-1">
        <GitCompareArrows size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Matching Salary Slip &amp; Bank Statement
        </span>
      </div>

      {missing ? (
        <div className="flex h-12 items-center justify-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-500" strokeWidth={2} />
          <span className="text-[9px] font-medium text-amber-600">Butuh Slip Gaji &amp; Mutasi</span>
        </div>
      ) : !ready ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu pemrosesan…</span>
        </div>
      ) : txns.length === 0 ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/50">Tidak ada transaksi Gaji/THR/Bonus terdeteksi</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Monthly recap — slip vs mutasi, editable (ATAS) */}
          <div>
            <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Rekap per Bulan <span className="font-normal normal-case text-bri-muted/70">· slip vs mutasi · nominal bisa diedit</span>
            </p>
            <div className="overflow-x-auto scroll-thin">
              <div className="min-w-[880px] overflow-hidden rounded-lg border border-bri-line/70">
                <div className={cn(REC_GRID, "bg-bri-bg/70 px-2 py-1 text-[6.5px] font-semibold uppercase tracking-[0.02em] text-bri-muted")}>
                  <span>Bulan</span>
                  {COLS.map((c) => <span key={c.f} className="text-right">{c.label}</span>)}
                  <span className="text-right">Tot. Income Mut.</span>
                  <span className="text-center">Status</span>
                </div>
                {recaps.map((r) => {
                  const edited = isEdited(r.key, r);
                  const totMut =
                    (eff(r.key, "gajiMutasi", r.gajiMutasi) ?? 0) +
                    (eff(r.key, "thrMutasi", r.thrMutasi) ?? 0) +
                    (eff(r.key, "bonusMutasi", r.bonusMutasi) ?? 0);
                  return (
                    <div key={r.key} className={cn(REC_GRID, "border-t border-bri-line/50 px-2 py-1 text-[8.5px]")}>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-bri-ink">{r.bulan}</span>
                        {r.tglBayarSlip && (
                          <span className="truncate text-[6px] text-bri-muted" title={r.tglBayarSlip}>slip: {r.tglBayarSlip}</span>
                        )}
                      </span>
                      {FIELDS.map((f) => (
                        <input
                          key={f}
                          type="number"
                          value={eff(r.key, f, r[f]) ?? ""}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [`${r.key}|${f}`]: Number(e.target.value) }))}
                          className={cn(
                            "w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-[7.5px] tabular-nums hover:border-bri-line focus:border-bri-blue focus:bg-white focus:outline-none",
                            matchColor(f, r.key, r),
                          )}
                        />
                      ))}
                      <span className="px-1 text-right text-[7.5px] font-bold tabular-nums text-bri-navy">{formatRupiah(totMut)}</span>
                      <span className="flex justify-center">
                        <span className={cn("rounded-pill px-1.5 py-px text-[7px] font-semibold", edited ? "bg-amber-100 text-amber-700" : "bg-bri-bg text-bri-muted")}>
                          {edited ? "Edited" : "Non-edited"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-0.5 text-[7px] text-bri-muted/70">
              Income/Potongan/Gaji(THP)/THR/Bonus dari slip · Gaji/THR/Bonus + Tot. Income dari mutasi.
              <span className="text-emerald-600"> Hijau</span> = slip cocok dengan mutasi,
              <span className="text-red-500"> merah</span> = selisih · Status “Edited” bila diubah.
            </p>
          </div>

          {/* Income transactions (BAWAH) */}
          <div>
            <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Transaksi Pemasukan (dari Mutasi)
            </p>
            <div className="overflow-hidden rounded-lg border border-bri-line/70">
              <div className={cn(TXN_GRID, "bg-bri-bg/70 px-2 py-1 text-[7.5px] font-semibold uppercase tracking-[0.05em] text-bri-muted")}>
                <span>Tgl Mutasi</span>
                <span className="text-right">Gaji</span>
                <span className="text-right">THR</span>
                <span className="text-right">Bonus</span>
                <span>Remark</span>
              </div>
              <div className="max-h-[130px] overflow-y-auto scroll-thin">
                {txns.map((t, i) => (
                  <div key={i} className={cn(TXN_GRID, "border-t border-bri-line/50 px-2 py-1 text-[8.5px]")}>
                    <span className="tabular-nums text-bri-ink">{t.tanggal}</span>
                    <span className="text-right tabular-nums text-emerald-600">{t.gaji ? formatRupiah(t.gaji) : "–"}</span>
                    <span className="text-right tabular-nums text-bri-ink">{t.thr ? formatRupiah(t.thr) : "–"}</span>
                    <span className="text-right tabular-nums text-bri-ink">{t.bonus ? formatRupiah(t.bonus) : "–"}</span>
                    <span className="truncate text-bri-muted" title={t.remark}>{t.remark}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
