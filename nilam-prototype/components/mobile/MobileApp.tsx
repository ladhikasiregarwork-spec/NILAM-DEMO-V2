"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FlowStep, PersonaConfig, SurveyStatus, AnalystDecisionStatus } from "@/types/flow";
import type { ClassifyResult, OcrResults } from "@/types/ocrExtract";
import type { UserInput } from "@/types/userInput";
import type { DocumentId } from "@/types/documents";
import type { AgunanData } from "@/types/agunan";
import type { LoanType, Vehicle, AutoLoanCalc, AppointmentData, AutoVerifyStatus, AutoDecisionStatus } from "@/types/auto";
import type { CreditCard, CardDecisionStatus } from "@/types/card";
import { incomePartsFromOcr } from "@/lib/kemampuan";

import { PhoneMockup } from "./PhoneMockup";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { FlowStepper } from "./FlowStepper";

import { OpeningScreen } from "./screens/OpeningScreen";
import { TermConditionScreen } from "./screens/TermConditionScreen";
import { LoanTypeScreen } from "./screens/LoanTypeScreen";
import { RequirementScreen } from "./screens/RequirementScreen";
import { DataDiriScreen } from "./screens/DataDiriScreen";
import { AgunanScreen } from "./screens/AgunanScreen";
import { ProcessingScreen } from "./screens/ProcessingScreen";
import { SurveyScreen } from "./screens/SurveyScreen";
import { OfferingScreen } from "./screens/OfferingScreen";
import { DisburseScreen } from "./screens/DisburseScreen";
import { AnalystDecisionScreen } from "./screens/AnalystDecisionScreen";
import { VehicleSearchScreen } from "./screens/VehicleSearchScreen";
import { VehicleDetailScreen } from "./screens/VehicleDetailScreen";
import { AppointmentScreen } from "./screens/AppointmentScreen";
import { AppointmentDoneScreen } from "./screens/AppointmentDoneScreen";
import { CardReviewScreen } from "./screens/CardReviewScreen";
import { CardSelectScreen } from "./screens/CardSelectScreen";
import { CardDetailScreen } from "./screens/CardDetailScreen";
import { CardDoneScreen } from "./screens/CardDoneScreen";

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
  /** RM survey status (for collateral ≥ Rp500 juta). */
  surveyStatus: SurveyStatus;
  /** Collateral-appraisal note (shown on rejection). */
  surveyNote?: string;
  /** Appraised value from the collateral appraisal. */
  surveyValue?: number;
  /** Credit-analyst decision (KPR) — gates the offer; drives the analyst_decision screen. */
  analystDecision: AnalystDecisionStatus;
  /** Chosen product (null until the loan_type step). */
  loanType: LoanType | null;
  setLoanType: (type: LoanType) => void;
  /** Auto-loan state. */
  vehicle?: Vehicle;
  setVehicle: (v: Vehicle) => void;
  autoLoan: AutoLoanCalc;
  setAutoLoan: (patch: Partial<AutoLoanCalc>) => void;
  appointment: AppointmentData;
  setAppointment: (patch: Partial<AppointmentData>) => void;
  /** KKB approval pipeline statuses (shown on the appointment_done screen). */
  autoVerify: AutoVerifyStatus;
  autoDecision: AutoDecisionStatus;
  autoVerifyNote?: string;
  /** Credit-card state. */
  card?: CreditCard;
  setCard: (card: CreditCard) => void;
  cardLimit: number;
  setCardLimit: (value: number) => void;
  cardDecision: CardDecisionStatus;
  /** Analyst-approved maximum limit (caps card selection). */
  cardGrantedLimit?: number;
  /** Submit the card application → opens the analyst limit decision. */
  submitCard: () => void;
  start: () => void;
  next: () => void;
  goBack: () => void;
  editAgunan: () => void;
  classifyAndUpload: (
    files: File[],
  ) => Promise<{ ok: boolean; results?: ClassifyResult[]; error?: string }>;
  clearUploads: () => void;
  seedDemo: () => void;
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
  surveyStatus,
  surveyNote,
  surveyValue,
  analystDecision,
  loanType,
  setLoanType,
  vehicle,
  setVehicle,
  autoLoan,
  setAutoLoan,
  appointment,
  setAppointment,
  autoVerify,
  autoDecision,
  autoVerifyNote,
  card,
  setCard,
  cardLimit,
  setCardLimit,
  cardDecision,
  cardGrantedLimit,
  submitCard,
  start,
  next,
  goBack,
  editAgunan,
  classifyAndUpload,
  clearUploads,
  seedDemo,
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
      case "loan_type":
        return (
          <LoanTypeScreen
            key="loan_type"
            loanType={loanType}
            onSelect={setLoanType}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
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
            onSeedDemo={seedDemo}
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
      case "survey":
        return (
          <SurveyScreen
            key="survey"
            status={surveyStatus}
            agunan={agunan}
            note={surveyNote}
            surveyValue={surveyValue}
            onEditAgunan={editAgunan}
          />
        );
      case "analyst_decision":
        return (
          <AnalystDecisionScreen
            key="analyst_decision"
            status={analystDecision}
            agunan={agunan}
            surveyValue={surveyValue}
            onEditAgunan={editAgunan}
            onRestart={reset}
          />
        );
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
      // ── Auto-loan (KKB) branch ─────────────────────────────────────────
      case "vehicle_search":
        return (
          <VehicleSearchScreen
            key="vehicle_search"
            selected={vehicle}
            onSelect={(v) => {
              setVehicle(v);
              next();
            }}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "vehicle_detail":
        return (
          <VehicleDetailScreen
            key="vehicle_detail"
            vehicle={vehicle}
            calc={autoLoan}
            setCalc={setAutoLoan}
            onAccept={next}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "appointment":
        return (
          <AppointmentScreen
            key="appointment"
            vehicle={vehicle}
            calc={autoLoan}
            appointment={appointment}
            setAppointment={setAppointment}
            userInput={userInput}
            setUserInput={setUserInput}
            onConfirm={next}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "appointment_done":
        return (
          <AppointmentDoneScreen
            key="appointment_done"
            vehicle={vehicle}
            calc={autoLoan}
            appointment={appointment}
            autoVerify={autoVerify}
            autoDecision={autoDecision}
            autoVerifyNote={autoVerifyNote}
            onFinish={reset}
          />
        );
      // ── Credit-card (Kartu Kredit) branch — analyst limit FIRST ────────
      case "card_review":
        return (
          <CardReviewScreen
            key="card_review"
            status={cardDecision}
            nama={userInput?.nama ?? ocr.ktp?.nama}
            onSubmit={submitCard}
            onRestart={reset}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "card_select":
        return (
          <CardSelectScreen
            key="card_select"
            selected={card}
            grantedLimit={cardGrantedLimit}
            onSelect={(c) => {
              setCard(c);
              // Clamp the pre-selected limit to the analyst's granted limit.
              if (cardGrantedLimit != null) setCardLimit(Math.min(cardGrantedLimit, c.maxLimit));
              next();
            }}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "card_detail":
        return (
          <CardDetailScreen
            key="card_detail"
            card={card}
            limit={cardLimit}
            setLimit={setCardLimit}
            monthlyIncome={incomePartsFromOcr(ocr).gajiBulanan}
            grantedLimit={cardGrantedLimit}
            onSubmit={next}
            onGoBack={goBack}
            canGoBack={canGoBack}
          />
        );
      case "card_done":
        return (
          <CardDoneScreen
            key="card_done"
            card={card}
            limit={cardLimit}
            nama={userInput?.nama ?? ocr.ktp?.nama}
            onFinish={reset}
          />
        );
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

      {/* ── Flow stepper — fixed-height bar so both phones match in size ── */}
      <div className="flex h-[60px] shrink-0 flex-col justify-center border-t border-bri-line bg-white px-2">
        <FlowStepper currentStep={currentStep} loanType={loanType} />
      </div>
    </div>
  );
}
