/**
 * Document-monitoring types — the five uploaded documents whose processing
 * status drives the pipeline stepper and the Document Monitoring card.
 *
 * Statuses are DERIVED from the live orchestration feed (see
 * `data/documents.ts` → deriveDocumentStatuses), so nothing here is hardcoded:
 * a document flips pending → processing → completed as the pipeline runs.
 */

export type DocumentId =
  | "ktp"
  | "kk"
  | "slip_gaji"
  | "mutasi"
  | "sk_perusahaan";

export type DocumentStatus = "pending" | "processing" | "completed";

export interface DocumentMeta {
  id: DocumentId;
  /** Short label for the compact pipeline stepper. */
  short: string;
  /** Full label for the monitoring card. */
  label: string;
}
