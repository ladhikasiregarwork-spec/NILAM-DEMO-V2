/**
 * Shared visual language for the two Detail-Transaksi tables — MatchingCard
 * ("Transaksi Pemasukan") and MutasiRekeningCard ("Detail Mutasi Rekening").
 * Both import these so their fonts and colors stay in sync; only the column
 * widths (the grid template) are tuned per table.
 */
export const txnTable = {
  /**
   * Shared column grid so both tables line up column-for-column:
   * Tgl · Gaji/Nominal · THR/Klasifikasi · Bonus/Tipe · Remark.
   * `divide-x` draws a vertical border between every column; `[&>*]:px-2`
   * pads each cell so content doesn't touch the dividers.
   */
  grid: "grid grid-cols-[76px_1fr_1fr_1fr_2fr] items-center divide-x divide-bri-line/60 [&>*]:px-2",
  /** Rounded, bordered table container. */
  box: "overflow-hidden rounded-lg border border-bri-line/70",
  /** Column-header row (cells add their own text-center/right). */
  head: "bg-bri-bg/70 px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-bri-muted",
  /** Body row. */
  row: "border-t border-bri-line/50 px-2.5 py-1.5 text-[8.5px] text-bri-ink transition-colors hover:bg-bri-bg/40",
  /** Footer / totals row. */
  foot: "border-t border-bri-line bg-bri-bg/50 px-2.5 py-1.5 text-[8.5px] font-medium",
  /** Money cell — right-aligned tabular figures. */
  money: "text-right tabular-nums font-semibold",
  /** Date cell — centered, muted. */
  date: "text-center tabular-nums text-bri-muted",
  /** Free-text (remark) cell — left, truncating (cell padding comes from the grid). */
  remark: "truncate text-bri-muted",
  /** Category badge (klasifikasi). */
  badge: "inline-block max-w-full truncate rounded-pill bg-bri-navy/10 px-2 py-0.5 text-[7.5px] font-semibold text-bri-navy",
  /** Credit / debit accent colors. */
  credit: "text-emerald-600",
  debit: "text-red-500",
} as const;
