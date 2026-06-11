"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MobileApp } from "@/components/mobile/MobileApp";
import { DocumentDashboard } from "@/components/dashboard/DocumentDashboard";
import { useNilamFlow } from "@/hooks/useNilamFlow";
import { incomePartsFromOcr, kemampuanBayar } from "@/lib/kemampuan";

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
    classifyAndUpload,
    clearUploads,
    fetchAgunanFromLink,
    setAgunan,
    clearAgunan,
    slik,
    userInput,
    setUserInput,
    previewDocs,
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
          agunan={agunan}
          start={start}
          next={next}
          goBack={goBack}
          classifyAndUpload={classifyAndUpload}
          clearUploads={clearUploads}
          fetchAgunanFromLink={fetchAgunanFromLink}
          setAgunan={setAgunan}
          clearAgunan={clearAgunan}
          setJointAnswer={setJointAnswer}
          submit={submit}
          reset={reset}
        />
      }
      dashboard={
        <DocumentDashboard
          events={events}
          uploads={uploads}
          ocr={ocr}
          docCounts={docCounts}
          agunan={agunan}
          slik={slik}
          userInput={userInput}
          previewDocs={previewDocs}
        />
      }
    />
  );
}
