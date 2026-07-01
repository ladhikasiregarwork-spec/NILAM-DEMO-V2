"use client";

import { useState } from "react";
import {
  Car,
  TrendingDown,
  Wallet,
  CalendarDays,
  Gauge,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Percent,
  Banknote,
  ShieldCheck,
  Gavel,
  Calculator,
  AlertTriangle,
  Headset,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import { anuitas } from "@/lib/kpr";
import { computeAutoLoan } from "@/lib/autoLoan";
import { computeCreditScore } from "@/engines/scoring/creditScore";
import { usiaDariKtp } from "@/lib/usia";
import { schemeById } from "@/data/autoRates";
import { assignRm } from "@/data/relationshipManagers";
import { incomePartsFromOcr, kemampuanBayar, penghasilanBulanan, dirRate } from "@/lib/kemampuan";
import { deriveDocumentStatuses } from "@/data/documents";
import { EMPLOYMENT_AGREEMENT } from "@/data/profileFixtures";
import { SLIK_LOANS, SLIK_TOTAL_ANGSURAN } from "@/data/slikLoansFixtures";
import type { NodeId, NodeStatus } from "@/types/orchestration";
import type { FlowStep } from "@/types/flow";
import type { Vehicle, AutoLoanCalc, AppointmentData, AutoVerifyStatus, AutoDecisionStatus } from "@/types/auto";
import type { OcrResults, PreviewDoc } from "@/types/ocrExtract";
import type { SlikReport, EmploymentAgreement } from "@/types/profile";
import type { UserInput } from "@/types/userInput";
import { VehiclePhoto } from "@/components/mobile/screens/VehiclePhoto";

import { UploadedDocsStrip } from "./UploadedDocsStrip";
import { UserInformationCard } from "./UserInformationCard";
import { EmploymentAgreementCard } from "./EmploymentAgreementCard";
import { MatchingCard } from "./MatchingCard";
import { SlikOjkCard } from "./SlikOjkCard";
import { CreditScoringCard } from "./CreditScoringCard";
import { PreviewDocsCard } from "./PreviewDocsCard";

const BIG_TABS = [
  { id: "summary", label: "Summary" },
  { id: "transaksi", label: "Detail Transaksi" },
  { id: "slik", label: "Detail SLIK" },
  { id: "kendaraan", label: "Kendaraan" },
  { id: "preview", label: "Preview Dokumen" },
] as const;
type BigTab = (typeof BIG_TABS)[number]["id"];

interface AutoLoanDashboardProps {
  currentStep: FlowStep;
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  appointment: AppointmentData;
  /** RM verification stage for the booked appointment. */
  autoVerify: AutoVerifyStatus;
  /** Analyst decision stage (after RM verification). */
  autoDecision: AutoDecisionStatus;
  /** Analyst approves/rejects the application. */
  onDecision: (decision: "approved" | "rejected") => void;
  // ── Borrower analysis (shared with the mortgage dashboard, minus house) ──
  /** Uploaded-document flags (drives the "Data Already Upload" strip + missing states). */
  uploads: Record<string, boolean>;
  /** OCR-extracted KTP/KK/Slip Gaji/Mutasi/SK data. */
  ocr: OcrResults;
  /** SLIK report (by NIK) — falls back to the mock when absent. */
  slik?: SlikReport;
  /** Borrower application data from the Data Diri form. */
  userInput?: UserInput;
  /** Uploaded documents for the preview section. */
  previewDocs?: PreviewDoc[];
}

// ── small building blocks ────────────────────────────────────────────────────

function Card({ title, icon: Icon, children, className }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-card border border-bri-line bg-white p-4 shadow-soft", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bri-bg text-bri-blue">
          <Icon size={15} />
        </span>
        <h3 className="text-[13px] font-bold text-bri-navy">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-bri-line bg-bri-bg/40 px-3 py-2">
      <p className="text-[10px] text-bri-muted">{label}</p>
      <p className={cn("text-[15px] font-extrabold leading-tight", accent ? "text-bri-blue" : "text-bri-ink")}>{value}</p>
      {sub && <p className="text-[9px] text-bri-muted">{sub}</p>}
    </div>
  );
}

