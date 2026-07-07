/**
 * Auto-loan (KKB — Kredit Kendaraan Bermotor) types.
 *
 * The auto flow is a lighter, lead-generation flow: pick a vehicle → review its
 * description → tune a loan calculator (tenor / DP / rate) → book an in-person
 * appointment with a BRI agent. No document OCR / SLIK / agunan survey.
 */

/** Which product the customer chose after the agree (S&K) page. */
export type LoanType = "kpr" | "auto" | "cc";

/**
 * RM verification stage for a booked KKB appointment:
 *   none      — no appointment booked yet
 *   pending   — appointment booked, waiting for the RM to verify the meeting
 *   verified  — RM confirmed the appointment/vehicle/documents
 *   rejected  — RM could not verify (meeting/vehicle/docs issue)
 */
export type AutoVerifyStatus = "none" | "pending" | "verified" | "rejected";

/**
 * Analyst decision stage (after RM verification):
 *   none      — not applicable yet (RM not verified)
 *   pending   — verified by RM, awaiting analyst approval
 *   approved  — analyst approved → customer sees the final offer summary
 *   rejected  — analyst declined
 */
export type AutoDecisionStatus = "none" | "pending" | "approved" | "rejected";

/** One vehicle in the (curated, offline) catalog. */
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  variant: string;
  /** Display name, e.g. "Toyota Avanza 1.5 G CVT". */
  fullName: string;
  year: number;
  /** Body type, e.g. "MPV" | "SUV" | "Hatchback" | "Sedan" | "LCGC" | "EV". */
  category: string;
  /** On-the-road price (IDR). */
  price: number;
  /** Optional photo URL; the UI falls back to a branded visual when absent. */
  image?: string;
  seats: number;
  /** "Manual" | "Automatic" | "CVT". */
  transmission: string;
  /** "Bensin" | "Diesel" | "Hybrid" | "Listrik". */
  fuel: string;
  /** Engine displacement (cc); 0 for EVs. */
  engineCc: number;
  description: string;
  /** Short highlight chips shown on the detail screen. */
  highlights: string[];
}

/** Loan-calculator selections for the chosen vehicle. */
export interface AutoLoanCalc {
  /** Down-payment fraction of the OTR price (0..1). */
  dpPct: number;
  /** Tenor in months. */
  tenorMonths: number;
  /** Selected rate-scheme id (see data/autoRates.ts). */
  schemeId: string;
  /**
   * Vehicle-price discount fraction (0..1). Default 0. Applied to the OTR price
   * before DP/financing, so it lowers the installment. Set by the RM on the
   * verification screen after the appointment is booked.
   */
  discountPct: number;
}

/** Appointment booking details collected after the calculator is agreed. */
export interface AppointmentData {
  /** Human-readable address/place label of the meeting point (from the map pick). */
  lokasi?: string;
  /** Picked meeting-point latitude (OpenStreetMap). */
  lat?: number;
  /** Picked meeting-point longitude (OpenStreetMap). */
  lon?: number;
  /** Customer name — prefilled from the KTP OCR result. */
  nama?: string;
  /**
   * Relationship Manager the customer explicitly requested (optional). When set,
   * the application is mapped to this RM; when empty it is auto-mapped to the RM
   * nearest the picked meeting point. See data/relationshipManagers.ts.
   */
  rmName?: string;
  /** Preferred date, "YYYY-MM-DD". */
  tanggal?: string;
  /** Set true once the customer confirms the booking. */
  booked?: boolean;
}
