"use client";

import {
  CreditCard,
  Users,
  FileText,
  Landmark,
  FileSignature,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { DOCUMENTS } from "@/data/documents";
import type { DocumentId, DocumentStatus } from "@/types/documents";

interface OrchestrationPipelineProps {
  /** Live status for each of the five documents (derived from the feed). */
  statuses: Record<DocumentId, DocumentStatus>;
}

/** Map each documentId → its lucide icon component. */
const DOC_ICONS: Record<DocumentId, React.ComponentType<{ size?: number; className?: string }>> = {
  ktp:           CreditCard,
  kk:            Users,
  slip_gaji:     FileText,
  mutasi:        Landmark,
  sk_perusahaan: FileSignature,
};

/**
 * OrchestrationPipeline — horizontal row of the five document steps connected
 * by short connector lines. Each step's appearance is driven by its
 * DocumentStatus (derived live from the orchestration feed):
 *   completed  → green filled circle + check icon
 *   processing → blue filled circle + pulse animation + document icon
 *   pending    → white circle, gray border, gray icon
 *
 * The connector between two consecutive steps turns navy once the previous step
 * is completed and this one has started, so the line "fills" as documents are
 * processed in sequence.
 */
export function OrchestrationPipeline({ statuses }: OrchestrationPipelineProps) {
  return (
    <div className="rounded-xl border border-bri-line bg-white p-2 shadow-soft">
      {/* Section label */}
      <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
        AI Orchestration Pipeline
      </span>

      {/* Step row — equal-width columns so the circles are evenly distributed. */}
      <div className="flex">
        {DOCUMENTS.map((doc, idx) => {
          const status = statuses[doc.id];
          const Icon = DOC_ICONS[doc.id];

          // Connector joins the previous step → this step. Active (navy) once the
          // previous step is completed and this step has started.
          const prevStatus: DocumentStatus | "pending" =
            idx === 0 ? "pending" : statuses[DOCUMENTS[idx - 1].id];
          const connectorActive =
            idx > 0 &&
            prevStatus === "completed" &&
            (status === "completed" || status === "processing");

          return (
            <div
              key={doc.id}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Connector — behind the circles, vertically centered. */}
              {idx > 0 && (
                <div
                  className={cn(
                    "absolute left-[-50%] right-1/2 top-[13px] h-[2px] rounded-full transition-colors duration-300",
                    connectorActive ? "bg-bri-navy" : "bg-bri-line"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Circle */}
              <div className="relative z-10">
                {/* Pulse ring while processing */}
                {status === "processing" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-bri-navy/20"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}

                <div
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                    status === "completed" &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    status === "processing" &&
                      "border-bri-navy bg-bri-navy text-white",
                    status === "pending" && "border-bri-line bg-white text-bri-muted"
                  )}
                >
                  {status === "completed" ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <Icon size={12} />
                  )}
                </div>
              </div>

              {/* Label — fixed 2-line height so every circle stays aligned. */}
              <span
                className={cn(
                  "mt-1 flex h-5 w-full items-start justify-center px-0.5 text-center text-[8px] leading-tight",
                  status === "completed" && "font-medium text-emerald-600",
                  status === "processing" && "font-semibold text-bri-navy",
                  status === "pending" && "text-bri-muted"
                )}
              >
                {doc.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