/** Yearly amortization rows for a flat-rate annuity loan. */
function amortYearly(principal: number, annualRate: number, tenorMonths: number) {
  const im = annualRate / 12;
  const a = anuitas(principal, annualRate, tenorMonths);
  let bal = principal;
  const rows: { year: number; interest: number; principal: number; balance: number; angsuran: number }[] = [];
  let yInt = 0;
  let yPri = 0;
  for (let m = 1; m <= tenorMonths; m++) {
    const interest = bal * im;
    const principalPaid = a - interest;
    bal = Math.max(0, bal - principalPaid);
    yInt += interest;
    yPri += principalPaid;
    if (m % 12 === 0 || m === tenorMonths) {
      rows.push({ year: Math.ceil(m / 12), interest: Math.round(yInt), principal: Math.round(yPri), balance: Math.round(bal), angsuran: a });
      yInt = 0;
      yPri = 0;
    }
  }
  return rows;
}

// ── main ─────────────────────────────────────────────────────────────────────

/**
 * AutoLoanDashboard — the "Behind The Scene" analyst panel for the KKB
 * (auto-loan) flow. Mirrors the mortgage analyst dashboard's borrower analysis
 * (user information, employment, income matching, SLIK, document preview, and a
 * credit decision) WITHOUT any house/agunan information — the financed asset is
 * the vehicle, shown in its own "Kendaraan" tab (valuation, credit structure,
 * amortization, eligibility score, and the RM-verification → analyst decision).
 */
