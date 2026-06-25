"use client";

import { ReceiptText, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { txnTable } from "./txnTableStyles";
import type { NodeStatus } from "@/types/orchestration";
import type { MutasiExtract } from "@/types/ocrExtract";

interface MutasiRekeningCardProps {
  status: NodeStatus;
  /** Parsed bank-statement transactions (from the uploaded mutasi). */
  mutasi?: MutasiExtract;
  /** True when the mutasi document has not been uploaded. */
  missing?: boolean;
}

// Columns: Tgl Mutasi · Nominal · Klasifikasi · Tipe (D/C) · Remark. Shared grid
// so these align column-for-column with "Transaksi Pemasukan" above:
// Nominal↔Gaji, Klasifikasi↔THR, Tipe↔Bonus, Remark↔Remark.
const ROW_GRID = txnTable.grid;

/**
 * MutasiRekeningCard — "DETAIL MUTASI REKENING".
 *
 * A per-transaction table sourced from the parsed mutasi rekening:
 * Tgl Mutasi · Nominal · Klasifikasi Transaksi (Gaji/THR/Bonus/…) ·
 * Tipe Transaksi (D/C) · Remark — with credit/debit totals.
 */
export function MutasiRekeningCard({ status, mutasi, missing }: MutasiRekeningCardProps) {
  const ready = status === "success" && !missing;
  const txns = mutasi?.transactions ?? [];
  const hasTxns = txns.length > 0;

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <ReceiptText size={11} className="text-bri-navy" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            Detail Mutasi Rekening
          </span>
        </div>
        {ready && hasTxns && (
          <span className="flex items-center gap-0.5 rounded-pill bg-bri-navy/10 px-1.5 py-px text-[7.5px] font-semibold text-bri-navy">
            <Sparkles size={8} /> {mutasi!.count ?? txns.length} transaksi
            {mutasi!.noRekening ? ` · ${mutasi!.noRekening}` : ""}
          </span>
        )}
      </div>

      {missing ? (
        <div className="flex h-12 items-center justify-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-500" strokeWidth={2} />
          <span className="text-[9px] font-medium text-amber-600">Dokumen mutasi belum diunggah</span>
        </div>
      ) : !ready ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu pemrosesan…</span>
        </div>
      ) : !hasTxns ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Tidak ada transaksi terbaca</span>
        </div>
      ) : (
        <div className={txnTable.box}>
          {/* Column header */}
          <div className={cn(ROW_GRID, txnTable.head)}>
            <span className="text-center">Tgl Mutasi</span>
            <span className="text-center">Nominal</span>
            <span className="text-center">Klasifikasi</span>
            <span className="text-center">Tipe</span>
            <span className="text-center">Remark</span>
          </div>
          {/* Rows */}
          <div className="max-h-[300px] overflow-y-auto scroll-thin">
            {txns.map((t, i) => {
              const kredit = t.dk === "Kredit";
              return (
                <div key={i} className={cn(ROW_GRID, txnTable.row)}>
                  <span className={txnTable.date}>{t.tanggal}</span>
                  <span className={cn(txnTable.money, kredit ? txnTable.credit : txnTable.debit)}>
                    {formatRupiah(t.nominal)}
                  </span>
                  <span className="min-w-0 text-center">
                    <span className={txnTable.badge}>{t.klasifikasi}</span>
                  </span>
                  <span className="text-center">
                    <span className={cn(
                      "inline-block rounded-pill px-1.5 py-0.5 text-[7.5px] font-bold",
                      kredit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
                    )}>
                      {kredit ? "C" : "D"}
                    </span>
                  </span>
                  <span className={txnTable.remark} title={t.remark}>{t.remark}</span>
                </div>
              );
            })}
          </div>
          {/* Totals */}
          <div className={cn("grid grid-cols-2 gap-2", txnTable.foot)}>
            <span className="text-emerald-600">
              Total Kredit: <span className="font-bold tabular-nums">{formatRupiah(mutasi!.totalKredit)}</span>
            </span>
            <span className="text-right text-red-500">
              Total Debet: <span className="font-bold tabular-nums">{formatRupiah(mutasi!.totalDebet)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
