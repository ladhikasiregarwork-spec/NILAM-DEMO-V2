"use client";

import { Landmark } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import type { NodeStatus } from "@/types/orchestration";
import type { MutationRecord, MutationCredit } from "@/types/profile";

interface MutationRecordCardProps {
  /** Gates the card: data only shows once the OCR/extraction step succeeds. */
  status: NodeStatus;
  record: MutationRecord | undefined;
}

/** Small coloured dot keyed by credit category. */
const CATEGORY_DOT: Record<MutationCredit["category"], string> = {
  salary: "bg-bri-blue",
  thr: "bg-emerald-500",
  bonus: "bg-amber-500",
  other: "bg-bri-muted/50",
};

/**
 * MutationRecordCard — credits detected in the customer's bank mutation
 * (mutasi rekening): Salary, THR, Bonus, and other incoming credits. Each row
 * shows the transaction count, the smallest single credit (min), and the total.
 * Pending until the extraction step (`status`) succeeds.
 */
export function MutationRecordCard({ status, record }: MutationRecordCardProps) {
  const isSuccess = status === "success";

  if (!isSuccess || !record) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
        <span className="mb-1.5 block shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Record Mutasi
        </span>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu hasil mutasi…</span>
        </div>
      </div>
    );
  }

  const total = record.credits.reduce((acc, c) => acc + c.sum, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <Landmark size={10} className="text-bri-navy" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            Record Mutasi
          </span>
        </div>
        <span className="rounded-pill bg-bri-bg px-1.5 py-px text-[7.5px] font-medium text-bri-muted">
          {record.periodLabel}
        </span>
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-bri-line/70">
        {/* Column header */}
        <div className="grid shrink-0 grid-cols-[1fr_auto_auto] items-center gap-2 bg-bri-bg/70 px-2 py-1">
          <span className="text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
            Kredit
          </span>
          <span className="w-8 text-center text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
            Trx
          </span>
          <span className="w-[88px] text-right text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
            Total
          </span>
        </div>

        {/* Rows — scroll internally so the fixed card never clips */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin">
          {record.credits.map((c) => (
            <div
              key={c.label}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-bri-line/50 px-2 py-1 first:border-t-0"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", CATEGORY_DOT[c.category])} />
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-[9px] font-medium text-bri-ink">{c.label}</span>
                  <span className="text-[7px] text-bri-muted">min {formatRupiah(c.min)}</span>
                </div>
              </div>
              <span className="w-8 text-center text-[9px] font-semibold text-bri-muted tabular-nums">
                {c.count}×
              </span>
              <span className="w-[88px] text-right text-[9px] font-bold text-bri-blue tabular-nums">
                {formatRupiah(c.sum)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total — pinned at bottom */}
      <div className="mt-1 flex shrink-0 items-center justify-between border-t border-bri-line pt-1">
        <span className="text-[8px] font-medium text-bri-muted">Total Kredit Masuk</span>
        <span className="text-[9px] font-bold text-bri-navy tabular-nums">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}
