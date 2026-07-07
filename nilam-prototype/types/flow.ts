export type FlowStep =
  | "opening"
  | "term_condition"
  | "loan_type"
  | "income_type"
  | "joint_income"
  | "requirement"
  | "data_diri"
  | "agunan"
  | "processing"
  | "survey"
  | "offering"
  | "disburse"
  | "analyst_decision"
  // Auto-loan (KKB) branch
  | "vehicle_search"
  | "vehicle_detail"
  | "appointment"
  | "appointment_done"
  // Credit-card (Kartu Kredit) branch — analyst approves a limit FIRST, then the
  // customer picks a card within that limit.
  | "card_review"
  | "card_select"
  | "card_detail"
  | "card_done"
  | "card_decision";

export interface PersonaConfig {
  nasabahPayroll: boolean;
  pasanganPayroll: boolean;
}

/**
 * Survey status for collateral worth ≥ SURVEY_THRESHOLD. Such applications go to
 * a Relationship Manager (RM) for an on-site survey before the offer is released.
 *   none     — not applicable (price below threshold or not yet submitted)
 *   pending  — waiting in the RM survey queue
 *   approved — RM finished the survey & approved (offer released, RM's appraised value used)
 *   rejected — RM finished the survey & rejected
 */
export type SurveyStatus = "none" | "pending" | "approved" | "rejected";

/**
 * Credit-analyst decision (KPR). After collateral appraisal (and after processing
 * for sub-threshold applications) the application waits for a Credit Analyst to
 * approve in the dashboard before the offer is released to the customer.
 *   none     — not yet handed to the analyst (still processing / in appraisal)
 *   pending  — waiting for the analyst's decision in the dashboard
 *   approved — analyst approved → offer released to the customer
 *   rejected — analyst declined
 */
export type AnalystDecisionStatus = "none" | "pending" | "approved" | "rejected";

/** Collateral price at/above which an RM survey is required before an offer. */
export const SURVEY_THRESHOLD = 500_000_000;
