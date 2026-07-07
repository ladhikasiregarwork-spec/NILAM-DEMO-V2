"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Wifi, Sparkles, Truck, CreditCard as CardIcon, Info } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import type { CreditCard } from "@/types/card";

interface CardDoneScreenProps {
  card?: CreditCard;
  /** Final approved credit limit (IDR). */
  limit: number;
  nama?: string;
  onFinish: () => void;
}

const ID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtID = (d: Date) => `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** Add N working days (skip Sat/Sun) to a date. */
function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

/**
 * CardDoneScreen — closing page for the credit-card flow. Summarizes the issued
 * card (product, limit, fees, benefits) and the estimated physical-card arrival.
 * The arrival window is computed client-side (useEffect) to avoid an SSR/client
 * hydration mismatch on the current date.
 */
export function CardDoneScreen({ card, limit, nama, onFinish }: CardDoneScreenProps) {
  const [eta, setEta] = useState<{ from: string; to: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    setEta({ from: fmtID(addWorkingDays(now, 5)), to: fmtID(addWorkingDays(now, 7)) });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-3">
      {/* Success header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2} />
        </div>
        <h2 className="mt-2 text-[14px] font-bold text-bri-ink">Kartu Berhasil Diterbitkan</h2>
        <p className="mt-0.5 text-[9px] leading-relaxed text-bri-muted">
          Selamat{nama ? `, ${nama.split(" ")[0]}` : ""}! {card?.name ?? "Kartu kredit"} Anda telah disetujui &amp; sedang diproses.
        </p>
      </div>

      {/* Card visual */}
      {card && (
        <div
          className="mt-3 flex h-28 w-full shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-3 text-white shadow-soft"
          style={{ background: card.gradient }}
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">{card.name}</span>
            <Wifi size={15} className="rotate-90 text-white/70" />
          </div>
          <div className="h-5 w-7 rounded bg-white/25" />
          <div className="flex items-end justify-between">
            <span className="font-mono text-[11px] tracking-[0.18em] text-white/85">•••• •••• •••• 8021</span>
            <span className="text-[10px] font-bold italic text-white/90">{card.network}</span>
          </div>
        </div>
      )}

      {/* Ringkasan kartu */}
      <div className="mt-2 rounded-2xl border border-bri-line bg-white p-2.5 shadow-soft">
        <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-bri-muted">
          <CardIcon size={11} className="text-bri-blue" /> Ringkasan Kartu Kredit
        </p>
        <div className="flex flex-col gap-1">
          <Row label="Produk" value={card?.name ?? "—"} />
          <Row label="Jaringan" value={card?.network ?? "—"} />
          <Row label="Limit Disetujui" value={formatRupiah(limit)} strong />
          <Row label="Iuran Tahunan" value={card ? (card.annualFee === 0 ? "Gratis" : formatRupiah(card.annualFee)) : "—"} sub={card?.annualFeeNote} />
          <Row label="Bunga / bulan" value={card ? `${(card.interestMonthly * 100).toLocaleString("id-ID")}%` : "—"} />
        </div>
      </div>

      {/* Estimasi kedatangan kartu */}
      <div className="mt-2 rounded-2xl border border-bri-blue/25 bg-bri-blue/5 p-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bri-blue/10 text-bri-blue">
            <Truck size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-bri-blue">Estimasi Kartu Tiba</p>
            <p className="text-[12px] font-extrabold leading-tight text-bri-ink">5–7 hari kerja</p>
          </div>
        </div>
        <p className="mt-1.5 text-[8.5px] leading-relaxed text-bri-muted">
          {eta
            ? <>Perkiraan tiba di alamat Anda antara <b className="text-bri-ink">{eta.from}</b> – <b className="text-bri-ink">{eta.to}</b>.</>
            : "Perkiraan tiba di alamat terdaftar Anda."}{" "}
          Kurir akan menghubungi Anda sebelum pengiriman.
        </p>
      </div>

      {/* Benefits */}
      {card && card.benefits.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 rounded-xl border border-bri-line bg-white p-2.5">
          <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
            <Sparkles size={10} className="text-bri-blue" /> Keuntungan Kartu Anda
          </p>
          {card.benefits.map((b) => (
            <div key={b} className="flex items-start gap-1.5 text-[9px] leading-relaxed text-bri-ink/85">
              <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" /> {b}
            </div>
          ))}
        </div>
      )}

      {/* Activation note */}
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-bri-bg/60 px-2.5 py-1.5">
        <Info size={11} className="mt-0.5 shrink-0 text-bri-blue" />
        <p className="text-[8px] leading-relaxed text-bri-muted">
          Aktifkan kartu melalui <b className="text-bri-ink">BRImo</b> setelah kartu fisik diterima, lalu buat PIN untuk mulai bertransaksi.
        </p>
      </div>

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

function Row({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-[9px] text-bri-muted">{label}</span>
      <span className="text-right">
        <span className={strong ? "text-[11px] font-bold text-bri-blue" : "text-[9.5px] font-medium text-bri-ink"}>{value}</span>
        {sub && <span className="block text-[7.5px] text-bri-muted">{sub}</span>}
      </span>
    </div>
  );
}
