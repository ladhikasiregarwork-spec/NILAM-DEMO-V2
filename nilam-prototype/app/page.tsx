"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MobileApp } from "@/components/mobile/MobileApp";
import { DocumentDashboard } from "@/components/dashboard/DocumentDashboard";
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
    fetchAgunanFromLink,
    setAgunan,
    clearAgunan,
    slik,
    npw,
    agunanKlas,
    setAgunanKlas,
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
  // Collateral plafond cap = NPW × LTV (shared classification).
  const plafonAgunan =
    agunan?.harga != null ? Math.round((npw ?? agunan.harga) * ltvFromKlas(agunanKlas, agunan.harga)) : undefined;

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
          start={start}
          editAgunan={editAgunan}
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
          npw={npw}
          agunanKlas={agunanKlas}
          setAgunanKlas={setAgunanKlas}
        />
      }
    />
  );
}
