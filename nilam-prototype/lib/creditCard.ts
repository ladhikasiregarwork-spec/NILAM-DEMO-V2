/**
 * Credit-card helpers — a light, illustrative limit model for the demo. There is
 * no installment/annuity (a card is a revolving line), so the only "structure" is
 * the requested limit vs an income-based recommended limit.
 */
import type { CreditCard } from "@/types/card";

/** Clamp a requested limit into the card's allowed range and round to Rp1jt. */
export function clampLimit(card: CreditCard, limit: number): number {
  const rounded = Math.round(limit / 1_000_000) * 1_000_000;
  return Math.max(card.minLimit, Math.min(card.maxLimit, rounded || card.defaultLimit));
}

/**
 * Recommended credit limit ≈ 2.5× monthly income (a common issuer heuristic),
 * clamped to the card's range. Falls back to the card default when income is
 * unknown.
 */
export function recommendedLimit(card: CreditCard, monthlyIncome: number): number {
  if (!monthlyIncome || monthlyIncome <= 0) return card.defaultLimit;
  return clampLimit(card, monthlyIncome * 2.5);
}

/** Minimum monthly payment estimate = interestMonthly × outstanding (full-limit worst case). */
export function minMonthlyCharge(card: CreditCard, limit: number): number {
  return Math.round(limit * card.interestMonthly);
}
