"use client";

import { useOrchestrationFeed } from "@/hooks/useOrchestrationFeed";
import { SLIP_GAJI, MUTASI } from "@/data/ocrFixtures";
import type { PersonaConfig, FlowStep } from "@/types/flow";
import type { OrchestrationEvent } from "@/types/orchestration";
import type { FraudResult, IdentityResult, SlikResult } from "@/types/engines";
import type { CustomerIncome, ComponentKey, ComponentMode } from "@/types/income";
import { PersonaSelector } from "./PersonaSelector";
import { OrchestrationPipeline } from "./OrchestrationPipeline";
import { OcrProcessingCard } from "./OcrProcessingCard";
import { OcrJsonCard } from "./OcrJsonCard";
import { FraudDetectionCard } from "./FraudDetectionCard";
import { IdentityCheckCard } from "./IdentityCheckCard";
import { SlikRetrievalCard } from "./SlikRetrievalCard";
import { IncomeComponentsCard } from "./IncomeComponentsCard";
import { ThpEngineCard } from "./ThpEngineCard";
import { ApplicationStatusBar } from "./ApplicationStatusBar";
import { AiInsightCard } from "./AiInsightCard";
import { CustomerProfileCard } from "./CustomerProfileCard";
import { MutationRecordCard } from "./MutationRecordCard";
import { EmploymentAgreementCard } from "./EmploymentAgreementCard";
import { DocumentMonitorCard } from "./DocumentMonitorCard";
import { CUSTOMER_PROFILE, EMPLOYMENT_AGREEMENT } from "@/data/profileFixtures";
import { MUTATION_RECORD } from "@/data/mutationFixtures";
import { deriveDocumentStatuses } from "@/data/documents";

interface BehindTheSceneProps {
  persona: PersonaConfig;
  isJoint: boolean;
  currentStep?: FlowStep;
  events: OrchestrationEvent[];
  nasabah: CustomerIncome | undefined;
  pasangan: CustomerIncome | undefined;
  onSetNasabahPayroll: (v: boolean) => void;
  onSetPasanganPayroll: (v: boolean) => void;
  onReset: () => void;
  setComponentMode: (role: "nasabah" | "pasangan", key: ComponentKey, mode: ComponentMode) => void;
  setComponentWeight: (role: "nasabah" | "pasangan", key: ComponentKey, weight: number) => void;
}

/**
 * BehindTheScene — the full right-side "BEHIND THE SCENE LOGIC" dashboard panel.
 *
 * Fixed, no-scroll grid composed of three rows:
 *   ROW A: PersonaSelector | [OrchestrationPipeline / OCR cards]
 *   ROW B: Fraud · Identity · SLIK
 *   ROW C: Income Nasabah · THP · Income Pasangan
 */
