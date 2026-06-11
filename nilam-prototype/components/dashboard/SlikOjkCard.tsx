"use client";

import { Landmark, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import type { NodeStatus } from "@/types/orchestration";
import type { SlikLoan } from "@/types/profile";

interface SlikOjkCardProps {
  status: NodeStatus;
  loans: SlikLoan[];
  totalAngsuran: number;
  /** Credit score from the bureau pull. */
  score: number;
}

const GRID = "grid grid-cols-[1.5fr_1fr_1fr_50px_74px_1fr_60px_40px] items-center gap-2";

/** "8.25" → "8,25%", 21 → "21%". */
const pct = (b?: number) =>
  b == null ? "—" : `${b.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}%`;

/** "20241003" → "10/24" (MM/YY). */
const ym = (s?: string) => (s && s.length >= 6 ? `${s.slice(4, 6)}/${s.slice(2, 4)}` : "—");

/**
 * SlikOjkCard — "SLIK OJK (every loan user ever have)". Per-facility table from
 * the parsed SLIK Excel: lembaga, plafon, baki, bunga (p.a.), tenor, computed
 * angsuran, active status, collectibility — plus the TOTAL monthly installment
 * of active facilities. Gated until the SLIK retrieval step succeeds.
 */
export function SlikOjkCard({ status, loans, totalAngsuran, score }: SlikOjkCardProps) {
  const ready = status === "success";

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2 shadow-soft">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Landmark size={11} className="text-bri-navy" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            SLIK OJK · Riwayat Kredit
          </span>
        </div>
        {ready && (
          <div className="flex items-center gap-1 rounded-pill bg-bri-bg px-2 py-0.5">
            <ShieldCheck size={9} className="text-emerald-500" strokeWidth={2.5} />
            <span className="text-[8px] text-bri-muted">Score</span>
            <span className="text-[11px] font-bold text-bri-navy">{score}</span>
          </div>
        )}
      </div>

      {!ready ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu SLIK…</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bri-line/70">
          <div className={cn(GRID, "bg-bri-bg/70 px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.04em] text-bri-muted")}>
            <span>Lembaga / Jenis</span>
            <span className="text-right">Plafon</span>
            <span className="text-right">Baki Debet</span>
            <span className="text-right">Bunga</span>
            <span className="text-center">Tenor</span>
            <span className="text-right">Angsuran</span>
            <span className="text-center">Status</span>
            <span className="text-center">Kol</span>
          </div>

          {loans.map((l, i) => (
            <div key={`${l.lembaga}-${i}`} className={cn(GRID, "border-t border-bri-line/50 px-2 py-1 text-[8.5px]")}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-bri-ink" title={l.lembaga}>{l.lembaga}</span>
                <span className="truncate text-[7px] text-bri-muted" title={l.jenis}>{l.jenis}</span>
              </span>
              <span className="text-right tabular-nums text-bri-ink">{formatRupiah(l.plafon)}</span>
              <span className="text-right tabular-nums text-bri-ink">{formatRupiah(l.baki)}</span>
              <span className="text-right tabular-nums text-bri-ink">{pct(l.sukuBunga)}</span>
              <span className="text-center text-[7.5px] tabular-nums text-bri-muted">
                {ym(l.tanggalMulai)}–{ym(l.tanggalJatuhTempo)}
              </span>
              <span className={cn("text-right font-semibold tabular-nums", l.aktif === false ? "text-bri-muted/60" : "text-bri-blue")}>
                {formatRupiah(l.angsuran)}
              </span>
              <span className="flex justify-center">
                <span className={cn("rounded-pill px-1.5 py-px text-[7px] font-semibold", l.aktif === false ? "bg-bri-bg text-bri-muted" : "bg-emerald-50 text-emerald-600")}>
                  {l.aktif === false ? "Non-aktif" : "Aktif"}
                </span>
              </span>
              <span className="flex justify-center">
                <span className={cn("rounded-pill px-1.5 py-px text-[7.5px] font-semibold", l.kualitas === 1 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                  {l.kualitas}
                </span>
              </span>
            </div>
          ))}

          <div className={cn(GRID, "border-t border-bri-line bg-bri-bg/40 px-2 py-1 text-[8.5px]")}>
            <span className="font-semibold text-bri-ink">Total Angsuran (Aktif)</span>
            <span />
            <span />
            <span />
            <span />
            <span className="text-right font-bold tabular-nums text-bri-navy">{formatRupiah(totalAngsuran)}</span>
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
