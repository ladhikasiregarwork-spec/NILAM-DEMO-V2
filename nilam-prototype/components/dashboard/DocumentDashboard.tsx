"use client";

import { useOrchestrationFeed } from "@/hooks/useOrchestrationFeed";
import { deriveDocumentStatuses } from "@/data/documents";
import type { OrchestrationEvent } from "@/types/orchestration";
import type { OcrResults } from "@/types/ocrExtract";
import type { EmploymentAgreement, SlikReport } from "@/types/profile";
import type { DocumentId } from "@/types/documents";
import type { AgunanData } from "@/types/agunan";
import type { UserInput } from "@/types/userInput";
import { computeCreditScore } from "@/engines/scoring/creditScore";
import { anuitas } from "@/lib/kpr";
import { incomePartsFromOcr } from "@/lib/kemampuan";

import { UploadedDocsStrip } from "./UploadedDocsStrip";
import { AgunanInfoCard } from "./AgunanInfoCard";
import { UserInformationCard } from "./UserInformationCard";
import { EmploymentAgreementCard } from "./EmploymentAgreementCard";
import { SalarySlipCard } from "./SalarySlipCard";
import { BankStatementTableCard } from "./BankStatementTableCard";
import { SlikOjkCard } from "./SlikOjkCard";
import { InstallmentCard } from "./InstallmentCard";
import { CreditScoringCard } from "./CreditScoringCard";
import { MatchingCard } from "./MatchingCard";

import { EMPLOYMENT_AGREEMENT } from "@/data/profileFixtures";
import { SLIP_GAJI } from "@/data/ocrFixtures";
import { BANK_STATEMENT_ROWS } from "@/data/bankStatementFixtures";
import { SLIK_LOANS, SLIK_TOTAL_ANGSURAN } from "@/data/slikLoansFixtures";
import { SLIK_NASABAH } from "@/data/slikFixtures";
import { NASABAH_INCOME } from "@/data/incomeFixtures";
import { usiaDariKtp } from "@/lib/usia";

interface DocumentDashboardProps {
  events: OrchestrationEvent[];
  uploads: Record<string, boolean>;
  /** Real OCR-extracted data for Slip Gaji & SK Perusahaan (when uploaded). */
  ocr: OcrResults;
  /** Number of files classified per document type (Slip Gaji & Mutasi shown). */
  docCounts: Partial<Record<DocumentId, number>>;
  /** Collateral/property data (manual or from a link). */
  agunan?: AgunanData;
  /** SLIK report (from the SLIK CSV) — falls back to mock when absent. */
  slik?: SlikReport;
  /** Borrower application data from the Data Diri form. */
  userInput?: UserInput;
}

/**
 * DocumentDashboard — the document-centric dashboard (Image 2). A vertical,
 * scrollable stack:
 *
 *   DATA ALREADY UPLOAD            (5-document status strip)
 *   KTP INFO | KK INFO | SK PERUSAHAAN
 *   SALARY SLIP
 *   BANK STATEMENT
 *   SLIK OJK (every loan)
 *   CALCULATE INSTALLMENT PAYMENTS
 *
 * Each section is gated on the live processing feed: document/identity info on
 * OCR success, SLIK on the bureau pull, installment on the THP step. The panel
 * scrolls internally within the fixed canvas.
 */
