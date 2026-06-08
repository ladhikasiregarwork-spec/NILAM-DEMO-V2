"use client";

import {
  CreditCard,
  Users,
  FileText,
  Landmark,
  FileSignature,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { DOCUMENTS } from "@/data/documents";
import type { DocumentId, DocumentStatus } from "@/types/documents";

interface DocumentMonitorCardProps {
  /** Live status for each of the five documents (derived from the feed). */
  statuses: Record<DocumentId, DocumentStatus>;
}

const DOC_ICONS: Record<DocumentId, React.ComponentType<{ size?: number; className?: string }>> = {
  ktp:           CreditCard,
  kk:            Users,
  slip_gaji:     FileText,
  mutasi:        Landmark,
  sk_perusahaan: FileSignature,
};

/** Per-status visual config: badge label, colours, and progress-bar width. */
const STATUS_UI: Record<
  DocumentStatus,
  { label: string; badge: string; bar: string; barWidth: string; dot: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-bri-bg text-bri-muted",
    bar: "bg-bri-line",
    barWidth: "0%",
    dot: "text-bri-muted",
  },
  processing: {
    label: "Processing",
    badge: "bg-bri-navy/10 text-bri-navy",
    bar: "bg-bri-blue",
    barWidth: "60%",
    dot: "text-bri-blue",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    barWidth: "100%",
    dot: "text-emerald-500",
  },
};

/** One document row: icon + label + status badge + progress bar. */
function DocRow({ id, label, status }: { id: DocumentId; label: string; status: DocumentStatus }) {
  const Icon = DOC_ICONS[id];
  const ui = STATUS_UI[status];

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className={cn("shrink-0", ui.dot)} />
        <span className="min-w-0 flex-1 truncate text-[8.5px] font-medium text-bri-ink">
          {label}
        </span>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-pill px-1.5 py-px text-[7.5px] font-semibold",
            ui.badge
          )}
        >
          {status === "completed" ? (
            <Check size={8} strokeWidth={3} />
          ) : status === "processing" ? (
            <Loader2 size={8} className="animate-spin" strokeWidth={3} />
          ) : (
            <Clock size={8} strokeWidth={3} />
          )}
          {ui.label}
        </span>
      </div>
      {/* Progress bar */}
      <div className="ml-[18px] h-1 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className={cn("h-full rounded-full", ui.bar)}
          initial={false}
          animate={{ width: ui.barWidth }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/**
 * DocumentMonitorCard — detailed status for each of the five required
 * documents. Header shows a live "X / 5 selesai" tally; each row reports its
 * DocumentStatus (Pending / Processing / Completed) with a matching badge and
 * progress bar. All values are derived from the live orchestration feed.
 */
export function DocumentMonitorCard({ statuses }: DocumentMonitorCardProps) {
  const completed = DOCUMENTS.filter((d) => statuses[d.id] === "completed").length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Header */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Document Monitoring
        </span>
        <span
          className={cn(
            "rounded-pill px-1.5 py-px text-[7.5px] font-semibold",
            completed === DOCUMENTS.length
              ? "bg-emerald-50 text-emerald-600"
              : "bg-bri-bg text-bri-muted"
          )}
        >
          {completed}/{DOCUMENTS.length} selesai
        </span>
      </div>

      {/* Rows — distribute evenly, scroll internally if cramped. */}
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1 overflow-y-auto scroll-thin">
        {DOCUMENTS.map((d) => (
          <DocRow key={d.id} id={d.id} label={d.label} status={statuses[d.id]} />
        ))}
      </div>
    </div>
  );
}
