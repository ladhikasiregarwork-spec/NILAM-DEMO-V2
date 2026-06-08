/**
 * Rupiah formatting helpers for NILAM income cards.
 */

/**
 * Formats a number as Indonesian Rupiah.
 * Example: 10_000_000 → "Rp10.000.000"
 *
 * F5: Negatives are formatted with a proper minus sign (−) so a value like
 * −2_500_000 renders as "− Rp2.500.000" rather than "-Rp2.500.000" (stray
 * hyphen). This matters when all income weights are zeroed out making THP < 0.
 */
export function formatRupiah(n: number): string {
  if (n < 0) return "− Rp" + Math.abs(n).toLocaleString("id-ID");
  return "Rp" + n.toLocaleString("id-ID");
}

/**
 * Compact Rupiah variant for tight UI spots.
 * Example: 10_500_000 → "Rp10,5 jt", 10_000_000 → "Rp10 jt"
 *
 * F5: Same negative-sign treatment as formatRupiah.
 */
export function formatJuta(n: number): string {
  if (n < 0) {
    const jt = Math.abs(n) / 1_000_000;
    const rounded = Math.round(jt * 10) / 10;
    const formatted = rounded % 1 === 0 ? String(rounded) : String(rounded).replace(".", ",");
    return `− Rp${formatted} jt`;
  }
  const jt = n / 1_000_000;
  const rounded = Math.round(jt * 10) / 10;
  const formatted = rounded % 1 === 0 ? String(rounded) : String(rounded).replace(".", ",");
  return `Rp${formatted} jt`;
}
