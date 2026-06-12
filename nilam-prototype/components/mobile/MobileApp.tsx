"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FlowStep, PersonaConfig } from "@/types/flow";
import type { ClassifyResult, OcrResults } from "@/types/ocrExtract";
import type { UserInput } from "@/types/userInput";
import type { DocumentId } from "@/types/documents";
import type { AgunanData } from "@/types/agunan";

import { PhoneMockup } from "./PhoneMockup";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { FlowStepper } from "./FlowStepper";

import { OpeningScreen } from "./screens/OpeningScreen";
import { TermConditionScreen } from "./screens/TermConditionScreen";
import { RequirementScreen } from "./screens/RequirementScreen";
import { DataDiriScreen } from "./screens/DataDiriScreen";
import { AgunanScreen } from "./screens/AgunanScreen";
import { ProcessingScreen } from "./screens/ProcessingScreen";
import { OfferingScreen } from "./screens/OfferingScreen";
import { DisburseScreen } from "./screens/DisburseScreen";

// ─── Slide variants ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const slideTransition = { duration: 0.22, ease: "easeInOut" };

// ─── Props ───────────────────────────────────────────────────────────────────

interface MobileAppProps {
  persona: PersonaConfig;
  isJoint: boolean;
  currentStep: FlowStep;
  canGoBack: boolean;
  uploads: Record<string, boolean>;
  docCounts: Partial<Record<DocumentId, number>>;
  ocr: OcrResults;
  userInput: UserInput;
  setUserInput: (patch: Partial<UserInput>) => void;
  /** Monthly payment capacity (gaji + THR/12 + bonus/12 − SLIK). */
  kemampuan: number;
  /** Collateral plafond cap = NPW × LTV. */
  plafonAgunan?: number;
  agunan?: AgunanData;
  start: () => void;
  next: () => void;
  goBack: () => void;
  editAgunan: () => void;
  classifyAndUpload: (
    files: File[],
  ) => Promise<{ ok: boolean; results?: ClassifyResult[]; error?: string }>;
  clearUploads: () => void;
  fetchAgunanFromLink: (url: string) => Promise<{ ok: boolean; error?: string }>;
  setAgunan: (data: AgunanData) => void;
  clearAgunan: () => void;
  setJointAnswer: (ans: "ya" | "tidak") => void;
  submit: () => void;
  reset: () => void;
}

/**
 * MobileApp — composes the iPhone mockup + animated screen switch + bottom nav
 * + the FlowStepper below the phone.
 *
 * Manages local `validating` state: on Submit → 1.4s delay → calls flow.submit().
 */
export function MobileApp({
  persona,
  isJoint,
  currentStep,
  canGoBack,
  uploads,
  docCounts,
  ocr,
  userInput,
  setUserInput,
  kemampuan,
  plafonAgunan,
  agunan,
  start,
  next,
  goBack,
  editAgunan,
  classifyAndUpload,
  clearUploads,
  fetchAgunanFromLink,
  setAgunan,
  clearAgunan,
  setJointAnswer,
  submit,
  reset,
}: MobileAppProps) {
  const [validating, setValidating] = useState(false);

  function handleSubmit() {
    if (validating) return;
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      submit();
    }, 1400);
  }

  // ─── Render the current screen ─────────────────────────────────────────────

  function renderScreen() {
    switch (currentStep) {
      case "opening":
        return (
          <OpeningScreen
            key="opening"
            personaSelected={true}
            onStart={start}
          />
        );
      case "term_condition":
        return <TermConditionScreen key="term_condition" onAccept={next} />;
      case "data_diri":
        return (
          <DataDiriScreen
            key="data_diri"
            userInput={userInput}
            setUserInput={setUserInput}
            prefilled={!!ocr.ktp || !!ocr.kk}
            onSubmit={next}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "requirement":
        return (
          <RequirementScreen
            key="requirement"
            uploads={uploads}
            docCounts={docCounts}
            classifyAndUpload={classifyAndUpload}
            clearUploads={clearUploads}
            onSubmit={next}
            validating={false}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "agunan":
        return (
          <AgunanScreen
            key="agunan"
            agunan={agunan}
            onFetchLink={fetchAgunanFromLink}
            onSetAgunan={setAgunan}
            onClear={clearAgunan}
            onSubmit={handleSubmit}
            validating={validating}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "processing":
        return <ProcessingScreen key="processing" />;
      case "offering":
        return (
          <OfferingScreen
            key="offering"
            agunan={agunan}
            tanggalLahir={ocr.ktp?.tanggalLahir}
            uangMuka={userInput.uangMuka}
            jangkaWaktu={userInput.jangkaWaktu}
            kemampuan={kemampuan}
            plafonAgunan={plafonAgunan}
            onAccept={next}
            onEditAgunan={editAgunan}
            canGoBack={false}
          />
        );
      case "disburse":
        return <DisburseScreen key="disburse" agunan={agunan} uangMuka={userInput.uangMuka} plafonAgunan={plafonAgunan} onFinish={reset} />;
      default:
        return (
          <OpeningScreen
            key="opening-fallback"
            personaSelected={true}
            onStart={start}
          />
        );
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* ── iPhone mockup — flex-1 so phone fills remaining column height ── */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        <PhoneMockup>
          {/* In-screen header */}
          <MobileHeader />

          {/* Animated screen area */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex h-full flex-col"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav bar */}
          <BottomNav />
        </PhoneMockup>
      </div>

      {/* ── Flow stepper — shrink-0 pinned below phone, no gap ────────── */}
      <div className="shrink-0 border-t border-bri-line bg-white px-2 pb-2 pt-1.5">
        <FlowStepper currentStep={currentStep} />
      </div>
    </div>
  );
}
