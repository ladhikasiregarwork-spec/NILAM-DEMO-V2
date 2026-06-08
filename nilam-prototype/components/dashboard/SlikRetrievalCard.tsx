"use client";

import { Landmark, CheckCircle2 } from "lucide-react";
import type { NodeStatus } from "@/types/orchestration";
import type { SlikResult } from "@/types/engines";

interface SlikRetrievalCardProps {
  status: NodeStatus;
  slik: { nasabah: SlikResult; pasangan?: SlikResult } | undefined;
  /** True when card is in a 2-col row (wider); lays out fields in 2-col grid */
  isWide?: boolean;
}

/** Format a number as Indonesian Rupiah: Rp150.000.000 */
function fmtRp(value: number): string {
  return "Rp" + value.toLocaleString("id-ID");
}

/** Label / value row used in the SLIK card. */
function SlikRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-1">
      <span className="shrink-0 text-[8px] text-bri-muted">{label}</span>
      <span
        className={
          valueClassName ?? "text-right text-[8px] font-medium text-bri-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Single SLIK data section (Nasabah or Pasangan).
 * Shows icon tile + rows: Outstanding, Angsuran, Tunggakan, Status, Score.
 * When `wide` is true, lays out the four data rows in a 2-column grid to fill the width.
 */
function SlikSection({
  title,
  data,
  wide = false,
}: {
  title: string;
  data: SlikResult;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Sub-section label */}
      <span className="mb-1 block text-[7.5px] font-semibold uppercase tracking-[0.1em] text-bri-navy/70">
        {title}
      </span>

      <div className="flex items-start gap-3 flex-1">
        {/* SLIK icon tile — slightly larger when wide */}
        <div
          className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-bri-navy/20 bg-bri-bg ${
            wide ? "h-12 w-12" : "h-9 w-9"
          }`}
        >
          <Landmark size={wide ? 18 : 13} className="text-bri-navy" strokeWidth={1.5} />
        </div>

        {/* Data rows — 2-col grid when wide, single col when compact */}
        <div
          className={`min-w-0 flex-1 ${
            wide
              ? "grid grid-cols-2 gap-x-4 gap-y-0.5 content-start"
              : "flex flex-col gap-0.5"
          }`}
        >
          <SlikRow
            label="Outstanding Kredit"
            value={fmtRp(data.outstanding)}
          />
          <SlikRow
            label="Angsuran Bulanan"
            value={fmtRp(data.angsuranBulanan)}
          />
          <SlikRow
            label="Tunggakan"
            value={data.tunggakan === 0 ? "0" : fmtRp(data.tunggakan)}
          />
          <SlikRow
            label="Status"
            value={data.status}
            valueClassName="text-right text-[8px] font-semibold text-emerald-600"
          />
        </div>
      </div>

      {/* Score */}
      <div className="mt-1.5 flex items-baseline gap-1.5 border-t border-bri-line/60 pt-1.5">
        <span className="text-[8px] text-bri-muted">Score</span>
        <span className={`font-bold leading-none text-bri-navy ${wide ? "text-[20px]" : "text-[16px]"}`}>
          {data.score}
        </span>
      </div>
    </div>
  );
}

/**
 * SlikRetrievalCard — Row B, third column.
 *
 * Layout: flex h-full flex-col so card fills its grid cell.
 * Success state shows SLIK NASABAH section and (if joint) SLIK PASANGAN below,
 * separated by a thin divider.
 * Idle/running shows a faint placeholder.
 */
export function SlikRetrievalCard({ status, slik, isWide = false }: SlikRetrievalCardProps) {
  const isSuccess = status === "success" && !!slik;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          SLIK Retrieval
        </span>
        {isSuccess && (
          <div className="flex items-center gap-0.5 rounded-pill bg-emerald-50 px-1.5 py-0.5">
            <CheckCircle2 size={8} className="text-emerald-500" strokeWidth={2.5} />
            <span className="text-[7.5px] font-semibold text-emerald-600">Completed</span>
          </div>
        )}
      </div>

      {!isSuccess ? (
        /* ── Idle / running ──────────────────────────────────── */
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-bri-line bg-bri-bg/40">
            <Landmark size={16} className="text-bri-muted/40" strokeWidth={1.5} />
          </div>
          <p className="text-[9px] italic text-bri-muted/40">Menunggu SLIK…</p>
        </div>
      ) : (
        /* ── Success — Nasabah section + optional Pasangan section ──
             isWide (non-joint, single section): SlikSection expands to fill
             narrow (joint, two sections): stacked Nasabah + Pasangan
        ── */
        <div className="flex flex-1 flex-col justify-between gap-1.5 min-h-0">
          {/* SLIK Nasabah — wide=true when isWide so internals use 2-col layout */}
          <SlikSection title="SLIK Nasabah" data={slik.nasabah} wide={isWide} />

          {/* SLIK Pasangan — rendered only when joint (pasangan present) */}
          {slik.pasangan && (
            <>
              {/* Thin divider between sections */}
              <div className="shrink-0 border-t border-bri-line" />
              <SlikSection title="SLIK Pasangan" data={slik.pasangan} wide={false} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