export function DocumentDashboard({ events, uploads, ocr, docCounts, agunan, slik, userInput }: DocumentDashboardProps) {
  const { statusOf } = useOrchestrationFeed(events);

  const ocrStatus = statusOf("ocr");
  const slikStatus = statusOf("slik");
  const thpStatus = statusOf("thp");

  // Live document statuses (uploads + processing feed).
  const docStatuses = deriveDocumentStatuses(statusOf, uploads);

  // SK Perusahaan: prefer real OCR-extracted fields, fall back to the mock for
  // any field the parser couldn't read.
  const sk = ocr.skPerusahaan;
  const skAgreement: EmploymentAgreement = sk
    ? {
        perusahaan: sk.perusahaan || EMPLOYMENT_AGREEMENT.perusahaan,
        jabatan: sk.jabatan || EMPLOYMENT_AGREEMENT.jabatan,
        statusKepegawaian: sk.statusKepegawaian || EMPLOYMENT_AGREEMENT.statusKepegawaian,
        masaKerja: sk.masaKerja || EMPLOYMENT_AGREEMENT.masaKerja,
        gajiPokok: EMPLOYMENT_AGREEMENT.gajiPokok, // SK does not carry salary
        tanggalMulai: sk.tanggalMulai || EMPLOYMENT_AGREEMENT.tanggalMulai,
        tanggalBerakhir: sk.tanggalBerakhir || EMPLOYMENT_AGREEMENT.tanggalBerakhir,
      }
    : EMPLOYMENT_AGREEMENT;

  // Age (from KTP) + real monthly income (slip THP → mutasi gaji → mock) feed
  // the credit score.
  const age = usiaDariKtp(ocr.ktp?.tanggalLahir);
  const slipThp = ocr.slipGaji?.records?.find((r) => r.thp != null)?.thp;
  const monthlyIncome =
    slipThp ?? ocr.mutasi?.gajiNominal ?? NASABAH_INCOME.components.find((c) => c.key === "Gaji")?.avg ?? 0;
  // SLIK: real report (from CSV by NIK) when available, else mock.
  const slikLoans = slik?.loans ?? SLIK_LOANS;
  const slikTotalAngsuran = slik?.totalAngsuran ?? SLIK_TOTAL_ANGSURAN;
  // Income components (gaji/THR/bonus) for the payment-capacity calc.
  const income = incomePartsFromOcr(ocr);

  // Credit score (9 factors) — profile (Data Diri) + deal ratios.
  const hargaRumah = agunan?.harga;
  const uangMuka = userInput?.uangMuka;
  const tenorTahun = userInput?.jangkaWaktu ?? 15;
  const plafond =
    hargaRumah != null
      ? uangMuka != null
        ? Math.max(0, hargaRumah - uangMuka)
        : Math.round(hargaRumah * 0.8)
      : undefined;
  const kprAngsuran = plafond ? anuitas(plafond, 0.105, tenorTahun * 12) : 0;
  const punyaSimpananBri =
    !!ocr.mutasi || slikLoans.some((l) => /bri|rakyat indonesia/i.test(l.lembaga));
  const creditResult = computeCreditScore({
    pendidikan: userInput?.pendidikan,
    statusKawin: userInput?.statusKawin ?? ocr.ktp?.statusPerkawinan,
    usia: userInput?.usia ?? age,
    punyaSimpananBri,
    jangkaWaktu: tenorTahun,
    hargaRumah,
    uangMuka,
    jumlahTanggungan: userInput?.jumlahTanggungan,
    incomeMonthly: monthlyIncome,
    angsuranBulanan: kprAngsuran + slikTotalAngsuran,
    plafond,
  });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto scroll-thin bg-[#F5F7FA] p-3">
      {/* Row 1: DATA ALREADY UPLOAD | NPW & INFORMASI AGUNAN */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-3">
        <UploadedDocsStrip statuses={docStatuses} />
        <AgunanInfoCard agunan={agunan} />
      </div>

      {/* Row 2: USER INFORMATION | COMPANY EMPLOYMENT CERTIFICATE INFORMATION */}
      <div className="grid grid-cols-2 gap-3">
        <UserInformationCard
          status={ocrStatus}
          ktp={ocr.ktp}
          kk={ocr.kk}
          nama={userInput?.nama}
          missing={!uploads.ktp && !uploads.kk}
        />
        <EmploymentAgreementCard
          status={ocrStatus}
          agreement={skAgreement}
          title="Company Employment Certificate"
          missing={!uploads.sk_perusahaan}
          sourceLabel={sk ? "Hasil OCR" : undefined}
        />
      </div>

      {/* Row 3: CALCULATE INSTALLMENT PAYMENTS | CREDIT SCORING */}
      <div className="grid grid-cols-[1.7fr_1fr] items-stretch gap-3">
        <InstallmentCard
          status={thpStatus}
          gajiBulanan={income.gajiBulanan}
          thrTahunan={income.thrTahunan}
          bonusTahunan={income.bonusTahunan}
          slikAngsuran={slikTotalAngsuran}
          agunan={agunan}
          uangMuka={userInput?.uangMuka}
          jangkaWaktu={userInput?.jangkaWaktu}
        />
        <CreditScoringCard status={slikStatus} result={creditResult} />
      </div>

      {/* MATCHING SALARY SLIP & BANK STATEMENT */}
      <MatchingCard
        status={ocrStatus}
        mutasi={ocr.mutasi}
        slip={ocr.slipGaji}
        missing={!uploads.slip_gaji || !uploads.mutasi}
      />

      {/* SALARY SLIP */}
      <SalarySlipCard
        status={ocrStatus}
        gajiPokok={SLIP_GAJI.Gaji}
        components={NASABAH_INCOME.components}
        missing={!uploads.slip_gaji}
        extracted={ocr.slipGaji}
        count={docCounts.slip_gaji}
      />

      {/* BANK STATEMENT — month-by-month credits table */}
      <BankStatementTableCard
        status={ocrStatus}
        rows={BANK_STATEMENT_ROWS}
        missing={!uploads.mutasi}
        count={docCounts.mutasi}
        mutasi={ocr.mutasi}
      />

      {/* SLIK OJK — every loan */}
      <SlikOjkCard
        status={slikStatus}
        loans={slikLoans}
        totalAngsuran={slikTotalAngsuran}
        score={creditResult.score}
      />
    </div>
  );
}
