import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FlowStep } from "@/types/flow";
import type { LoanType } from "@/types/auto";

interface FlowStepperProps {
  currentStep: FlowStep;
  loanType: LoanType | null;
}

interface StepNode {
  label: string;
  sublabel?: string;
  /** Flow steps that map to this node (the first match drives the active index). */
  steps: FlowStep[];
}

// Base nodes shared by both branches: the customer uploads documents BEFORE
// choosing a product, so Upload sits ahead of Jenis (loan_type).
const BASE: StepNode[] = [
  { label: "Masuk", steps: ["opening"] },
  { label: "S&K", steps: ["term_condition"] },
  { label: "Upload", steps: ["requirement"] },
  { label: "Jenis", steps: ["loan_type"] },
];

const KPR_NODES: StepNode[] = [
  ...BASE,
  { label: "Data", sublabel: "Diri", steps: ["data_diri"] },
  { label: "Agunan", steps: ["agunan"] },
  { label: "Proses", steps: ["processing", "survey", "analyst_decision"] },
  { label: "Penawa-", sublabel: "ran", steps: ["offering"] },
  { label: "Cair", steps: ["disburse"] },
];

const AUTO_NODES: StepNode[] = [
  ...BASE,
  { label: "Kenda-", sublabel: "raan", steps: ["vehicle_search"] },
  { label: "Simu-", sublabel: "lasi", steps: ["vehicle_detail"] },
  { label: "Janji", steps: ["appointment"] },
  { label: "Selesai", steps: ["appointment_done"] },
];

function nodesFor(loanType: LoanType | null): StepNode[] {
  if (loanType === "auto") return AUTO_NODES;
  if (loanType === "kpr") return KPR_NODES;
  return BASE;
}

function activeIndexOf(nodes: StepNode[], step: FlowStep): number {
  const idx = nodes.findIndex((n) => n.steps.includes(step));
  return idx === -1 ? 0 : idx;
}

/**
 * Horizontal flow stepper rendered BELOW the iPhone. The node list adapts to the
 * chosen product (KPR vs auto/KKB); before a product is picked only the shared
 * Masuk · S&K · Jenis nodes show.
 */
export function FlowStepper({ currentStep, loanType }: FlowStepperProps) {
  const nodes = nodesFor(loanType);
  const activeIdx = activeIndexOf(nodes, currentStep);

  // Compact sizing so longer branches still fit the 360px phone column.
  const minW = nodes.length >= 9 ? 30 : nodes.length >= 8 ? 32 : nodes.length >= 7 ? 36 : 42;
  const connW = nodes.length >= 8 ? 8 : nodes.length >= 7 ? 10 : 16;

  return (
    <div className="flex shrink-0 items-start justify-center gap-0">
      {nodes.map((node, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;

        return (
          <div key={node.label + i} className="flex items-start">
            <div className="flex flex-col items-center" style={{ minWidth: minW }}>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                  isDone || isActive ? "bg-bri-navy text-white" : "border-2 border-bri-line bg-white text-bri-muted",
                )}
                style={isActive ? { boxShadow: "0 0 0 3px rgba(0,82,156,0.18)" } : undefined}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : <span>{i + 1}</span>}
              </div>

              <div className="mt-0.5 text-center">
                <span
                  className={cn(
                    "block text-[8px] leading-tight",
                    isActive ? "font-semibold text-bri-navy" : isDone ? "font-medium text-bri-blue" : "text-bri-muted",
                  )}
                  style={{ maxWidth: minW }}
                >
                  {node.label}
                </span>
                {node.sublabel && (
                  <span
                    className={cn(
                      "block text-[8px] leading-tight",
                      isActive ? "font-semibold text-bri-navy" : isDone ? "font-medium text-bri-blue" : "text-bri-muted",
                    )}
                  >
                    {node.sublabel}
                  </span>
                )}
              </div>
            </div>

            {i < nodes.length - 1 && (
              <div
                className="mt-[13px]"
                style={{
                  width: connW,
                  height: 2,
                  borderTop: `2px dotted ${i < activeIdx ? "#00529C" : "#E5E7EB"}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
