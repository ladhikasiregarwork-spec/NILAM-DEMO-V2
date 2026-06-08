"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

interface PersonaSelectorProps {
  persona: { nasabahPayroll: boolean; pasanganPayroll: boolean };
  onSetNasabahPayroll: (v: boolean) => void;
  onSetPasanganPayroll: (v: boolean) => void;
  onReset: () => void;
}

/** One compact segmented Payroll | Non-Payroll toggle row. */
function SegmentedToggle({
  label,
  isPayroll,
  onChange,
}: {
  label: string;
  isPayroll: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <span className="text-[9px] font-semibold text-bri-ink">{label}</span>
      <div className="flex shrink-0 overflow-hidden rounded-md border border-bri-line bg-bri-bg/60 p-0.5">
        {[
          { lbl: "Payroll", val: true },
          { lbl: "Non-Payroll", val: false },
        ].map(({ lbl, val }) => (
          <button
            key={lbl}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              "rounded px-2 py-0.5 text-[8.5px] font-semibold leading-none transition-all",
              isPayroll === val
                ? "bg-bri-navy text-white shadow-sm"
                : "text-bri-muted hover:text-bri-ink"
            )}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * PersonaSelector — compact "Custom Persona" control card.
 *
 * Content-height (no h-full / flex-1) and w-full so the parent owns width.
 * Two stacked segmented toggles + a compact Reset Flow button. Designed to be
 * short (~110-130px) so an AI Insight card can stack directly below it.
 */
export function PersonaSelector({
  persona,
  onSetNasabahPayroll,
  onSetPasanganPayroll,
  onReset,
}: PersonaSelectorProps) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft">
      {/* Section label */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          Custom Persona
        </span>
        <button
          type="button"
          onClick={onReset}
          title="Reset Flow"
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8.5px] font-semibold text-bri-muted transition-colors hover:bg-bri-bg hover:text-bri-blue"
        >
          <RefreshCw size={9} />
          Reset
        </button>
      </div>

      {/* Toggle groups */}
      <div className="flex flex-col gap-1.5">
        <SegmentedToggle
          label="Nasabah Utama"
          isPayroll={persona.nasabahPayroll}
          onChange={onSetNasabahPayroll}
        />
        <SegmentedToggle
          label="Pasangan"
          isPayroll={persona.pasanganPayroll}
          onChange={onSetPasanganPayroll}
        />
      </div>
    </div>
  );
}
