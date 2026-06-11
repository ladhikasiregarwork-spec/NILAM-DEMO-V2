"use client";

import { Home, MapPin, Sparkles, Building2 } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import { computeNpw } from "@/engines/npw/npwModel";
import type { AgunanData } from "@/types/agunan";

interface AgunanInfoCardProps {
  agunan?: AgunanData;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-[8.5px] text-bri-muted">{label}</span>
      <span className="text-right text-[8.5px] font-medium text-bri-ink">{value}</span>
    </div>
  );
}

/**
 * AgunanInfoCard — "NPWP & INFORMASI AGUNAN". Shows the customer NPWP and the
 * collateral property details (manual or extracted from a Rumah123 link).
 */
export function AgunanInfoCard({ agunan }: AgunanInfoCardProps) {
  const hasAgunan = !!agunan && (agunan.harga != null || agunan.kelurahan != null);
  const npw = computeNpw(agunan);
  const lokasi = agunan
    ? [agunan.kelurahan, agunan.kecamatan, agunan.kota, agunan.provinsi, agunan.kodepos]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Building2 size={11} className="text-bri-navy" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            NPW &amp; Informasi Agunan
          </span>
        </div>
        {agunan?.sumber === "link" && (
          <span className="flex items-center gap-0.5 rounded-pill bg-bri-navy/10 px-1.5 py-px text-[7.5px] font-semibold text-bri-navy">
            <Sparkles size={8} /> dari link
          </span>
        )}
      </div>

      {/* NPW — Nilai Pasar Wajar (model output) */}
      <div className="flex items-start justify-between gap-2">
        <span className="shrink-0 text-[8.5px] text-bri-muted">NPW (Nilai Pasar Wajar)</span>
        <span className="text-right text-[8.5px] font-semibold text-bri-navy">
          {npw.value != null ? formatRupiah(npw.value) : "Menunggu model"}
          {npw.value != null && npw.placeholder && (
            <span className="ml-1 font-normal text-bri-muted">· estimasi (model menyusul)</span>
          )}
        </span>
      </div>

      {!hasAgunan ? (
        <div className="flex h-10 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Data agunan belum diisi…</span>
        </div>
      ) : (
        <div className="mt-1 flex items-stretch gap-3 border-t border-bri-line pt-1.5">
          {/* Harga hero */}
          <div className="flex w-[180px] shrink-0 flex-col justify-center rounded-lg border border-bri-line/70 bg-bri-bg/50 px-3 py-1.5">
            <div className="flex items-center gap-1">
              <Home size={10} className="text-bri-navy" />
              <span className="text-[8px] text-bri-muted">Harga Rumah</span>
            </div>
            <span className="text-[15px] font-bold leading-tight text-bri-navy tabular-nums">
              {agunan!.harga != null ? formatRupiah(agunan!.harga) : "—"}
            </span>
            <span className="text-[8px] text-bri-muted">
              LB {agunan!.luasBangunan ?? "—"} m² · LT {agunan!.luasTanah ?? "—"} m²
            </span>
          </div>

          {/* Location detail */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <Row label="Provinsi" value={agunan!.provinsi || "—"} />
            <Row label="Kota/Kab." value={agunan!.kota || "—"} />
            <Row label="Kecamatan" value={agunan!.kecamatan || "—"} />
            <Row label="Kelurahan" value={agunan!.kelurahan || "—"} />
            <Row label="Kodepos" value={agunan!.kodepos || "—"} />
          </div>
        </div>
      )}

      {hasAgunan && lokasi && (
        <div className="mt-1 flex items-start gap-1 border-t border-bri-line pt-1">
          <MapPin size={9} className="mt-0.5 shrink-0 text-bri-muted" />
          <span className="text-[8px] text-bri-muted">{lokasi}</span>
        </div>
      )}
    </div>
  );
}
