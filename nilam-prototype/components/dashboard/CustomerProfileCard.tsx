"use client";

import { UserCircle2, BadgeCheck, Building2 } from "lucide-react";
import type { NodeStatus } from "@/types/orchestration";
import type { CustomerProfile } from "@/types/profile";

interface CustomerProfileCardProps {
  /** Gates the card: data only shows once the OCR/extraction step succeeds. */
  status: NodeStatus;
  profile: CustomerProfile | undefined;
}

/** Label + value row, mirroring the IdentityCheckCard pattern. */
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-1">
      <span className="shrink-0 text-[8.5px] text-bri-muted">{label}</span>
      <span className="text-right text-[8.5px] font-medium text-bri-ink">{value}</span>
    </div>
  );
}

/**
 * CustomerProfileCard — the main customer's (nasabah) identity + a short
 * employment summary. Mirrors the spouse IdentityCheckCard styling so the two
 * read as a pair. Pending until the extraction step (`status`) succeeds.
 */
export function CustomerProfileCard({ status, profile }: CustomerProfileCardProps) {
  const isSuccess = status === "success";

  if (!isSuccess || !profile) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
        <span className="mb-1.5 block shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Customer Profile
        </span>
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-bri-line bg-bri-bg/40">
            <UserCircle2 size={22} className="text-bri-muted/40" strokeWidth={1.5} />
          </div>
          <p className="text-[9px] italic text-bri-muted/40">Menunggu data nasabah…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <span className="mb-1.5 block shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
        Customer Profile
      </span>

      {/* Body — avatar + field rows, footer pinned */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start gap-2">
          {/* Avatar tile */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-bri-navy/20 bg-bri-bg">
            <UserCircle2 size={20} className="text-bri-navy" strokeWidth={1.5} />
          </div>

          {/* Identity rows */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <ProfileRow label="Nama" value={profile.nama} />
            <ProfileRow label="NIK" value={profile.nik} />
            <ProfileRow label="Gender" value={profile.gender} />
            <ProfileRow label="Tgl Lahir" value={profile.tanggalLahir} />
          </div>
        </div>

        {/* Employment summary */}
        <div className="mt-1 flex flex-col gap-0.5 border-t border-bri-line pt-1.5">
          <div className="flex items-center gap-1">
            <Building2 size={9} className="text-bri-navy/70" strokeWidth={2} />
            <span className="truncate text-[8.5px] font-medium text-bri-ink">{profile.perusahaan}</span>
          </div>
          <div className="flex items-center gap-1">
            <BadgeCheck size={9} className="text-emerald-500" strokeWidth={2} />
            <span className="truncate text-[8.5px] text-bri-muted">{profile.jabatan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
