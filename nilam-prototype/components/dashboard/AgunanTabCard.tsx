"use client";

import { useState } from "react";
import { ImageOff, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { AgunanInfoCard } from "./AgunanInfoCard";
import { AgunanCalcCard } from "./AgunanCalcCard";
import { LandPriceComparison } from "./LandPriceComparison";
import type { NodeStatus } from "@/types/orchestration";
import type { AgunanData } from "@/types/agunan";
import type { AgunanKlasifikasi } from "@/data/ltv";

interface AgunanTabCardProps {
  status: NodeStatus;
  agunan?: AgunanData;
  uangMuka?: number;
  npw?: number;
  npwLand?: number;
  klas: AgunanKlasifikasi;
  setKlas: (patch: Partial<AgunanKlasifikasi>) => void;
}

type Tab = "informasi" | "penilaian";

/** Collateral photo from the listing link (og:image); placeholder when absent. */
function GambarAgunan({ agunan }: { agunan?: AgunanData }) {
  const lokasi = agunan
    ? [agunan.kelurahan, agunan.kecamatan, agunan.kota, agunan.provinsi].filter(Boolean).join(", ")
    : "";
  const img = agunan?.imageUrl;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-bri-line bg-bri-bg/40 px-3 py-2 shadow-soft">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt="Foto agunan"
          referrerPolicy="no-referrer"
          className="h-20 w-28 shrink-0 rounded-lg border border-bri-line object-cover"
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-bri-line bg-white">
          <ImageOff size={18} className="text-bri-muted/60" />
          <span className="text-[7px] text-bri-muted/70">Foto agunan</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-bri-ink">Gambar Agunan</p>
        <p className="text-[8px] text-bri-muted">
          {img ? "Foto dari listing properti (link)." : "Foto properti belum tersedia (input manual)."}
        </p>
        {lokasi && (
          <p className="mt-1 flex items-start gap-1 text-[8px] text-bri-ink">
            <MapPin size={9} className="mt-0.5 shrink-0 text-bri-muted" /> {lokasi}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * AgunanTabCard — kartu agunan 2 tab:
 *   1. Informasi Agunan  (AgunanInfoCard)
 *   2. Gambar, NPW & Perhitungan  (foto + AgunanCalcCard: NPW × LTV)
 */
export function AgunanTabCard({ status, agunan, uangMuka, npw, npwLand, klas, setKlas }: AgunanTabCardProps) {
  const [tab, setTab] = useState<Tab>("informasi");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1 rounded-pill border border-bri-line bg-white p-0.5 shadow-soft">
        {([["informasi", "Informasi Agunan"], ["penilaian", "Gambar · NPW · Hitung"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-pill px-2 py-1 text-[9px] font-semibold transition-colors",
              tab === id ? "bg-bri-navy text-white" : "text-bri-muted hover:text-bri-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "informasi" ? (
        <AgunanInfoCard agunan={agunan} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <GambarAgunan agunan={agunan} />
          <AgunanCalcCard status={status} agunan={agunan} uangMuka={uangMuka} npw={npw} klas={klas} setKlas={setKlas} />
          <LandPriceComparison agunan={agunan} npwLand={npwLand} npw={npw} />
        </div>
      )}
    </div>
  );
}
