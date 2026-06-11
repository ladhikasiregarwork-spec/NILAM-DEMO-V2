import type { FlowStep, PersonaConfig } from "@/types/flow";

/**
 * The customer KPR flow:
 *   opening → term_condition (S&K) → requirement (upload dokumen)
 *   → data_diri (form data diri, prefilled dari OCR) → agunan → processing
 *   → offering (penawaran KPR) → disburse (pencairan)
 */
export function planFlow(_p?: PersonaConfig): FlowStep[] {
  return ["opening", "term_condition", "requirement", "data_diri", "agunan", "processing", "offering", "disburse"];
}
