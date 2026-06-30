"use client";

import { CheckCircle2, XCircle, MapPin, CalendarDays, User, Car, Loader2, ShieldCheck, Gavel, Sparkles, Headset } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { computeAutoLoan } from "@/lib/autoLoan";
import { schemeById } from "@/data/autoRates";
import { assignRm } from "@/data/relationshipManagers";
import type { Vehicle, AutoLoanCalc, AppointmentData, AutoVerifyStatus, AutoDecisionStatus } from "@/types/auto";

interface AppointmentDoneScreenProps {
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  appointment: AppointmentData;
  autoVerify: AutoVerifyStatus;
  autoDecision: AutoDecisionStatus;
  autoVerifyNote?: string;
  onFinish: () => void;
}

function formatTanggal(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={11} className="mt-0.5 shrink-0 text-bri-blue" />
      <div className="min-w-0 flex-1">
        <p className="text-[7.5px] uppercase tracking-[0.1em] text-bri-muted">{label}</p>
        <p className="text-[10px] font-semibold text-bri-ink">{value || "—"}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] text-bri-muted">{label}</span>
      <span className={cn("text-[11px] font-bold tabular-nums", accent ? "text-bri-blue" : "text-bri-ink")}>{value}</span>
    </div>
  );
}

/** Two-step waiting indicator (RM verification → analyst approval). */
function WaitingView({ stage, nama }: { stage: "rm" | "analyst"; nama?: string }) {
  const steps = [
    { id: "rm", icon: ShieldCheck, label: "Verifikasi BRIF Agent" },
    { id: "analyst", icon: Gavel, label: "Persetujuan Analis" },
  ] as const;
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <Loader2 size={64} className="absolute animate-spin text-bri-blue/30" strokeWidth={1.5} />
        <CheckCircle2 size={26} className="text-emerald-500" />
      </div>
      <h2 className="mt-3 text-[13px] font-bold text-bri-ink">Janji Temu Terkonfirmasi</h2>
      <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
        Terima kasih{nama ? `, ${nama.split(" ")[0]}` : ""}! Pengajuan KKB Anda sedang diproses.
      </p>
      <div className="mt-4 flex w-full max-w-[220px] flex-col gap-2">
        {steps.map((s) => {
          const done = stage === "analyst" && s.id === "rm";
          const activeStep = s.id === stage;
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left",
                done ? "border-emerald-200 bg-emerald-50/60" : activeStep ? "border-bri-blue bg-bri-blue/5" : "border-bri-line bg-white",
              )}
            >
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", done ? "bg-emerald-100 text-emerald-600" : activeStep ? "bg-bri-blue/10 text-bri-blue" : "bg-bri-bg text-bri-muted")}>
                {done ? <CheckCircle2 size={13} /> : activeStep ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
              </span>
              <span className={cn("text-[9px] font-semibold", done ? "text-emerald-700" : activeStep ? "text-bri-blue" : "text-bri-muted")}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[8px] text-bri-muted">Status diperbarui otomatis setelah tim kami memproses.</p>
    </div>
  );
}

/**
 * AppointmentDoneScreen — status-driven terminal screen for the KKB flow:
 *   waiting (RM)      → waiting for Relationship Manager verification
 *   waiting (analyst) → verified, waiting for analyst approval
 *   approved          → final summary of what the customer gets
 *   rejected          → rejection notice
 */
export function AppointmentDoneScreen({ vehicle, calc, appointment, autoVerify, autoDecision, autoVerifyNote, onFinish }: AppointmentDoneScreenProps) {
  const scheme = schemeById(calc.schemeId);
  const loan = vehicle ? computeAutoLoan(vehicle.price, calc.dpPct, scheme.rate, calc.tenorMonths, calc.discountPct) : undefined;
  const rm = assignRm(appointment);

  const rejected = autoVerify === "rejected" || autoDecision === "rejected";
  const approved = autoDecision === "approved";

  // ── Waiting states ──────────────────────────────────────────────────────
  if (!rejected && !approved) {
    return <WaitingView stage={autoVerify === "verified" ? "analyst" : "rm"} nama={appointment.nama} />;
  }

  // ── Rejected ────────────────────────────────────────────────────────────
  if (rejected) {
    const byRm = autoVerify === "rejected";
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle size={32} className="text-red-500" strokeWidth={2} />
          </div>
          <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Pengajuan Belum Disetujui</h2>
          <p className="mt-1 text-[9px] leading-relaxed text-bri-muted">
            Mohon maaf, pengajuan KKB Anda {byRm ? "tidak lolos verifikasi BRIF Agent" : "belum disetujui analis"} saat ini.
          </p>
        </div>
        {byRm && autoVerifyNote && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-red-500">Catatan BRIF Agent</p>
            <p className="mt-0.5 text-[10px] text-bri-ink">“{autoVerifyNote}”</p>
          </div>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onFinish} className="mt-3 w-full rounded-bubble border border-bri-line py-2.5 text-[12px] font-semibold text-bri-ink transition-colors hover:bg-bri-bg">
          Kembali ke Awal
        </button>
      </div>
    );
  }

  // ── Approved — the "what you get" summary ───────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2} />
        </div>
        <h2 className="mt-2 text-[13px] font-bold text-bri-ink">Selamat! Pengajuan Disetujui</h2>
        <p className="mt-0.5 text-[9px] leading-relaxed text-bri-muted">
          Disetujui BRIF Agent &amp; Analis. Berikut ringkasan KKB yang Anda dapatkan.
        </p>
      </div>

      {/* Vehicle */}
      {vehicle && loan && (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-bri-line bg-bri-bg/50 p-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bri-blue/10 text-bri-blue">
              <Car size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold text-bri-ink">{vehicle.fullName}</p>
              <p className="text-[7.5px] text-bri-muted">{vehicle.category} · {formatRupiah(vehicle.price)}</p>
            </div>
          </div>

          {/* Headline installment */}
          <div className="mt-2 rounded-2xl bg-bri-navy px-3 py-2.5 text-white">
            <div className="flex items-end justify-between">
              <span className="text-[8px] uppercase tracking-[0.1em] text-white/70">Angsuran / bulan</span>
              <span className="text-[18px] font-extrabold leading-none">{formatRupiah(loan.angsuran)}</span>
            </div>
            <p className="mt-1 text-[8px] text-white/60">{calc.tenorMonths / 12} tahun · {scheme.rateLabel} efektif p.a.</p>
          </div>

          {/* What you get */}
          <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-bri-line bg-white p-2.5">
            <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
              <Sparkles size={10} className="text-bri-blue" /> Yang Anda Dapatkan
            </p>
            <SummaryRow label="Harga Kendaraan (OTR)" value={formatRupiah(vehicle.price)} />
            {loan.discount > 0 && (
              <>
                <SummaryRow label={`Diskon (${Math.round(loan.discountPct * 100)}%)`} value={`− ${formatRupiah(loan.discount)}`} />
                <SummaryRow label="Harga Setelah Diskon" value={formatRupiah(loan.netPrice)} />
              </>
            )}
            <SummaryRow label="Uang Muka (DP)" value={`${formatRupiah(loan.dp)} · ${Math.round(calc.dpPct * 100)}%`} />
            <SummaryRow label="Pokok Dibiayai BRI" value={formatRupiah(loan.financed)} accent />
            <SummaryRow label="Tenor" value={`${calc.tenorMonths} bln (${calc.tenorMonths / 12} thn)`} />
            <SummaryRow label="Suku Bunga" value={`${scheme.rateLabel} (${scheme.label})`} />
            <div className="my-0.5 border-t border-bri-line/70" />
            <SummaryRow label="Total Bunga" value={formatRupiah(loan.totalBunga)} />
            <SummaryRow label="Total Pembayaran" value={formatRupiah(loan.totalKeseluruhan)} />
          </div>
        </>
      )}

      {/* Appointment recap */}
      <div className="mt-2 flex flex-col gap-2 rounded-xl border border-bri-line bg-white p-2.5">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Janji Temu Agen</p>
        <Row icon={CalendarDays} label="Tanggal" value={formatTanggal(appointment.tanggal)} />
        <Row icon={MapPin} label="Lokasi" value={appointment.lokasi} />
        <Row icon={User} label="Nama" value={appointment.nama} />
        <Row
          icon={Headset}
          label="BRIF Agent"
          value={rm ? rm.name + (rm.branch ? ` · ${rm.branch}` : "") : undefined}
        />
      </div>

      <p className="mt-2 text-center text-[8px] leading-relaxed text-bri-muted">
        Agen BRI akan menghubungi Anda untuk penandatanganan akad &amp; serah terima unit.
      </p>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onFinish}
        className="mt-3 w-full rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" }}
      >
        Selesai
      </button>
    </div>
  );
}
