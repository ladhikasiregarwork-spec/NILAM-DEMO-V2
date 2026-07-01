"use client";

import { Inbox, ClipboardList } from "lucide-react";
import { PhoneMockup } from "@/components/mobile/PhoneMockup";
import { UserCheck } from "lucide-react";

/**
 * RmPlaceholder — shown in the right-hand RM phone before the customer has
 * chosen a use case (KPR or KKB). Prevents the "Collateral Appraisal" (KPR)
 * header from flashing by default while `loanType` is still null.
 */
export function RmPlaceholder() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        <PhoneMockup>
          <div className="flex shrink-0 items-center gap-2 border-b border-bri-line bg-bri-navy px-3 py-2 text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-white/15">
              <UserCheck size={12} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold leading-tight">NILAM</p>
              <p className="text-[8px] text-white/70">Menunggu Pengajuan</p>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bri-bg">
              <Inbox size={26} className="text-bri-muted/60" />
            </div>
            <p className="text-[11px] font-bold text-bri-ink">Belum ada pengajuan</p>
            <p className="text-[9px] leading-relaxed text-bri-muted">
              Ajukan KPR atau KKB pada aplikasi nasabah. Panel penilaian akan muncul setelah ada pengajuan.
            </p>
          </div>
        </PhoneMockup>
      </div>
      <div className="flex h-[60px] shrink-0 flex-col items-center justify-center border-t border-bri-line bg-white px-3">
        <span className="flex items-center gap-1.5 text-bri-muted">
          <UserCheck size={13} />
          <span className="text-[9px] font-medium">Menunggu Pengajuan</span>
        </span>
      </div>
    </div>
  );
}

/**
 * DashboardPlaceholder — shown in the bottom "Behind The Scene" analyst panel
 * before the customer has chosen a use case (KPR or KKB).
 */
export function DashboardPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-[#F5F7FA] p-3">
      <div className="flex flex-col items-center gap-3 rounded-card border border-bri-line bg-white px-8 py-10 text-center shadow-soft">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bri-bg text-bri-blue">
          <ClipboardList size={26} />
        </span>
        <p className="text-[13px] font-bold text-bri-navy">Menunggu pengajuan</p>
        <p className="max-w-sm text-[11px] text-bri-muted">
          Ajukan KPR atau KKB pada aplikasi nasabah untuk menampilkan Dashboard Analyst di sini.
        </p>
      </div>
    </div>
  );
}
