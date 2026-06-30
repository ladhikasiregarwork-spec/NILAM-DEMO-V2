"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MobileApp } from "@/components/mobile/MobileApp";
import { DocumentDashboard } from "@/components/dashboard/DocumentDashboard";
import { AutoLoanDashboard } from "@/components/dashboard/AutoLoanDashboard";
import { RmMobileApp } from "@/components/rm/RmMobileApp";
import { RmAutoApp } from "@/components/rm/RmAutoApp";
import { useNilamFlow } from "@/hooks/useNilamFlow";
import { incomePartsFromOcr, kemampuanBayar } from "@/lib/kemampuan";
import { ltvFromKlas } from "@/data/ltv";

export default function Page() {
  const {
    persona,
    isJoint,
    currentStep,
    canGoBack,
    uploads,
    events,
    ocr,
    docCounts,
    agunan,
    setJointAnswer,
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
    slik,
    npw,
    npwLand,
    agunanKlas,
    setAgunanKlas,
    loanType,
    vehicle,
    autoLoan,
    appointment,
    autoVerify,
    autoVerifyNote,
    autoDecision,
    setLoanType,
    setVehicle,
    setAutoLoan,
    setAppointment,
    submitAutoVerify,
    submitAutoDecision,
    userInput,
    setUserInput,
    previewDocs,
    surveyStatus,
    surveyValue,
    surveyNote,
    submitSurvey,
    analystDecision,
    submitAnalystDecision,
    submit,
    reset,
  } = useNilamFlow();

  const _income = incomePartsFromOcr(ocr);
  const kemampuan = kemampuanBayar(
    _income.gajiBulanan,
    _income.thrTahunan,
    _income.bonusTahunan,
    slik?.totalAngsuran ?? 0,
  );
  // Once the RM approves the survey, the offer uses the RM's appraised value
  // instead of the model NPW.
  const effectiveNpw = surveyStatus === "approved" && surveyValue != null ? surveyValue : npw;
  // Collateral plafond cap = NPW × LTV (shared classification).
  const plafonAgunan =
    agunan?.harga != null
      ? Math.round((effectiveNpw ?? agunan.harga) * ltvFromKlas(agunanKlas, agunan.harga))
      : undefined;

  return (
    <AppShell
      mobile={
        <MobileApp
          persona={persona}
          isJoint={isJoint}
          currentStep={currentStep}
          canGoBack={canGoBack}
          uploads={uploads}
          docCounts={docCounts}
          ocr={ocr}
          userInput={userInput}
          setUserInput={setUserInput}
          kemampuan={kemampuan}
          plafonAgunan={plafonAgunan}
          agunan={agunan}
          surveyStatus={surveyStatus}
          surveyNote={surveyNote}
          surveyValue={surveyValue}
          analystDecision={analystDecision}
          loanType={loanType}
          setLoanType={setLoanType}
          vehicle={vehicle}
          setVehicle={setVehicle}
          autoLoan={autoLoan}
          setAutoLoan={setAutoLoan}
          appointment={appointment}
          setAppointment={setAppointment}
          autoVerify={autoVerify}
          autoDecision={autoDecision}
          autoVerifyNote={autoVerifyNote}
          start={start}
          editAgunan={editAgunan}
          next={next}
          goBack={goBack}
          classifyAndUpload={classifyAndUpload}
          clearUploads={clearUploads}
          seedDemo={seedDemo}
          fetchAgunanFromLink={fetchAgunanFromLink}
          setAgunan={setAgunan}
          clearAgunan={clearAgunan}
          setJointAnswer={setJointAnswer}
          submit={submit}
          reset={reset}
        />
      }
      dashboard={
        loanType === "auto" ? (
          <AutoLoanDashboard
            currentStep={currentStep}
            vehicle={vehicle}
            calc={autoLoan}
            appointment={appointment}
            autoVerify={autoVerify}
            autoDecision={autoDecision}
            onDecision={submitAutoDecision}
            uploads={uploads}
            ocr={ocr}
            slik={slik}
            userInput={userInput}
            previewDocs={previewDocs}
          />
        ) : (
          <DocumentDashboard
            events={events}
            uploads={uploads}
            ocr={ocr}
            docCounts={docCounts}
            agunan={agunan}
            slik={slik}
            userInput={userInput}
            previewDocs={previewDocs}
            npw={npw}
            npwLand={npwLand}
            agunanKlas={agunanKlas}
            setAgunanKlas={setAgunanKlas}
            analystDecision={analystDecision}
            onAnalystDecision={submitAnalystDecision}
          />
        )
      }
      rmMobile={
        loanType === "auto" ? (
          <RmAutoApp
            vehicle={vehicle}
            calc={autoLoan}
            appointment={appointment}
            autoVerify={autoVerify}
            autoVerifyNote={autoVerifyNote}
            onSubmitVerify={submitAutoVerify}
            setAutoLoan={setAutoLoan}
          />
        ) : (
          <RmMobileApp
            live={{ nama: userInput?.nama, agunan, npw, npwLand, surveyStatus, surveyValue, surveyNote }}
            agunanKlas={agunanKlas}
            setAgunanKlas={setAgunanKlas}
            onSubmitSurvey={submitSurvey}
          />
        )
      }
    />
  );
}
