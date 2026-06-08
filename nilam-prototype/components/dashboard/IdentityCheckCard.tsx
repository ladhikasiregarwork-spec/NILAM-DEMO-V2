"use client";

import { CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NodeStatus } from "@/types/orchestration";
import type { IdentityResult } from "@/types/engines";

interface IdentityCheckCardProps {
  status: NodeStatus;
  identity: IdentityResult | null | undefined;
  isJoint: boolean;
}

/** Label + value row used inside the identity card. */
function IdentityRow({
  label,
  value,
  redacted,
}: {
  label: string;
  value: string;
  redacted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-1">
      <span className="shrink-0 text-[8.5px] text-bri-muted">{label}</span>
      <span
        className={cn(
          "text-right text-[8.5px] font-medium",
          redacted ? "text-bri-muted/30" : "text-bri-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * IdentityCheckCard — Row B, second column.
 *
 * Layout: flex h-full flex-col so card fills its grid cell.
 * Header shrink-0; body flex-1 with justify-between so KTP tile + field rows
 * fill the height, and "Valid & Verified" footer is pinned at the bottom.
 *
 * Three display modes:
 *   1. Joint + success + identity present → full KTP preview + data rows.
 *   2. Non-joint persona → same layout but all values stripped to "—".
 *   3. Joint but not yet success → faint "Menunggu verifikasi…".
 */
export function IdentityCheckCard({
  status,
  identity,
  isJoint,
}: IdentityCheckCardProps) {
  const isSuccess = status === "success";

  // Non-joint: always show stripped card
  if (!isJoint) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 opacity-60 shadow-soft">
        {/* Header */}
        <div className="mb-1.5 flex shrink-0 items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            Identity Check (Pasangan)
          </span>
          <span className="rounded-pill bg-bri-bg px-1.5 py-0.5 text-[7.5px] font-semibold text-bri-muted">
            Tidak berlaku (Non-Joint)
          </span>
        </div>

        {/* Body — flex-1, KTP tile + rows stacked, justified to fill */}
        <div className="flex flex-1 flex-col justify-between gap-1.5">
          <div className="flex items-start gap-2">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-bri-line bg-bri-bg/40">
              <CreditCard size={20} className="text-bri-muted/40" strokeWidth={1.5} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-0.5">
              <IdentityRow label="NIK" value="—" redacted />
              <IdentityRow label="Nama" value="—" redacted />
              <IdentityRow label="Gender" value="—" redacted />
              <IdentityRow label="Tgl Lahir" value="—" redacted />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Joint + not yet success
  if (!isSuccess || !identity) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
        <span className="mb-1.5 block shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Identity Check (Pasangan)
        </span>
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-bri-line bg-bri-bg/40">
            <CreditCard size={20} className="text-bri-muted/40" strokeWidth={1.5} />
          </div>
          <p className="text-[9px] italic text-bri-muted/40">
            Menunggu verifikasi…
          </p>
        </div>
      </div>
    );
  }

  // Joint + success + identity present → full card
  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <span className="mb-1.5 block shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
        Identity Check (Pasangan)
      </span>

      {/* Body — flex-1, justify-between to pin footer */}
      <div className="flex flex-1 flex-col justify-between">
        {/* KTP tile + field rows */}
        <div className="flex items-start gap-2">
          {/* Generic KTP preview tile */}
          <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-bri-navy/20 bg-bri-bg">
            <CreditCard size={18} className="text-bri-navy" strokeWidth={1.5} />
            <span className="text-[6.5px] font-semibold uppercase tracking-wide text-bri-navy/70">
              KTP
            </span>
          </div>

          {/* Identity rows */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <IdentityRow label="NIK" value={identity.NIK} />
            <IdentityRow label="Nama" value={identity.Nama} />
            <IdentityRow label="Gender" value={identity.Gender} />
            <IdentityRow label="Tgl Lahir" value={identity.TanggalLahir} />
          </div>
        </div>

        {/* Valid & Verified footer — pinned at bottom */}
        <div className="flex shrink-0 items-center gap-1 border-t border-bri-line pt-1.5">
          <CheckCircle2 size={10} className="text-emerald-500" strokeWidth={2.5} />
          <span className="text-[9px] font-semibold text-emerald-600">
            Valid &amp; Verified
          </span>
        </div>
      </div>
    </div>
  );
}