export function BehindTheScene({
  persona,
  isJoint,
  events,
  nasabah,
  pasangan,
  onSetNasabahPayroll,
  onSetPasanganPayroll,
  onReset,
  setComponentMode,
  setComponentWeight,
}: BehindTheSceneProps) {
  const { latest, statusOf } = useOrchestrationFeed(events);
  const ocrStatus = statusOf("ocr");

  // Derive the five document statuses LIVE from the orchestration feed — these
  // drive both the pipeline stepper and the Document Monitoring card.
  const docStatuses = deriveDocumentStatuses(statusOf);

  // Derive the headline application outcome from the pipeline state.
  const thpDone = statusOf("thp") === "success";
  const appStatus: "idle" | "processing" | "eligible" = thpDone
    ? "eligible"
    : events.length > 0
    ? "processing"
    : "idle";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-[#F5F7FA] p-3">

      {/* ── Application status — headline outcome (5-second read) ─────── */}
      <ApplicationStatusBar status={appStatus} confidence={94} />

      {/* ── ROW A — flex-[7]: [Persona + AI Insight] | Pipeline+OCR ───── */}
      <div className="flex min-h-0 flex-[7] gap-3 overflow-hidden">
        {/* Narrow left column: compact persona on top + AI Insight below */}
        <div className="flex w-[200px] shrink-0 flex-col gap-3 overflow-hidden">
          <div className="shrink-0">
            <PersonaSelector
              persona={persona}
              onSetNasabahPayroll={onSetNasabahPayroll}
              onSetPasanganPayroll={onSetPasanganPayroll}
              onReset={onReset}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <AiInsightCard isJoint={isJoint} ready={thpDone} />
          </div>
        </div>

        {/* Right column: pipeline stacked above OCR row */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          {/* AI Orchestration Pipeline — shrink-0: it's small, let it breathe */}
          <div className="shrink-0">
            <OrchestrationPipeline statuses={docStatuses} />
          </div>

          {/* OCR row fills remaining height: Processing (~40%) + JSON (~60%) */}
          <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
            <div className="w-[40%] shrink-0 overflow-hidden">
              <OcrProcessingCard ocrStatus={ocrStatus} isJoint={isJoint} />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              <OcrJsonCard
                ocrStatus={ocrStatus}
                slip={SLIP_GAJI}
                mutasi={MUTASI}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW B — flex-[7]: Fraud · [Identity Pasangan?] · SLIK ─────
           joint  → grid-cols-3: Fraud | Identity (Pasangan) | SLIK
           single → grid-cols-2: Fraud | SLIK (spouse card not rendered)
      ────────────────────────────────────────────────────────────── */}
      <div
        className={`grid min-h-0 flex-[6] gap-3 overflow-hidden ${
          isJoint ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        <FraudDetectionCard
          status={statusOf("fraud")}
          result={latest.get("fraud")?.output as FraudResult | undefined}
          isWide={!isJoint}
        />
        {isJoint && (
          <IdentityCheckCard
            status={statusOf("identity")}
            identity={latest.get("identity")?.output as IdentityResult | null | undefined}
            isJoint={isJoint}
          />
        )}
        <SlikRetrievalCard
          status={statusOf("slik")}
          slik={latest.get("slik")?.output as { nasabah: SlikResult; pasangan?: SlikResult } | undefined}
          isWide={!isJoint}
        />
      </div>

      {/* ── ROW B2 — Customer Dossier: Profile · Mutation Record · Perjanjian Kerja
           Three new cards driven by the OCR/extraction step (ocrStatus). Equal
           thirds; gated to "Menunggu…" placeholders until OCR succeeds.
      ────────────────────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-[6] grid-cols-4 gap-3 overflow-hidden">
        <DocumentMonitorCard statuses={docStatuses} />
        <CustomerProfileCard status={ocrStatus} profile={CUSTOMER_PROFILE} />
        <MutationRecordCard status={ocrStatus} record={MUTATION_RECORD} />
        <EmploymentAgreementCard status={ocrStatus} agreement={EMPLOYMENT_AGREEMENT} />
      </div>

      {/* ── ROW C — flex-[6]: Income Nasabah · [Income Pasangan?] · THP HERO
           THP is the FINAL OUTPUT → given extra width so it dominates.
           joint  → Income N | Income P | THP(1.35fr)
           single → Income N | THP(1.35fr)
      ────────────────────────────────────────────────────────────── */}
      <div
        className={`grid min-h-0 flex-[7] gap-3 overflow-hidden ${
          isJoint ? "grid-cols-[1fr_1fr_1.35fr]" : "grid-cols-[1fr_1.35fr]"
        }`}
      >
        <IncomeComponentsCard
          title="INCOME COMPONENTS - NASABAH"
          income={nasabah}
          onMode={(k, m) => setComponentMode("nasabah", k, m)}
          onWeight={(k, w) => setComponentWeight("nasabah", k, w)}
        />
        {isJoint && (
          <IncomeComponentsCard
            title="INCOME COMPONENTS - PASANGAN"
            income={pasangan}
            stripped={!isJoint}
            onMode={(k, m) => setComponentMode("pasangan", k, m)}
            onWeight={(k, w) => setComponentWeight("pasangan", k, w)}
          />
        )}
        <ThpEngineCard
          nasabah={nasabah}
          pasangan={pasangan}
          isJoint={isJoint}
        />
      </div>
    </div>
  );
}
