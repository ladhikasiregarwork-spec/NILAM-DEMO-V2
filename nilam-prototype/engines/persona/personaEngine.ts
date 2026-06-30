import type { FlowStep, PersonaConfig } from "@/types/flow";
import type { LoanType } from "@/types/auto";

/**
 * The customer flow. After the agree (S&K) page the customer first uploads their
 * documents (`requirement`), then picks a product on `loan_type`, which branches
 * the remaining steps:
 *
 *   (shared) → requirement (upload) → loan_type
 *   KPR  → data_diri → agunan → processing
 *          → survey (bila agunan ≥ Rp500jt) → analyst_decision → offering → disburse
 *   Auto → vehicle_search → vehicle_detail (deskripsi + kalkulator)
 *          → appointment (janji temu agen)
 *          → appointment_done (verifikasi RM → persetujuan analis → ringkasan)
 *
 * Until a product is chosen (`loanType` null), the flow ends at `loan_type`.
 * `survey` selalu ada di urutan KPR agar bisa di-navigasi; untuk agunan
 * < Rp500jt langkah survey dilewati (processing → analyst_decision langsung).
 * `analyst_decision`: nasabah menunggu keputusan Credit Analyst (di dashboard)
 * sebelum penawaran terbit — selalu ada di urutan KPR.
 */
export function planFlow(_p?: PersonaConfig, loanType?: LoanType | null): FlowStep[] {
  const base: FlowStep[] = ["opening", "term_condition", "requirement", "loan_type"];
  if (loanType === "auto") {
    return [...base, "vehicle_search", "vehicle_detail", "appointment", "appointment_done"];
  }
  if (loanType === "kpr") {
    return [...base, "data_diri", "agunan", "processing", "survey", "analyst_decision", "offering", "disburse"];
  }
  return base;
}
