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
const REC_GRID = "grid grid-cols-[78px_repeat(5,1fr)_64px] items-center gap-1";

type Field = "totalGaji" | "totalThr" | "totalBonus" | "totalIncomeSlip" | "totalPotonganSlip";
const FIELDS: Field[] = ["totalGaji", "totalThr", "totalBonus", "totalIncomeSlip", "totalPotonganSlip"];

/**
 * MatchingCard — "Matching Salary Slip & Bank Statement". Lists every income
 * transaction from the bank statement (Gaji/THR/Bonus) and a per-month recap
 * pairing it with the slip's Total Upah / Total Potongan. The recap amounts are
 * editable; a Status column flags any month whose figures were edited.
 */
export function MatchingCard({ status, mutasi, slip, missing }: MatchingCardProps) {
  const ready = status === "success" && !missing;
  const { txns, recaps } = useMemo(() => buildMatch(mutasi, slip), [mutasi, slip]);
  // edits keyed "monthKey|field" → number
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
          {/* Transactions */}
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
              <div className="max-h-[150px] overflow-y-auto scroll-thin">
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

          {/* Monthly recap — editable */}
          <div>
            <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Rekap per Bulan <span className="font-normal normal-case text-bri-muted/70">· nominal bisa diedit</span>
            </p>
            <div className="overflow-hidden rounded-lg border border-bri-line/70">
              <div className={cn(REC_GRID, "bg-bri-bg/70 px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.03em] text-bri-muted")}>
                <span>Bulan</span>
                <span className="text-right">Tot. Gaji</span>
                <span className="text-right">Tot. THR</span>
                <span className="text-right">Tot. Bonus</span>
                <span className="text-right">Income (slip)</span>
                <span className="text-right">Potongan (slip)</span>
                <span className="text-center">Status</span>
              </div>
              {recaps.map((r) => {
                const edited = isEdited(r.key, r);
                return (
                  <div key={r.key} className={cn(REC_GRID, "border-t border-bri-line/50 px-2 py-1 text-[8.5px]")}>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-bri-ink">{r.bulan}</span>
                      {r.tglBayarSlip && (
                        <span className="truncate text-[6.5px] text-bri-muted" title={r.tglBayarSlip}>
                          slip: {r.tglBayarSlip}
                        </span>
                      )}
                    </span>
                    {FIELDS.map((f) => (
                      <input
                        key={f}
                        type="number"
                        value={eff(r.key, f, r[f]) ?? ""}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [`${r.key}|${f}`]: Number(e.target.value) }))
                        }
                        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-[8px] tabular-nums text-bri-ink hover:border-bri-line focus:border-bri-blue focus:bg-white focus:outline-none"
                      />
                    ))}
                    <span className="flex justify-center">
                      <span
                        className={cn(
                          "rounded-pill px-1.5 py-px text-[7px] font-semibold",
                          edited ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {edited ? "Diedit" : "Asli"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-0.5 text-[7px] text-bri-muted/70">
              Income &amp; Potongan diambil dari Slip Gaji; Gaji/THR/Bonus dari Mutasi. Edit nominal untuk koreksi → Status berubah “Diedit”.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
