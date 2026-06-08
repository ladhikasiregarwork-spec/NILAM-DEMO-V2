"use client";

import { Users } from "lucide-react";
import type { NodeStatus } from "@/types/orchestration";
import type { KartuKeluarga } from "@/types/profile";
import { MissingDocNote } from "./KtpInfoCard";

interface KkInfoCardProps {
  status: NodeStatus;
  kk: KartuKeluarga | undefined;
  /** True when the KK was not uploaded — show a "belum diunggah" state. */
  missing?: boolean;
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
 * KkInfoCard — "KK INFORMATION". Family-card (Kartu Keluarga) details: number,
 * head of family, address, and the member list. Gated until OCR succeeds.
 */
export function KkInfoCard({ status, kk, missing }: KkInfoCardProps) {
  const ready = status === "success" && !!kk && !missing;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      <div className="mb-1.5 flex shrink-0 items-center gap-1">
        <Users size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          KK Information
        </span>
      </div>

      {missing ? (
        <MissingDocNote />
      ) : !ready ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu pemrosesan…</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-0.5">
          <Row label="No. KK" value={kk.nomorKK} />
          <Row label="Kepala Keluarga" value={kk.kepalaKeluarga} />

          {/* Members */}
          <div className="mt-1 border-t border-bri-line pt-1">
            <span className="text-[8.5px] text-bri-muted">Anggota Keluarga</span>
            <div className="mt-0.5 flex flex-col gap-0.5">
              {kk.members.map((m) => (
                <div key={m.nama} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[8.5px] font-medium text-bri-ink">{m.nama}</span>
                  <span className="shrink-0 rounded-pill bg-bri-bg px-1.5 py-px text-[7.5px] font-medium text-bri-muted">
                    {m.hubungan}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
