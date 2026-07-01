"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  MapPin,
  Car,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Inbox,
  Wallet,
  Headset,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import { computeAutoLoan } from "@/lib/autoLoan";
import { schemeById } from "@/data/autoRates";
import { assignRm } from "@/data/relationshipManagers";
import { PhoneMockup } from "../mobile/PhoneMockup";
import { VehiclePhoto } from "../mobile/screens/VehiclePhoto";
import type { Vehicle, AutoLoanCalc, AppointmentData, AutoVerifyStatus } from "@/types/auto";

interface RmAutoAppProps {
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  appointment: AppointmentData;
  autoVerify: AutoVerifyStatus;
  autoVerifyNote?: string;
  onSubmitVerify: (decision: "approved" | "rejected", note?: string) => void;
  /** Lets the RM apply a special discount that re-computes the loan. */
  setAutoLoan: (patch: Partial<AutoLoanCalc>) => void;
}

/** Maximum special discount (%) the RM can grant — bounds the slider & typed input. */
const MAX_DISCOUNT_PCT = 50;

function formatTanggal(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/**
 * RmAutoApp — the Relationship Manager phone for the KKB (auto-loan) flow. When
 * a customer books an appointment it surfaces here ("perlu verifikasi"): the RM
 * confirms the meeting / vehicle / documents and approves or rejects, which is
 * forwarded to the analyst (approve) or back to the customer (reject).
 */
export function RmAutoApp({ vehicle, calc, appointment, autoVerify, autoVerifyNote, onSubmitVerify, setAutoLoan }: RmAutoAppProps) {
  const active = autoVerify !== "none" && !!appointment.booked;
  const decided = autoVerify === "verified" ? "verified" : autoVerify === "rejected" ? "rejected" : "none";
  const scheme = schemeById(calc.schemeId);
  const loan = vehicle ? computeAutoLoan(vehicle.price, calc.dpPct, scheme.rate, calc.tenorMonths, calc.discountPct) : undefined;
  const rm = assignRm(appointment);
  const discountPct = calc.discountPct ?? 0;

  const [note, setNote] = useState("");
  useEffect(() => {
    if (active && decided === "none") setNote("");
  }, [active, decided]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        <PhoneMockup>
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-bri-line bg-bri-navy px-3 py-2 text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-white/15"><UserCheck size={12} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold leading-tight">BRIF Agent</p>
              <p className="text-[8px] text-white/70">Verifikasi Janji Temu KKB · NILAM</p>
            </div>
            {active && decided === "none" && (
              <span className="animate-pulse rounded-pill bg-amber-400/20 px-2 py-0.5 text-[8px] font-semibold text-amber-100">perlu verifikasi</span>
            )}
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin px-3 py-2.5">
            {!active ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bri-bg">
                  <Inbox size={26} className="text-bri-muted/60" />
                </div>
                <p className="text-[11px] font-bold text-bri-ink">Belum ada janji temu</p>
                <p className="text-[9px] leading-relaxed text-bri-muted">
                  Janji temu KKB dari nasabah akan muncul di sini untuk diverifikasi.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="mb-0.5">
                  <h2 className="text-[12px] font-bold text-bri-ink">Janji Temu Masuk</h2>
                  <p className="text-[8px] text-bri-muted">Verifikasi pertemuan & kelengkapan berkas</p>
                </div>

                {/* Vehicle */}
                {vehicle && (
                  <div className="flex items-center gap-2 rounded-lg border border-bri-line bg-bri-bg/40 p-1.5">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                      <VehiclePhoto vehicle={vehicle} iconSize={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-bri-ink">{vehicle.fullName}</p>
                      <p className="text-[8px] text-bri-muted">{formatRupiah(vehicle.price)} · {vehicle.category}</p>
                    </div>
                  </div>
                )}

                {/* Appointment facts */}
                <div className="flex flex-col gap-1 rounded-lg border border-bri-line bg-white px-2.5 py-2">
                  <Row icon={UserCheck} label="Nama" value={appointment.nama} />
                  <Row icon={CalendarDays} label="Tanggal" value={formatTanggal(appointment.tanggal)} />
                  <Row icon={MapPin} label="Lokasi" value={appointment.lokasi} />
                </div>

                {/* RM assignment (requested by customer or nearest-by-location) */}
                {rm && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-bri-blue/30 bg-bri-blue/5 px-2.5 py-1.5">
                    <Headset size={12} className="shrink-0 text-bri-blue" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] text-bri-muted">
                        Ditugaskan ke BRIF Agent {rm.source === "requested" ? "(diminta nasabah)" : "(terdekat otomatis)"}
                      </p>
                      <p className="truncate text-[10px] font-bold text-bri-ink">
                        {rm.name}
                        {rm.branch && <span className="font-normal text-bri-muted"> · {rm.branch}</span>}
                      </p>
                      {rm.source === "nearest" && rm.distanceKm != null && (
                        <p className="text-[8px] text-bri-muted">{rm.city} · ~{rm.distanceKm} km dari lokasi</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Deal */}
                {loan && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <Fact label="DP" value={formatRupiah(loan.dp)} />
                    <Fact label="Pokok Dibiayai" value={formatRupiah(loan.financed)} />
                    <Fact label="Tenor" value={`${calc.tenorMonths / 12} thn`} />
                    <Fact label="Angsuran/bln" value={formatRupiah(loan.angsuran)} accent />
                  </div>
                )}

                {/* Special discount — RM-adjustable (slider or typed %); re-computes the loan everywhere.
                    Locked once the RM has decided, so a later edit can't retroactively change an
                    already-approved/rejected deal. */}
                {vehicle && (
                  <div className={cn("rounded-xl border border-bri-line bg-white px-2.5 py-2", decided !== "none" && "opacity-60")}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
                        <Tag size={10} className="text-bri-blue" /> Diskon Khusus
                        {decided !== "none" && <span className="text-[8px] font-normal normal-case text-bri-muted">(terkunci)</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label="Diskon (%)"
                          value={Math.round(discountPct * 100)}
                          disabled={decided !== "none"}
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                            setAutoLoan({ discountPct: Math.max(0, Math.min(MAX_DISCOUNT_PCT, n)) / 100 });
                          }}
                          className="w-9 rounded border border-bri-line bg-white px-1 py-0.5 text-right text-[10px] font-bold text-bri-blue tabular-nums outline-none focus:border-bri-blue disabled:cursor-not-allowed"
                        />
                        <span className="text-[10px] font-bold text-bri-blue">%</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={MAX_DISCOUNT_PCT}
                      step={1}
                      value={Math.min(MAX_DISCOUNT_PCT, Math.round(discountPct * 100))}
                      disabled={decided !== "none"}
                      onChange={(e) => setAutoLoan({ discountPct: Number(e.target.value) / 100 })}
                      className="w-full accent-bri-blue disabled:cursor-not-allowed"
                    />
                    {loan && loan.discount > 0 && (
                      <p className="mt-1 text-[8px] text-emerald-600">
                        Potongan {formatJuta(loan.discount)} → harga {formatJuta(loan.netPrice)} · angsuran {formatRupiah(loan.angsuran)}/bln
                      </p>
                    )}
                  </div>
                )}

                {decided === "none" ? (
                  <div className="rounded-xl border border-bri-line bg-white px-2.5 py-2">
                    <p className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
                      <ClipboardCheck size={10} /> Hasil Verifikasi
                    </p>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-medium text-bri-muted">Catatan BRIF Agent</span>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="nasabah hadir, unit & berkas sesuai…"
                        className="rounded-lg border border-bri-line bg-white px-2 py-1 text-[10px] text-bri-ink outline-none focus:border-bri-blue"
                      />
                    </label>
                    <div className="mt-2.5 flex gap-2">
                      <button type="button" onClick={() => onSubmitVerify("approved", note.trim() || undefined)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-[10px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]">
                        <CheckCircle2 size={13} /> Verifikasi
                      </button>
                      <button type="button" onClick={() => onSubmitVerify("rejected", note.trim() || undefined)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-50 py-2 text-[10px] font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]">
                        <XCircle size={13} /> Tolak
                      </button>
                    </div>
                    <p className="mt-1.5 text-center text-[8px] text-bri-muted">Hasil diteruskan ke analis & nasabah.</p>
                  </div>
                ) : (
                  <div className={cn("rounded-xl border px-2.5 py-2", decided === "verified" ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60")}>
                    <p className="flex items-center gap-1 text-[10px] font-bold">
                      {decided === "verified" ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-red-500" />}
                      <span className={decided === "verified" ? "text-emerald-700" : "text-red-600"}>
                        {decided === "verified" ? "Terverifikasi" : "Verifikasi Ditolak"}
                      </span>
                    </p>
                    {autoVerifyNote && <p className="mt-0.5 text-[8.5px] text-bri-muted">“{autoVerifyNote}”</p>}
                    <p className="mt-1 text-[8px] text-bri-muted">
                      {decided === "verified" ? "Diteruskan ke analis untuk persetujuan akhir." : "Nasabah menerima pemberitahuan penolakan."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </PhoneMockup>
      </div>
      {/* Bottom bar — match the nasabah stepper height */}
      <div className="flex h-[60px] shrink-0 flex-col items-center justify-center border-t border-bri-line bg-white px-3">
        <span className="flex items-center gap-1.5 text-bri-muted">
          <UserCheck size={13} />
          <span className="text-[9px] font-medium">Verifikasi KKB · BRIF Agent</span>
        </span>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={10} className="shrink-0 text-bri-blue" />
      <span className="text-[8px] text-bri-muted">{label}:</span>
      <span className="truncate text-[9.5px] font-semibold text-bri-ink">{value || "—"}</span>
    </div>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-bri-line bg-bri-bg/40 px-2 py-1.5">
      <p className="flex items-center gap-1 text-[8px] text-bri-muted"><Wallet size={9} /> {label}</p>
      <p className={cn("text-[11px] font-bold tabular-nums", accent ? "text-bri-blue" : "text-bri-navy")}>{value}</p>
    </div>
  );
}
