export type FlowStep =
  | "opening"
  | "term_condition"
  | "income_type"
  | "joint_income"
  | "requirement"
  | "data_diri"
  | "agunan"
  | "processing"
  | "offering"
  | "disburse"
  | "analyst_decision";

export interface PersonaConfig {
  nasabahPayroll: boolean;
  pasanganPayroll: boolean;
}
