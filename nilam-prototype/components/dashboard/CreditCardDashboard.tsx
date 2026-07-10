"use client";

import { useState } from "react";
import {
  CreditCard as CardIcon,
  Wallet,
  Gauge,
  CheckCircle2,
  Calculator,
  AlertTriangle,
  Sparkles,
  BadgePercent,
  Wifi,
  MapPin,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import { computeCreditScore } from "@/engines/scoring/creditScore";
import { usiaDariKtp } from "@/lib/usia";
import { recommendedLimit, minMonthlyCharge } from "@/lib/creditCard";
import {
  computeCardMaxLimit,
  addressGeo,
  txnBehaviorGeoService,
  MONTHLY_TXN,
  MONTHLY_SUMMARY,
} from "@/lib/cardAnalytics";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { incomePartsFromOcr, kemampuanBayar, penghasilanBulanan, dirRate } from "@/lib/kemampuan";
import { deriveDocumentStatuses } from "@/data/documents";
import { EMPLOYMENT_AGREEMENT } from "@/data/profileFixtures";
import { SLIK_LOANS, SLIK_TOTAL_ANGSURAN } from "@/data/slikLoansFixtures";
import type { NodeId, NodeStatus } from "@/types/orchestration";
import type { FlowStep } from "@/types/flow";
import type { CreditCard, CardDecisionStatus } from "@/types/card";
import type { OcrResults, PreviewDoc } from "@/types/ocrExtract";
import type { SlikReport, EmploymentAgreement } from "@/types/profile";
import type { UserInput } from "@/types/userInput";

import { UploadedDocsStrip } from "./UploadedDocsStrip";
import { UserInformationCard } from "./UserInformationCard";
import { EmploymentAgreementCard } from "./EmploymentAgreementCard";
import { MatchingCard } from "./MatchingCard";
import { SlikOjkCard } from "./SlikOjkCard";
import { PreviewDocsCard } from "./PreviewDocsCard";
import { GeoRadiusCard } from "./GeoRadiusCard";
import { CardLimitCalcCard } from "./CardLimitCalcCard";
import { CardVisual } from "../mobile/screens/CardVisual";
import { TxnAverageCard } from "./TxnAverageCard";

const BIG_TABS = [
  { id: "summary", label: "Summary" },
  { id: "transaksi", label: "Detail Transaksi" },
  { id: "slik", label: "Detail SLIK" },
  { id: "kartu", label: "Kartu" },
  { id: "preview", label: "Preview Dokumen" },
] as const;
type BigTab = (typeof BIG_TABS)[number]["id"];

interface CreditCardDashboardProps {
  currentStep: FlowStep;
  /** Chosen card product (null until the customer picks one). */
  card?: CreditCard;
  /** Requested credit limit (IDR). */
  cardLimit: number;
  /** Analyst decision stage — gates the Setujui/Tolak buttons. */
  cardDecision: CardDecisionStatus;
  /** Analyst approves/rejects the card application; on approval passes the granted limit. */
  onDecision: (decision: "approved" | "rejected", grantedLimit?: number) => void;
  // ── Borrower analysis (shared with the KKB dashboard) ──
  uploads: Record<string, boolean>;
  ocr: OcrResults;
  slik?: SlikReport;
  userInput?: UserInput;
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

// ── main ─────────────────────────────────────────────────────────────────────

/**
 * CreditCardDashboard — the "Behind The Scene" analyst panel for the credit-card
 * flow. Reuses the KKB dashboard's borrower analysis (user info, employment,
 * income matching, SLIK, document preview, credit score) with the financed asset
 * replaced by the card application (chosen product + requested limit) and a
 * straight Credit Analyst decision (no RM verification).
 */
export function CreditCardDashboard({
  currentStep,
  card,
  cardLimit,
  cardDecision,
  onDecision,
  uploads,
  ocr,
  slik,
  userInput,
  previewDocs,
}: CreditCardDashboardProps) {
  const [tab, setTab] = useState<BigTab>("summary");
  // Real device geolocation for the domicile radius (falls back to the address
  // estimate until the browser resolves / permission is granted).
  const geo = useCurrentLocation();

  // Card "ready" state derived from data presence (no orchestration pipeline).
  const dataReady = !!(ocr.ktp || ocr.kk || ocr.slipGaji || ocr.mutasi || ocr.skPerusahaan);
  const docStatus: NodeStatus = dataReady ? "success" : "idle";
  const statusOf = (_: NodeId): NodeStatus => docStatus;
  const docStatuses = deriveDocumentStatuses(statusOf, uploads);

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

  const income = incomePartsFromOcr(ocr);
  const slikLoans = slik?.loans ?? SLIK_LOANS;
  const slikTotalAngsuran = slik?.totalAngsuran ?? SLIK_TOTAL_ANGSURAN;

  const age = usiaDariKtp(ocr.ktp?.tanggalLahir);
  const slipThp = ocr.slipGaji?.records?.find((r) => r.thp != null)?.thp;
  const monthlyIncome = slipThp ?? ocr.mutasi?.gajiNominal ?? income.gajiBulanan ?? 0;
  const punyaSimpananBri = !!ocr.mutasi || slikLoans.some((l) => /bri|rakyat indonesia/i.test(l.lembaga));

  // Credit Scoring (9 factors) — the shared engine, profile + income/SLIK driven.
  // The card has no tenor/DP/collateral, so those factors fall back to neutral.
  const creditResult = computeCreditScore({
    pendidikan: userInput?.pendidikan,
    statusKawin: userInput?.statusKawin ?? ocr.ktp?.statusPerkawinan,
    usia: userInput?.usia ?? age,
    punyaSimpananBri,
    jumlahTanggungan: userInput?.jumlahTanggungan,
    incomeMonthly: monthlyIncome,
    angsuranBulanan: slikTotalAngsuran,
  });
  const score = creditResult.score;
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

  const recommended = card ? recommendedLimit(card, monthlyIncome) : 0;
  const kemampuan = kemampuanBayar(income.gajiBulanan, income.thrTahunan, income.bonusTahunan, slikTotalAngsuran);

  // ── DUMMY credit-card analytics (see lib/cardAnalytics.ts) ──────────────────
  const monthly = MONTHLY_TXN;
  const txnSummary = MONTHLY_SUMMARY;
  // Fall back to a nominal income so the max-limit demo is non-zero pre-upload.
  const incomeForLimit = monthlyIncome > 0 ? monthlyIncome : 12_000_000;
  const limitBreakdown = computeCardMaxLimit({
    applicationScore: score,
    monthlyIncome: incomeForLimit,
    slikAngsuran: slikTotalAngsuran,
    creditTxnAvg30d: txnSummary.avgMonthlyCredit,
    debitTxnAvg30d: txnSummary.avgMonthlyDebit,
  });
  // Domicile radius = the customer's REGISTERED address (KTP alamat, or the KK /
  // user-input fallback), reverse-geocoded to a coordinate. Static — independent
  // of the device's current location.
  const domisiliPoint = addressGeo(ocr.ktp?.alamat ?? ocr.kk?.alamat);
  // BRI-activity radius = where the customer is actually active. Uses the device's
  // REAL geolocation once resolved; until then (or if permission is denied) it
  // falls back to the transaction-behaviour estimate keyed off the NIK.
  const geoLive = geo.status === "ok" && geo.point != null;
  const aktivitasPoint = geo.point ?? txnBehaviorGeoService(ocr.ktp?.nik);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto scroll-thin bg-[#F5F7FA] p-3">
      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-card border border-bri-line bg-white px-4 py-3 shadow-soft">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg text-white"
            style={card?.image ? undefined : { background: card?.gradient ?? "linear-gradient(135deg,#94A3B8,#CBD5E1)" }}
          >
            {card?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.image} alt={`Kartu ${card.name}`} className="h-full w-full object-cover" />
            ) : card ? (
              <Wifi size={18} className="rotate-90 text-white/80" />
            ) : (
              <CardIcon size={22} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Pengajuan Kartu Kredit</p>
            <p className="text-[15px] font-bold text-bri-navy">
              {card ? card.name : cardDecision === "approved" ? "Limit disetujui — memilih kartu…" : "Peninjauan Limit oleh Analis"}
            </p>
          </div>
        </div>
        {dataReady && (
          <div className="flex items-center gap-2">
            <span className={cn("rounded-pill px-3 py-1 text-[11px] font-bold", verdict.cls)}>{verdict.label}</span>
            <span className="rounded-pill bg-bri-bg px-3 py-1 text-[11px] font-semibold text-bri-ink">Skor {score}</span>
          </div>
        )}
      </div>

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
                  <CardCapacityCard
                    status={docStatus}
                    gajiBulanan={income.gajiBulanan}
                    thrTahunan={income.thrTahunan}
                    bonusTahunan={income.bonusTahunan}
                    slikAngsuran={slikTotalAngsuran}
                    card={card}
                    cardLimit={cardLimit}
                  />
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 items-start gap-3">
            <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={score} view="summary" />
            <GeoRadiusCard
              title="Radius Domisili"
              icon={MapPin}
              subtitle="Estimasi dari alamat KTP / input nasabah."
              point={domisiliPoint}
              dummy
            />
            <GeoRadiusCard
              title="Radius Aktivitas BRI"
              icon={Compass}
              subtitle={
                geoLive
                  ? "Lokasi nyata perangkat (GPS), di-reverse-geocode."
                  : geo.status === "locating"
                  ? "Mengambil lokasi perangkat…"
                  : geo.status === "denied" || geo.status === "unsupported"
                  ? "Izin lokasi tidak tersedia — estimasi perilaku transaksi."
                  : "Estimasi dari perilaku transaksi."
              }
              point={aktivitasPoint}
              badge={geoLive ? "LIVE GPS" : undefined}
              badgeTone="emerald"
              dummy={!geoLive}
            />
          </div>

          {/* Analyst-first: maximum-limit calculation + granted limit + decision */}
          <CardLimitCalcCard
            breakdown={limitBreakdown}
            cardDecision={cardDecision}
            onDecision={onDecision}
            currentStep={currentStep}
          />
        </div>
      )}

      {/* ── DETAIL TRANSAKSI ───────────────────────────────────────────── */}
      {tab === "transaksi" && (
        <div className="flex flex-col gap-3">
          <TxnAverageCard months={monthly} summary={txnSummary} />
          <MatchingCard
            status={docStatus}
            mutasi={ocr.mutasi}
            slip={ocr.slipGaji}
            missing={!uploads.slip_gaji || !uploads.mutasi}
            mode="transaksi"
          />
        </div>
      )}

      {/* ── DETAIL SLIK ────────────────────────────────────────────────── */}
      {tab === "slik" && (
        <div className="flex flex-col gap-3">
          <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={score} view="detail" />
          <SlikOjkCard status={docStatus} loans={slikLoans} totalAngsuran={slikTotalAngsuran} score={score} view="tunggakan" />
        </div>
      )}

      {/* ── KARTU ──────────────────────────────────────────────────────── */}
      {tab === "kartu" && (
        <CardTab card={card} cardLimit={cardLimit} recommended={recommended} score={score} verdict={verdict} kemampuan={kemampuan} />
      )}

      {/* ── PREVIEW DOKUMEN ────────────────────────────────────────────── */}
      {tab === "preview" && <PreviewDocsCard docs={previewDocs ?? []} />}
    </div>
  );
}

