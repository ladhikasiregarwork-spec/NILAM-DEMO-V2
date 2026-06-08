"use client";

import {
  CreditCard,
  Users,
  FileText,
  Landmark,
  FileSignature,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { DOCUMENTS } from "@/data/documents";
import type { DocumentId, DocumentStatus } from "@/types/documents";

interface UploadedDocsStripProps {
  statuses: Record<DocumentId, DocumentStatus>;
}

const DOC_ICONS: Record<DocumentId, React.ComponentType<{ size?: number; className?: string }>> = {
  ktp:           CreditCard,
  kk:            Users,
  slip_gaji:     FileText,
  mutasi:        Landmark,
  sk_perusahaan: FileSignature,
};

const STATUS_UI: Record<DocumentStatus, { ring: string; chip: string; icon: React.ReactNode; label: string }> = {
  pending: {
    ring: "border-dashed border-amber-300 bg-amber-50/40",
    chip: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle size={8} strokeWidth={3} />,
    label: "Belum Upload",
  },
  processing: {
    ring: "border-bri-navy/40 bg-bri-bg/50",
    chip: "bg-bri-navy/10 text-bri-navy",
    icon: <Loader2 size={8} className="animate-spin" strokeWidth={3} />,
    label: "Processing",
  },
  completed: {
    ring: "border-emerald-300 bg-emerald-50/60",
    chip: "bg-emerald-100 text-emerald-700",
    icon: <Check size={8} strokeWidth={3} />,
    label: "Completed",
  },
};

/**
 * UploadedDocsStrip — the "DATA ALREADY UPLOAD" header section. A horizontal
 * row of the five documents (KTP, KK, Salary Slip, Bank Statement, SK
 * Perusahaan), each showing a live status chip derived from uploads + the
 * processing feed.
 */
export function UploadedDocsStrip({ statuses }: UploadedDocsStripProps) {
  const completed = DOCUMENTS.filter((d) => statuses[d.id] === "completed").length;

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-bri-navy">
            Data Already Upload
          </span>
          <p className="text-[8px] text-bri-muted">
            KTP, KK, Slip Gaji, Bank Statement, &amp; SK Perusahaan
          </p>
        </div>
        <span
          className={cn(
            "rounded-pill px-2 py-0.5 text-[8px] font-semibold",
            completed === DOCUMENTS.length
              ? "bg-emerald-50 text-emerald-600"
              : "bg-bri-bg text-bri-muted"
          )}
        >
          {completed}/{DOCUMENTS.length} selesai
        </span>
      </div>

      {/* Document tiles */}
      <div className="grid grid-cols-5 gap-2">
        {DOCUMENTS.map((d) => {
          const status = statuses[d.id];
          const ui = STATUS_UI[status];
          const Icon = DOC_ICONS[d.id];
          return (
            <div
              key={d.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 transition-colors",
                ui.ring
              )}
            >
              <Icon
                size={16}
                className={cn(
                  status === "completed"
                    ? "text-emerald-500"
                    : status === "processing"
                    ? "text-bri-navy"
                    : "text-amber-500"
                )}
              />
              <span className="text-center text-[8px] font-semibold leading-tight text-bri-ink">
                {d.short}
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-pill px-1.5 py-px text-[7px] font-semibold",
                  ui.chip
                )}
              >
                {ui.icon}
                {ui.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
