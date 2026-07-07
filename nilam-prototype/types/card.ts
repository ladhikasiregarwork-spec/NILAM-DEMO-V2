/**
 * Credit-card (Kartu Kredit) types.
 *
 * The credit-card flow branches off loan_type just like KPR/KKB: after uploading
 * documents the customer picks a card product (BRI Touch vs BRI Easy), tunes the
 * requested credit limit, then waits for a Credit Analyst decision. No RM survey
 * — it goes straight to the analyst (mirrors the KKB analyst decision, minus the
 * RM verification gate).
 */

/** The two card products offered in the demo. */
export type CreditCardType = "touch" | "easy";

/**
 * Credit-analyst decision for a card application:
 *   none      — no card chosen yet
 *   pending   — application submitted, awaiting analyst approval (dashboard)
 *   approved  — analyst approved → customer sees the approved-card summary
 *   rejected  — analyst declined
 */
export type CardDecisionStatus = "none" | "pending" | "approved" | "rejected";

/** One card product in the (curated, offline) catalog. */
export interface CreditCard {
  id: CreditCardType;
  /** Display name, e.g. "BRI Touch". */
  name: string;
  /** One-line positioning, e.g. "Kartu premium untuk gaya hidup aktif". */
  tagline: string;
  /** Payment network, e.g. "Mastercard" | "Visa" | "JCB". */
  network: string;
  /** Requested-limit bounds (IDR). */
  minLimit: number;
  maxLimit: number;
  /** Pre-selected limit when the card is chosen (IDR). */
  defaultLimit: number;
  /** Annual fee (IDR); 0 when free. */
  annualFee: number;
  /** Short note on the annual fee, e.g. "Gratis tahun pertama". */
  annualFeeNote: string;
  /** Monthly finance charge (fraction, e.g. 0.0175 for 1,75%/bln). */
  interestMonthly: number;
  /** Minimum monthly income requirement (IDR). */
  minIncomeMonthly: number;
  /** Full benefit lines shown on the detail screen. */
  benefits: string[];
  /** Short highlight chips. */
  highlights: string[];
  /** CSS gradient for the card visual. */
  gradient: string;
}