// ── Income capacity (navy gradient) — capacity vs the requested limit ─────────

function CardCapacityCard({
  status,
  gajiBulanan,
  thrTahunan,
  bonusTahunan,
  slikAngsuran,
  card,
  cardLimit,
}: {
  status: NodeStatus;
  gajiBulanan: number;
  thrTahunan: number;
  bonusTahunan: number;
  slikAngsuran: number;
  card?: CreditCard;
  cardLimit: number;
}) {
  const ready = status === "success";
  const penghasilan = penghasilanBulanan(gajiBulanan, thrTahunan, bonusTahunan);
  const dir = dirRate(penghasilan);
  const kemampuan = kemampuanBayar(gajiBulanan, thrTahunan, bonusTahunan, slikAngsuran);
  // Illustrative min. monthly charge if the limit were fully drawn.
  const charge = card ? minMonthlyCharge(card, cardLimit) : undefined;
  const layak = charge != null ? charge <= kemampuan : undefined;

  return (
    <div className="rounded-xl border border-bri-navy/30 px-3 py-2.5 shadow-soft" style={{ background: "linear-gradient(135deg, #00305C 0%, #00529C 100%)" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Calculator size={11} className="text-white" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80">Perhitungan Kemampuan Bayar</span>
        </div>
        <span className="rounded-pill bg-white/15 px-2 py-0.5 text-[7.5px] font-semibold text-white/90">vs Beban Kartu</span>
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
                {layak ? "Beban kartu terjangkau" : "Beban kartu melebihi kemampuan"}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <CapRow label="Gaji / bulan" value={formatRupiah(gajiBulanan)} />
            <CapRow label="THR / 12" value={`+ ${formatRupiah(Math.round(thrTahunan / 12))}`} />
            <CapRow label="Bonus / 12" value={`+ ${formatRupiah(Math.round(bonusTahunan / 12))}`} />
            <div className="my-0.5 border-t border-white/20" />
            <CapRow label="Penghasilan / bln" value={formatRupiah(Math.round(penghasilan))} />
            <CapRow label="Angsuran SLIK (aktif)" value={`− ${formatRupiah(slikAngsuran)}`} />
            <CapRow label="× DIR (sesuai penghasilan)" value={`${Math.round(dir * 100)}%`} />
            <div className="my-0.5 border-t border-white/20" />
            <CapRow label="Kemampuan Bayar" value={formatRupiah(kemampuan)} strong />
            {charge != null && (
              <CapRow label="Est. beban kartu / bln" value={formatRupiah(charge)} className={layak ? "text-emerald-200" : "text-red-200"} />
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

// ── Kartu tab — full card analysis ────────────────────────────────────────────

function CardTab({
  card,
  cardLimit,
  recommended,
  score,
  verdict,
  kemampuan,
}: {
  card?: CreditCard;
  cardLimit: number;
  recommended: number;
  score: number;
  verdict: { label: string; cls: string };
  kemampuan: number;
}) {
  if (!card) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-card border border-bri-line bg-white p-6 text-center shadow-soft">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bri-bg text-bri-blue">
          <CardIcon size={26} />
        </span>
        <p className="text-[12px] font-bold text-bri-navy">Belum ada kartu dipilih</p>
        <p className="max-w-sm text-[10px] text-bri-muted">Pilih kartu di aplikasi nasabah — spesifikasi kartu, limit, dan skor kelayakan akan muncul di sini.</p>
      </div>
    );
  }

  const charge = minMonthlyCharge(card, cardLimit);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Card title="Kartu Dipilih" icon={CardIcon}>
          <CardVisual card={card} className="mb-3 rounded-xl" />
          <p className="text-[10px] text-bri-muted">{card.tagline}</p>
          <div className="mt-2 flex flex-col gap-1">
            {card.benefits.map((b) => (
              <div key={b} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-bri-ink/85">
                <Sparkles size={11} className="mt-0.5 shrink-0 text-bri-blue" /> {b}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card title="Struktur & Limit" icon={Wallet}>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Limit Diminta" value={formatRupiah(cardLimit)} accent />
              <Stat label="Rekomendasi" value={formatRupiah(recommended)} sub={cardLimit > recommended ? "di atas rekomendasi" : "dalam rekomendasi"} />
              <Stat label="Iuran Tahunan" value={card.annualFee === 0 ? "Gratis" : formatRupiah(card.annualFee)} sub={card.annualFeeNote} />
              <Stat label="Est. beban / bln" value={formatRupiah(charge)} sub={`bunga ${(card.interestMonthly * 100).toLocaleString("id-ID")}%`} />
            </div>
          </Card>

          <Card title="Credit Scoring" icon={Gauge}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#00529C" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} />
                </svg>
                <span className="absolute text-[16px] font-extrabold text-bri-navy">{score}</span>
              </div>
              <div className="min-w-0">
                <span className={cn("rounded-pill px-2.5 py-1 text-[11px] font-bold", verdict.cls)}>{verdict.label}</span>
                <p className="mt-1 flex items-center gap-1 text-[9px] text-bri-muted"><BadgePercent size={11} className="text-bri-blue" /> Skor kredit 9 faktor.</p>
                <p className="mt-1 text-[9px] text-bri-muted">Kemampuan bayar/bln: <span className="font-semibold text-bri-ink">{formatRupiah(kemampuan)}</span></p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
