import type { NodeId, NodeStatus } from "@/types/orchestration";
import type { DocumentId, DocumentMeta, DocumentStatus } from "@/types/documents";

/**
 * The five documents tracked by the dashboard. Order = display order in both
 * the pipeline stepper and the Document Monitoring card.
 */
export const DOCUMENTS: DocumentMeta[] = [
  { id: "ktp",           short: "KTP",            label: "KTP" },
  { id: "kk",            short: "KK",             label: "Kartu Keluarga" },
  { id: "slip_gaji",     short: "Slip Gaji",      label: "Slip Gaji" },
  { id: "mutasi",        short: "Bank Statement", label: "Rekening Koran / Mutasi" },
  { id: "sk_perusahaan", short: "SK Perusahaan",  label: "Surat Keterangan Kerja" },
];

/**
 * Each document is tied to an engine node, so its processing status is derived
 * LIVE from the orchestration feed instead of being hardcoded. As the pipeline
 * advances node-by-node, the documents flip pending → processing → completed in
 * sequence. All five mapped nodes always run (even in single-applicant mode),
 * so every document reliably reaches "completed".
 */
export const DOCUMENT_NODE: Record<DocumentId, NodeId> = {
  ktp:           "upload",
  kk:            "ocr",
  slip_gaji:     "validasi",
  mutasi:        "fraud",
  sk_perusahaan: "slik",
};

/** Map an engine NodeStatus → a user-facing DocumentStatus. */
export function toDocumentStatus(s: NodeStatus): DocumentStatus {
  if (s === "success") return "completed";
  if (s === "running") return "processing";
  return "pending";
}

/**
 * Derive all five document statuses from the live pipeline state.
 *
 * Upload is a PRECONDITION for completion: a document that was never uploaded
 * can never show "completed" — it stays "pending" (missing) regardless of how
 * far the engine pipeline has run. For an uploaded document:
 *   - mapped node succeeded → "completed"
 *   - mapped node running   → "processing"
 *   - otherwise (queued)    → "processing"
 *
 * Pure function — call it on each render so the UI always reflects current
 * state. `uploads` is optional; when omitted, every document reads "pending".
 */
export function deriveDocumentStatuses(
  statusOf: (id: NodeId) => NodeStatus,
  uploads?: Record<string, boolean>,
): Record<DocumentId, DocumentStatus> {
  return DOCUMENTS.reduce((acc, d) => {
    // Not uploaded → missing. Never completed, even if the engine ran.
    if (!uploads?.[d.id]) {
      acc[d.id] = "pending";
      return acc;
    }
    const nodeStatus = statusOf(DOCUMENT_NODE[d.id]);
    if (nodeStatus === "success") acc[d.id] = "completed";
    else if (nodeStatus === "running") acc[d.id] = "processing";
    else acc[d.id] = "processing";
    return acc;
  }, {} as Record<DocumentId, DocumentStatus>);
}
