/**
 * Auto-loan (KKB) calculator helpers. Reuses the shared annuity formula from
 * lib/kpr so the monthly installment math is identical to the KPR flow.
 */
import { anuitas } from "./kpr";

/** Down-payment amount in Rupiah. */
export function dpAmount(price: number, dpPct: number): number {
  return Math.round(price * dpPct);
}

/** Financed principal = OTR price − down payment. */
export function financedAmount(price: number, dpPct: number): number {
  return Math.max(0, Math.round(price * (1 - dpPct)));
}

/** Monthly installment for the financed principal at the given rate/tenor. */
export function monthlyInstallment(price: number, dpPct: number, annualRate: number, tenorMonths: number): number {
  return anuitas(financedAmount(price, dpPct), annualRate, tenorMonths);
}

/** Full breakdown used by the detail screen + dashboard. */
export interface AutoLoanBreakdown {
  /** OTR price before any discount. */
  price: number;
  /** Applied discount fraction (0..1). */
  discountPct: number;
  /** Discount amount in Rupiah (price × discountPct). */
  discount: number;
  /** Price after discount — the basis for DP & financing. */
  netPrice: number;
  dp: number;
  financed: number;
  angsuran: number;
  tenorMonths: number;
  rate: number;
  /** Sum of all installments over the tenor. */
  totalAngsuran: number;
  /** Total interest = totalAngsuran − financed. */
  totalBunga: number;
  /** Grand total out of pocket = DP + totalAngsuran. */
  totalKeseluruhan: number;
}

/**
 * Compute the auto-loan breakdown. An optional `discountPct` (0..1) is applied
 * to the OTR price first; DP and the financed principal are computed from the
 * discounted (net) price, so a discount lowers the monthly installment.
 */
export function computeAutoLoan(
  price: number,
  dpPct: number,
  annualRate: number,
  tenorMonths: number,
  discountPct = 0,
): AutoLoanBreakdown {
  const safeDiscount = Math.max(0, Math.min(0.9, discountPct || 0));
  const discount = Math.round(price * safeDiscount);
  const netPrice = Math.max(0, price - discount);
  const dp = Math.round(netPrice * dpPct);
  const financed = Math.max(0, netPrice - dp);
  const angsuran = anuitas(financed, annualRate, tenorMonths);
  const totalAngsuran = angsuran * tenorMonths;
  return {
    price,
    discountPct: safeDiscount,
    discount,
    netPrice,
    dp,
    financed,
    angsuran,
    tenorMonths,
    rate: annualRate,
    totalAngsuran,
    totalBunga: Math.max(0, totalAngsuran - financed),
    totalKeseluruhan: dp + totalAngsuran,
  };
}

/**
 * Simple, illustrative eligibility score (0–100) for the dashboard. Rewards a
 * larger down payment and a shorter tenor (lower lender risk).
 */
export function autoLoanScore(dpPct: number, tenorMonths: number): number {
  const dpScore = Math.min(1, (dpPct - 0.2) / 0.3); // 20%→0, 50%+→1
  const tenorScore = 1 - Math.min(1, (tenorMonths - 12) / 48); // 12m→1, 60m→0
  const score = 60 + dpScore * 22 + tenorScore * 18;
  return Math.max(0, Math.min(100, Math.round(score)));
}
