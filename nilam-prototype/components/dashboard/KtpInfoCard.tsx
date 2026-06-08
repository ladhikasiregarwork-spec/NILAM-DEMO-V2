"use client";

import { CreditCard, AlertTriangle } from "lucide-react";
import type { NodeStatus } from "@/types/orchestration";
import type { CustomerProfile } from "@/types/profile";

interface KtpInfoCardProps {
  status: NodeStatus;
  profile: CustomerProfile | undefined;
  /** Address from the KTP (sourced from the household record). */
  alamat: string;
  /** True when the KTP was not uploaded — show a "belum diunggah" state. */
  missing?: boolean;
}

/** Shared "document not uploaded" placeholder. */
export function MissingDocNote() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
      <AlertTriangle size={16} className="text-amber-500" strokeWidth={2} />
      <span className="text-[8.5px] font-medium text-amber-600">Dokumen belum diunggah</span>
    </div>
  );
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
 * KtpInfoCard — "KTP INFORMATION". Identity fields extracted from the KTP.
 * Gated until the OCR/extraction step succeeds.
 */
export function KtpInfoCard({ status, profile, alamat, missing }: KtpInfoCardProps) {
  const ready = status === "success" && !!profile && !missing;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      <div className="mb-1.5 flex shrink-0 items-center gap-1">
        <CreditCard size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          KTP Information
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
          <Row label="NIK" value={profile.nik} />
          <Row label="Nama" value={profile.nama} />
          <Row label="Jenis Kelamin" value={profile.gender} />
          <Row label="Tgl Lahir" value={profile.tanggalLahir} />
          <div className="mt-1 border-t border-bri-line pt-1">
            <span className="text-[8.5px] text-bri-muted">Alamat</span>
            <p className="text-[8.5px] font-medium leading-snug text-bri-ink">{alamat}</p>
          </div>
        </div>
      )}
    </div>
  );
}
