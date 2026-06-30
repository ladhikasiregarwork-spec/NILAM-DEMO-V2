"use client";

import { useMemo, useState } from "react";
import { Search, ChevronRight, Users, Fuel, Cog } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { searchVehicles } from "@/data/vehicleCatalog";
import type { Vehicle } from "@/types/auto";
import { VehiclePhoto } from "./VehiclePhoto";

interface VehicleSearchScreenProps {
  selected?: Vehicle;
  onSelect: (v: Vehicle) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * VehicleSearchScreen — type the vehicle you want; we surface matching models
 * from the catalog (simulated "internet" search). Tap a result to view its
 * details + loan calculator.
 */
export function VehicleSearchScreen({ selected, onSelect, onGoBack, canGoBack }: VehicleSearchScreenProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchVehicles(query), [query]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-3 py-2">
      <div className="mb-2 shrink-0">
        <h2 className="text-[13px] font-bold text-bri-ink">Cari Kendaraan</h2>
        <p className="text-[9px] text-bri-muted">Ketik merek atau model mobil yang Anda inginkan</p>
      </div>

      {/* Search box */}
      <div className="relative mb-2 shrink-0">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bri-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="mis. Avanza, Honda, SUV…"
          className="w-full rounded-pill border border-bri-line bg-white py-2 pl-8 pr-3 text-[10px] text-bri-ink outline-none focus:border-bri-blue"
        />
      </div>

      <p className="mb-1 shrink-0 text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
        {query.trim() ? `${results.length} hasil` : "Populer"}
      </p>

      {/* Results */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto scroll-thin">
        {results.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-bri-muted">
            <Search size={24} className="mb-1 opacity-40" />
            <p className="text-[9px]">Tidak ada kendaraan cocok.</p>
            <p className="text-[8px]">Coba kata kunci lain.</p>
          </div>
        )}
        {results.map((v) => {
          const active = selected?.id === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all active:scale-[0.99]",
                active ? "border-bri-blue bg-bri-blue/5" : "border-bri-line bg-white hover:border-bri-blue/40 hover:bg-bri-bg/40",
              )}
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                <VehiclePhoto vehicle={v} iconSize={26} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-bri-ink">{v.fullName}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[7.5px] text-bri-muted">
                  <span className="flex items-center gap-0.5"><Users size={8} /> {v.seats}</span>
                  <span className="flex items-center gap-0.5"><Cog size={8} /> {v.transmission}</span>
                  <span className="flex items-center gap-0.5"><Fuel size={8} /> {v.fuel}</span>
                </div>
                <p className="mt-0.5 text-[10px] font-bold text-bri-blue">{formatRupiah(v.price)}</p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-bri-muted" />
            </button>
          );
        })}
      </div>

      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-2 shrink-0 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
