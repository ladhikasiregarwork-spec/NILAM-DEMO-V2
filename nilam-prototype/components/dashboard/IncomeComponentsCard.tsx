"use client";

import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { adjusted } from "@/engines/thp/thpEngine";
import type { CustomerIncome, ComponentKey, ComponentMode } from "@/types/income";

interface IncomeComponentsCardProps {
  title: string;
  income: CustomerIncome | undefined;
  onMode: (key: ComponentKey, mode: ComponentMode) => void;
  onWeight: (key: ComponentKey, weight: number) => void;
  /** When true, renders a non-interactive "stripped" view (non-joint pasangan) */
  stripped?: boolean;
}

/**
 * IncomeComponentsCard — Row C, col 1 or col 2.
 *
 * Layout: flex h-full flex-col so card fills its grid cell.
 * Header shrink-0; body flex-1 with the table filling available space;
 * Angsuran Bulanan row shrink-0 pinned at bottom.
 *
 * A compact table: Komponen | Mode | Nilai Dasar | Bobot | Adjusted
 */
export function IncomeComponentsCard({
  title,
  income,
  onMode,
  onWeight,
  stripped = false,
}: IncomeComponentsCardProps) {
  const isStripped = stripped || !income;
  const pending = !income;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-bri-line bg-white px-2 py-1.5 shadow-soft",
        isStripped && !pending && "opacity-60",
      )}
    >
      {/* Header */}
      <div className="mb-1 flex shrink-0 items-center justify-between gap-1">
        <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted leading-none">
          {title}
        </span>
        {isStripped && !pending && (
          <span className="rounded-pill bg-bri-bg px-1.5 py-0.5 text-[7px] font-semibold text-bri-muted">
            Non-Joint
          </span>
        )}
      </div>

      {/* Pending state */}
      {pending ? (
        <div className="flex flex-1 items-center justify-center py-2">
          <span className="text-[9px] italic text-bri-muted/40">Menunggu ekstraksi…</span>
        </div>
      ) : (
        <>
          {/* Table — flex-1 so it expands; rows distribute height evenly */}
          <div className="flex flex-1 flex-col min-h-0">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="pb-0.5 text-left text-[7px] font-semibold uppercase text-bri-muted w-[18%]">Komponen</th>
                  <th className="pb-0.5 text-center text-[7px] font-semibold uppercase text-bri-muted w-[20%]">Mode</th>
                  <th className="pb-0.5 text-right text-[7px] font-semibold uppercase text-bri-muted w-[22%]">Nilai Dasar</th>
                  <th className="pb-0.5 text-center text-[7px] font-semibold uppercase text-bri-muted w-[22%]">Bobot</th>
                  <th className="pb-0.5 text-right text-[7px] font-semibold uppercase text-bri-muted w-[18%]">Adjusted</th>
                </tr>
              </thead>
              <tbody>
                {income.components.map((comp) => {
                  const base = comp.mode === "avg" ? comp.avg : comp.min;
                  const adj = adjusted(comp);
                  return (
                    <tr key={comp.key} className="border-t border-bri-line/50">
                      {/* Komponen */}
                      <td className="py-1 pr-1 text-[9px] font-medium text-bri-ink">{comp.key}</td>

                      {/* Mode toggle */}
                      <td className="py-1 px-0.5">
                        <div className="flex items-center justify-center gap-0.5">
                          {(["avg", "min"] as ComponentMode[]).map((m) => (
                            <button
                              key={m}
                              disabled={isStripped}
                              onClick={() => !isStripped && onMode(comp.key, m)}
                              className={cn(
                                "rounded px-1 py-0.5 text-[7px] font-semibold uppercase leading-none transition-colors",
                                comp.mode === m
                                  ? "bg-bri-navy text-white"
                                  : "bg-bri-bg text-bri-muted hover:bg-bri-bg/80",
                                isStripped && "cursor-default",
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Nilai Dasar */}
                      <td className="py-1 text-right text-[8.5px] text-bri-ink pr-1">
                        {isStripped ? "—" : formatRupiah(base)}
                      </td>

                      {/* Bobot */}
                      <td className="py-1 px-1">
                        {isStripped ? (
                          <span className="block text-center text-[8.5px] text-bri-muted">—</span>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={comp.weight}
                              onChange={(e) => onWeight(comp.key, parseFloat(e.target.value))}
                              className="h-1.5 w-full cursor-pointer accent-[#00529C]"
                            />
                            <span className="w-6 shrink-0 text-right text-[7.5px] text-bri-muted">
                              {comp.weight.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Adjusted */}
                      <td className="py-1 text-right">
                        <span
                          className={cn(
                            "text-[9px] font-bold",
                            isStripped ? "text-bri-muted" : "text-bri-blue",
                          )}
                        >
                          {isStripped ? "—" : formatRupiah(adj)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Angsuran row — pinned at bottom */}
          <div className="mt-1 flex shrink-0 items-center justify-between border-t border-bri-line pt-1">
            <span className="text-[8px] font-medium text-bri-muted">
              Angsuran Bulanan (SLIK)
            </span>
            <span className="text-[9px] font-bold text-red-500">
              {isStripped ? "—" : formatRupiah(income.angsuran)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