export function AutoLoanDashboard({
  currentStep,
  vehicle,
  calc,
  appointment,
  autoVerify,
  autoDecision,
  onDecision,
  uploads,
  ocr,
  slik,
  userInput,
  previewDocs,
}: AutoLoanDashboardProps) {
  const [tab, setTab] = useState<BigTab>("summary");

  // The auto flow does not run the orchestration pipeline, so card "ready" state
  // is derived from data presence rather than from a live event feed.
  const dataReady = !!(ocr.ktp || ocr.kk || ocr.slipGaji || ocr.mutasi || ocr.skPerusahaan);
  const docStatus: NodeStatus = dataReady ? "success" : "idle";
  const statusOf = (_: NodeId): NodeStatus => docStatus;
  const docStatuses = deriveDocumentStatuses(statusOf, uploads);

  // SK Perusahaan: prefer real OCR-extracted fields, fall back to the mock.
  const sk = ocr.skPerusahaan;
  const skAgreement: EmploymentAgreement = sk
    ? {
        perusahaan: sk.perusahaan || EMPLOYMENT_AGREEMENT.perusahaan,
        jabatan: sk.jabatan || EMPLOYMENT_AGREEMENT.jabatan,
        statusKepegawaian: sk.statusKepegawaian || EMPLOYMENT_AGREEMENT.statusKepegawaian,
        masaKerja: sk.masaKerja || EMPLOYMENT_AGREEMENT.masaKerja,
        gajiPokok: EMPLOYMENT_AGREEMENT.gajiPokok,
        tanggalMulai: sk.tanggalMulai || EMPLOYMENT_AGREEMENT.tanggalMulai,
        tanggalBerakhir: sk.tanggalBerakhir || EMPLOYMENT_AGREEMENT.tanggalBerakhir,
      }
    : EMPLOYMENT_AGREEMENT;

  // Income (gaji/THR/bonus) + SLIK obligations → monthly payment capacity.
  const income = incomePartsFromOcr(ocr);
  const slikLoans = slik?.loans ?? SLIK_LOANS;
  const slikTotalAngsuran = slik?.totalAngsuran ?? SLIK_TOTAL_ANGSURAN;

  // Vehicle loan structure (when a vehicle has been chosen).
  const scheme = schemeById(calc.schemeId);
  const loan = vehicle ? computeAutoLoan(vehicle.price, calc.dpPct, scheme.rate, calc.tenorMonths, calc.discountPct) : undefined;
  const rm = assignRm(appointment);
  const years = calc.tenorMonths / 12;

  // Credit Scoring (9 factors) — the SAME engine the mortgage dashboard uses,
  // with the financed vehicle standing in for the house: OTR price → harga,
  // DP → uang muka, financed amount → plafond, monthly instalment (KKB + SLIK).
  // This is the single "Credit Scoring" number used across the whole KKB
  // dashboard (status bar, decision card, and the Kendaraan tab).
  const age = usiaDariKtp(ocr.ktp?.tanggalLahir);
  const slipThp = ocr.slipGaji?.records?.find((r) => r.thp != null)?.thp;
  const monthlyIncome = slipThp ?? ocr.mutasi?.gajiNominal ?? income.gajiBulanan ?? 0;
  const punyaSimpananBri = !!ocr.mutasi || slikLoans.some((l) => /bri|rakyat indonesia/i.test(l.lembaga));
  const creditResult = computeCreditScore({
    pendidikan: userInput?.pendidikan,
    statusKawin: userInput?.statusKawin ?? ocr.ktp?.statusPerkawinan,
    usia: userInput?.usia ?? age,
    punyaSimpananBri,
    jangkaWaktu: calc.tenorMonths / 12,
    hargaRumah: vehicle?.price,
    uangMuka: loan?.dp,
    jumlahTanggungan: userInput?.jumlahTanggungan,
    incomeMonthly: monthlyIncome,
    angsuranBulanan: (loan?.angsuran ?? 0) + slikTotalAngsuran,
    plafond: loan?.financed,
  });
  const score = creditResult.score;
  // Verdict pill = the credit grade (A/B/C/D), coloured by score band.
  const verdict = {
    label: creditResult.grade,
    cls:
      score >= 80
        ? "bg-emerald-50 text-emerald-600"
        : score >= 65
        ? "bg-bri-blue/10 text-bri-blue"
        : score >= 50
        ? "bg-amber-50 text-amber-600"
        : "bg-red-50 text-red-600",
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto scroll-thin bg-[#F5F7FA] p-3">
      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-card border border-bri-line bg-white px-4 py-3 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg bg-bri-bg text-bri-blue">
            {vehicle ? <VehiclePhoto vehicle={vehicle} iconSize={26} /> : <Car size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Pengajuan KKB</p>
            <p className="text-[15px] font-bold text-bri-navy">{vehicle ? vehicle.fullName : "Menunggu pilihan kendaraan…"}</p>
          </div>
        </div>
        {vehicle && (
          <div className="flex items-center gap-2">
            <span className={cn("rounded-pill px-3 py-1 text-[11px] font-bold", verdict.cls)}>{verdict.label}</span>
            <span className="rounded-pill bg-bri-bg px-3 py-1 text-[11px] font-semibold text-bri-ink">Skor {score}</span>
          </div>
        )}
      </div>

      {/* DATA ALREADY UPLOAD — pinned above the big tabs */}
      <UploadedDocsStrip statuses={docStatuses} />

      {/* Big tabs */}
      <div className="flex shrink-0 gap-1 rounded-pill border border-bri-line bg-white p-1 shadow-soft">
        {BIG_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-pill px-3 py-1.5 text-[11px] font-semibold transition-colors",
              tab === t.id ? "bg-bri-navy text-white shadow-soft" : "text-bri-muted hover:text-bri-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SUMMARY ─────────────────────────────────────────────────────── */}
      {tab === "summary" && (
        <div className="flex flex-col gap-3">
          {/* USER INFORMATION (+ employment) | INCOME + KEMAMPUAN BAYAR */}
          <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-3">
            <div className="flex flex-col gap-3">
              <UserInformationCard
                status={docStatus}
                ktp={ocr.ktp}
                kk={ocr.kk}
                nama={userInput?.nama}
                missing={!uploads.ktp && !uploads.kk}
              />
              <EmploymentAgreementCard
                status={docStatus}
                agreement={skAgreement}
                title="Company Employment Certificate"
                missing={!uploads.sk_perusahaan}
                sourceLabel={sk ? "Hasil OCR" : undefined}
              />
            </div>
            <div className="min-w-0">
              <MatchingCard
                status={docStatus}
                mutasi={ocr.mutasi}
                slip={ocr.slipGaji}
                missing={!uploads.slip_gaji || !uploads.mutasi}
                mode="rekap"
                footer={
                  <AutoCapacityCard
                    status={docStatus}
                    gajiBulanan={income.gajiBulanan}
                    thrTahunan={income.thrTahunan}
                    bonusTahunan={income.bonusTahunan}
                    slikAngsuran={slikTotalAngsuran}
                    angsuran={loan?.angsuran}
                    tenorMonths={calc.tenorMonths}
                  />
                }
              />
            </div>
          </div>

          {/* SLIK Ringkasan | CREDIT SCORING */}
          <div className="grid grid-cols-2 items-start gap-3">
            <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={creditResult.score} view="summary" />
            <CreditScoringCard status={docStatus} result={creditResult} />
          </div>

          {/* STRUKTUR KREDIT KENDARAAN | RINGKASAN & KEPUTUSAN */}
          <div className="grid grid-cols-2 items-start gap-3">
            <VehicleStructureCard vehicle={vehicle} calc={calc} loan={loan} />
            <AutoDecisionCard
              currentStep={currentStep}
              appointment={appointment}
              autoVerify={autoVerify}
              autoDecision={autoDecision}
              onDecision={onDecision}
              score={score}
              verdict={verdict}
              angsuran={loan?.angsuran}
              kemampuan={kemampuanBayar(income.gajiBulanan, income.thrTahunan, income.bonusTahunan, slikTotalAngsuran)}
            />
          </div>
        </div>
      )}

      {/* ── DETAIL TRANSAKSI — Transaksi Pemasukan ─────────────────────── */}
      {tab === "transaksi" && (
        <MatchingCard
          status={docStatus}
          mutasi={ocr.mutasi}
          slip={ocr.slipGaji}
          missing={!uploads.slip_gaji || !uploads.mutasi}
          mode="transaksi"
        />
      )}

      {/* ── DETAIL SLIK — Detail Fasilitas + Riwayat Tunggakan ──────────── */}
      {tab === "slik" && (
        <div className="flex flex-col gap-3">
          <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={score} view="detail" />
          <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={score} view="tunggakan" />
        </div>
      )}

      {/* ── KENDARAAN — valuasi, struktur, amortisasi, kelayakan, janji temu ── */}
      {tab === "kendaraan" && <VehicleTab vehicle={vehicle} calc={calc} loan={loan} score={score} verdict={verdict} appointment={appointment} autoVerify={autoVerify} currentStep={currentStep} rm={rm} />}

      {/* ── PREVIEW DOKUMEN ────────────────────────────────────────────── */}
      {tab === "preview" && <PreviewDocsCard docs={previewDocs ?? []} />}
    </div>
  );
}

// ── Income capacity vs the auto installment (navy gradient, à la mortgage) ─────

function AutoCapacityCard({
  status,
  gajiBulanan,
  thrTahunan,
  bonusTahunan,
  slikAngsuran,
  angsuran,
  tenorMonths,
}: {
  status: NodeStatus;
  gajiBulanan: number;
  thrTahunan: number;
  bonusTahunan: number;
  slikAngsuran: number;
  angsuran?: number;
  tenorMonths: number;
}) {
  const ready = status === "success";
  const [bonusEdit, setBonusEdit] = useState<number | null>(null);
  const bonus = bonusEdit ?? bonusTahunan;

  const penghasilan = penghasilanBulanan(gajiBulanan, thrTahunan, bonus);
  const dir = dirRate(penghasilan);
  const kemampuan = kemampuanBayar(gajiBulanan, thrTahunan, bonus, slikAngsuran);
  const layak = angsuran != null ? angsuran <= kemampuan : undefined;

  return (
    <div className="rounded-xl border border-bri-navy/30 px-3 py-2.5 shadow-soft" style={{ background: "linear-gradient(135deg, #00305C 0%, #00529C 100%)" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Calculator size={11} className="text-white" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80">Perhitungan Kemampuan Bayar</span>
        </div>
        <span className="rounded-pill bg-white/15 px-2 py-0.5 text-[7.5px] font-semibold text-white/90">vs Angsuran KKB</span>
      </div>

      {!ready ? (
        <div className="flex h-12 items-center justify-center">
          <span className="text-[10px] italic text-white/50">Menunggu data penghasilan…</span>
        </div>
      ) : (
        <div className="flex items-stretch gap-3">
          <div className="flex w-[210px] shrink-0 flex-col justify-center rounded-lg bg-white/10 px-3 py-2">
            <span className="text-[9px] text-white/70">Kemampuan Bayar / bln</span>
            <span className="text-[22px] font-bold leading-tight text-white tabular-nums">{formatRupiah(kemampuan)}</span>
            <span className="text-[8px] text-white/60">(gaji + THR/12 + bonus/12 − SLIK) × DIR {Math.round(dir * 100)}%</span>
            {layak != null && (
              <span className={`mt-1 inline-flex w-fit items-center gap-1 rounded-pill px-1.5 py-0.5 text-[8px] font-semibold ${layak ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>
                {layak ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}
                {layak ? "Angsuran KKB layak" : "Angsuran KKB melebihi kemampuan"}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <CapRow label="Gaji / bulan" value={formatRupiah(gajiBulanan)} />
            <CapRow label="THR / 12" value={`+ ${formatRupiah(Math.round(thrTahunan / 12))}`} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-white/70">Bonus / 12</span>
              <span className="flex items-center gap-1">
                <span className="text-[10px] text-white/90">+</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bonus.toLocaleString("id-ID")}
                  onChange={(e) => setBonusEdit(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                  title="Bonus tahunan (bisa diedit)"
                  className="w-[96px] rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-right text-[9px] font-medium text-white tabular-nums focus:border-white focus:outline-none"
                />
                <span className="text-[8px] text-white/50">/12</span>
              </span>
            </div>
            <div className="my-0.5 border-t border-white/20" />
            <CapRow label="Penghasilan / bln" value={formatRupiah(Math.round(penghasilan))} />
            <CapRow label="Angsuran SLIK (aktif)" value={`− ${formatRupiah(slikAngsuran)}`} />
            <CapRow label="× DIR (sesuai penghasilan)" value={`${Math.round(dir * 100)}%`} />
            <div className="my-0.5 border-t border-white/20" />
            <CapRow label="Kemampuan Bayar" value={formatRupiah(kemampuan)} strong />
            {angsuran != null && (
              <CapRow label={`Angsuran KKB (${tenorMonths} bln)`} value={formatRupiah(angsuran)} className={layak ? "text-emerald-200" : "text-red-200"} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CapRow({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] text-white/70">{label}</span>
      <span className={`tabular-nums ${strong ? "text-[11px] font-bold text-white" : "text-[10px] font-medium text-white/90"} ${className ?? ""}`}>{value}</span>
    </div>
  );
}

// ── Compact vehicle credit-structure card (Summary row) ───────────────────────

function VehicleStructureCard({ vehicle, calc, loan }: { vehicle?: Vehicle; calc: AutoLoanCalc; loan?: ReturnType<typeof computeAutoLoan> }) {
  const scheme = schemeById(calc.schemeId);
  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-3 py-2.5 shadow-soft">
      <div className="mb-2 flex items-center gap-1">
        <Wallet size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Struktur Kredit Kendaraan</span>
      </div>
      {!vehicle || !loan ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[9px] italic text-bri-muted/50">Belum ada kendaraan dipilih</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Harga OTR" value={formatRupiah(vehicle.price)} accent />
          <Stat label="Angsuran / bulan" value={formatRupiah(loan.angsuran)} accent />
          {loan.discount > 0 && (
            <Stat
              label={`Diskon (${Math.round(loan.discountPct * 100)}%)`}
              value={`− ${formatJuta(loan.discount)}`}
              sub={`Harga ${formatJuta(loan.netPrice)}`}
            />
          )}
          <Stat label="Uang Muka (DP)" value={formatRupiah(loan.dp)} sub={`${Math.round(calc.dpPct * 100)}% dari ${loan.discount > 0 ? "harga diskon" : "OTR"}`} />
          <Stat label="Pokok Dibiayai" value={formatRupiah(loan.financed)} sub={`Tenor ${calc.tenorMonths} bln`} />
          <Stat label="Bunga (efektif p.a.)" value={scheme.rateLabel} sub={scheme.label} />
          <Stat label="Total Bunga" value={formatJuta(loan.totalBunga)} sub={`Total bayar ${formatJuta(loan.totalKeseluruhan)}`} />
        </div>
      )}
    </div>
  );
}

// ── Ringkasan & Keputusan (auto) — RM verification → analyst decision ─────────

function AutoDecisionCard({
  currentStep,
  appointment,
  autoVerify,
  autoDecision,
  onDecision,
  score,
  verdict,
  angsuran,
  kemampuan,
}: {
  currentStep: FlowStep;
  appointment: AppointmentData;
  autoVerify: AutoVerifyStatus;
  autoDecision: AutoDecisionStatus;
  onDecision: (decision: "approved" | "rejected") => void;
  score: number;
  verdict: { label: string; cls: string };
  angsuran?: number;
  kemampuan: number;
}) {
  const booked = appointment.booked;
  const layak = angsuran != null ? angsuran <= kemampuan : undefined;

  return (
    <div className="flex h-full flex-col rounded-xl border border-bri-line bg-white px-3 py-2.5 shadow-soft">
      <div className="mb-2 flex items-center gap-1">
        <Gavel size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Ringkasan &amp; Keputusan</span>
      </div>

      {/* Score + capacity verdict */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between rounded-lg border border-bri-line bg-bri-bg/40 px-2.5 py-1.5">
          <span className="flex items-center gap-1 text-[9px] text-bri-muted"><Gauge size={11} className="text-bri-blue" /> Credit Scoring</span>
          <span className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold tabular-nums text-bri-navy">{score}</span>
            <span className={cn("rounded-pill px-2 py-px text-[8px] font-bold", verdict.cls)}>{verdict.label}</span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-bri-line bg-bri-bg/40 px-2.5 py-1.5">
          <span className="flex items-center gap-1 text-[9px] text-bri-muted"><Wallet size={11} className="text-bri-blue" /> Angsuran vs Kemampuan</span>
          {layak == null ? (
            <span className="text-[9px] italic text-bri-muted/60">—</span>
          ) : (
            <span className={cn("rounded-pill px-2 py-px text-[8px] font-bold", layak ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>{layak ? "LAYAK" : "MELEBIHI"}</span>
          )}
        </div>
      </div>

      {/* RM verification */}
      <div className="mt-2 border-t border-bri-line pt-2">
        <p className="mb-1 flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-bri-muted">
          {booked ? <ShieldCheck size={11} className="text-bri-blue" /> : <Clock size={11} className="text-bri-blue" />} Verifikasi BRIF Agent
        </p>
        {booked ? (
          <VerifyBadge status={autoVerify} />
        ) : (
          <p className="text-[10px] text-bri-muted">
            {currentStep === "appointment" ? "Nasabah sedang mengisi janji temu…" : "Menunggu nasabah membuat janji temu."}
          </p>
        )}
      </div>

      <div className="flex-1" />

      {/* Analyst decision */}
      <div className="mt-2 border-t border-bri-line pt-2">
        {autoDecision === "approved" ? (
          <div className="flex flex-col items-start gap-1">
            <span className="flex items-center gap-1.5 rounded-pill bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
              <CheckCircle2 size={14} /> DISETUJUI
            </span>
            <p className="text-[9px] text-bri-muted">Ringkasan penawaran diteruskan ke nasabah.</p>
          </div>
        ) : autoDecision === "rejected" ? (
          <span className="flex w-fit items-center gap-1.5 rounded-pill bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600">
            <XCircle size={14} /> DITOLAK
          </span>
        ) : autoVerify === "rejected" ? (
          <p className="text-[10px] text-bri-muted">BRIF Agent menolak verifikasi — pengajuan tidak dilanjutkan.</p>
        ) : autoVerify === "verified" ? (
          <div className="flex flex-col gap-2">
            <p className="text-[9px] text-bri-muted">Terverifikasi BRIF Agent. Setujui pengajuan KKB ini?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => onDecision("approved")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-[10px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]">
                <CheckCircle2 size={13} /> Setujui
              </button>
              <button type="button" onClick={() => onDecision("rejected")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-red-50 py-2 text-[10px] font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]">
                <XCircle size={13} /> Tolak
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-bri-muted">Menunggu verifikasi BRIF Agent sebelum keputusan analis.</p>
        )}
      </div>
    </div>
  );
}

// ── Kendaraan tab — the full vehicle analysis ─────────────────────────────────

function VehicleTab({
  vehicle,
  calc,
  loan,
  score,
  verdict,
  appointment,
  autoVerify,
  currentStep,
  rm,
}: {
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  loan?: ReturnType<typeof computeAutoLoan>;
  score: number;
  verdict: { label: string; cls: string };
  appointment: AppointmentData;
  autoVerify: AutoVerifyStatus;
  currentStep: FlowStep;
  rm?: ReturnType<typeof assignRm>;
}) {
  if (!vehicle || !loan) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-card border border-bri-line bg-white p-6 text-center shadow-soft">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bri-bg text-bri-blue">
          <Car size={26} />
        </span>
        <p className="text-[12px] font-bold text-bri-navy">Belum ada kendaraan dipilih</p>
        <p className="max-w-sm text-[10px] text-bri-muted">Pilih kendaraan di aplikasi nasabah — valuasi unit, struktur kredit, jadwal angsuran, dan skor kelayakan akan muncul di sini.</p>
      </div>
    );
  }

  const scheme = schemeById(calc.schemeId);
  const years = calc.tenorMonths / 12;
  const resale = Math.round(vehicle.price * Math.pow(0.83, years));
  const depreciationPct = Math.round((1 - resale / vehicle.price) * 100);
  const ltv = Math.round((loan.financed / vehicle.price) * 100);
  const rows = amortYearly(loan.financed, scheme.rate, calc.tenorMonths);
  const booked = appointment.booked;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Card title="Valuasi Kendaraan" icon={TrendingDown}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Harga OTR" value={formatRupiah(vehicle.price)} accent />
            <Stat label={`Estimasi nilai jual (${years} thn)`} value={formatRupiah(resale)} sub={`Depresiasi ±${depreciationPct}%`} />
            <Stat label="Pokok Dibiayai" value={formatRupiah(loan.financed)} sub={`LTV ${ltv}%`} />
            <Stat label="Uang Muka (DP)" value={formatRupiah(loan.dp)} sub={`${Math.round(calc.dpPct * 100)}% dari OTR`} />
          </div>
        </Card>

        <Card title="Struktur Kredit" icon={Wallet}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Angsuran / bulan" value={formatRupiah(loan.angsuran)} accent />
            <Stat label="Tenor" value={`${calc.tenorMonths} bln`} sub={`${years} tahun`} />
            <Stat label="Bunga (efektif p.a.)" value={scheme.rateLabel} sub={scheme.label} />
            <Stat label="Total Bunga" value={formatJuta(loan.totalBunga)} sub={`Total bayar ${formatJuta(loan.totalKeseluruhan)}`} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
        <Card title="Jadwal Angsuran (per Tahun)" icon={CalendarDays}>
          <div className="overflow-hidden rounded-lg border border-bri-line">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-bri-bg text-bri-muted">
                  <th className="px-2 py-1.5 text-left font-semibold">Tahun</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Angsuran/bln</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Pokok</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Bunga</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Sisa Pokok</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.year} className="border-t border-bri-line">
                    <td className="px-2 py-1.5 font-semibold text-bri-ink">Thn {r.year}</td>
                    <td className="px-2 py-1.5 text-right text-bri-ink">{formatRupiah(r.angsuran)}</td>
                    <td className="px-2 py-1.5 text-right text-bri-ink">{formatJuta(r.principal)}</td>
                    <td className="px-2 py-1.5 text-right text-bri-muted">{formatJuta(r.interest)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-bri-blue">{formatJuta(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[9px] text-bri-muted">Skema bunga efektif {scheme.rateLabel} — angsuran tetap, porsi bunga menurun seiring sisa pokok berkurang.</p>
        </Card>

        <Card title="Credit Scoring" icon={Gauge}>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#00529C" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} />
              </svg>
              <span className="absolute text-[16px] font-extrabold text-bri-navy">{score}</span>
            </div>
            <div>
              <span className={cn("rounded-pill px-2.5 py-1 text-[11px] font-bold", verdict.cls)}>{verdict.label}</span>
              <p className="mt-1 text-[9px] text-bri-muted">Skor kredit 9 faktor · sorotan unit (DP, tenor, bunga) di bawah.</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-[10px]">
            <Factor icon={Banknote} label="Uang Muka" value={`${Math.round(calc.dpPct * 100)}%`} good={calc.dpPct >= 0.25} />
            <Factor icon={Clock} label="Tenor" value={`${years} tahun`} good={calc.tenorMonths <= 36} />
            <Factor icon={Percent} label="Bunga" value={scheme.rateLabel} good={scheme.rate <= 0.0525} />
          </div>
        </Card>
      </div>

      <Card title="Janji Temu & Verifikasi BRIF Agent" icon={booked ? ShieldCheck : Clock}>
        {booked ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Detail icon={CalendarDays} label="Tanggal" value={appointment.tanggal} />
              <Detail icon={MapPin} label="Lokasi" value={appointment.lokasi} />
              <Detail icon={Car} label="Nama" value={appointment.nama} />
              <Detail
                icon={Headset}
                label={`BRIF Agent ${rm?.source === "requested" ? "(diminta)" : "(terdekat)"}`}
                value={rm ? rm.name + (rm.city ? ` · ${rm.city}` : "") : undefined}
              />
            </div>
            <VerifyBadge status={autoVerify} />
          </div>
        ) : (
          <p className="text-[11px] text-bri-muted">
            {currentStep === "appointment" ? "Nasabah sedang mengisi data janji temu…" : "Menunggu nasabah menyetujui simulasi & membuat janji temu dengan agen."}
          </p>
        )}
      </Card>
    </div>
  );
}

function VerifyBadge({ status }: { status: AutoVerifyStatus }) {
  if (status === "verified") {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-pill bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
        <CheckCircle2 size={13} /> Terverifikasi BRIF Agent
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-pill bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
        <XCircle size={13} /> Ditolak BRIF Agent
      </span>
    );
  }
  return (
    <span className="flex w-fit items-center gap-1.5 rounded-pill bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
      <Clock size={13} /> Menunggu verifikasi BRIF Agent
    </span>
  );
}

function Factor({ icon: Icon, label, value, good }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-bri-line bg-bri-bg/40 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-bri-ink">
        <Icon size={12} className="text-bri-blue" /> {label}
      </span>
      <span className={cn("rounded-pill px-2 py-px text-[9px] font-bold", good ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{value}</span>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-bri-blue" />
      <span className="text-[10px] text-bri-muted">{label}:</span>
      <span className="text-[11px] font-semibold text-bri-ink">{value || "—"}</span>
    </div>
  );
}
