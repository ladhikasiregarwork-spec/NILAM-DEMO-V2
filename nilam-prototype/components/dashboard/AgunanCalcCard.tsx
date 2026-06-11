"use client";

import { useState } from "react";
import { Home, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { computeNpw } from "@/engines/npw/npwModel";
import {
  ltvBaru, ltvLama, rangeHarga,
  TIER_LABEL, PROPERTI_LABEL, UKURAN_LABEL, LAMA_LABEL, RANGE_LABEL,
  type AgunanKategori, type DeveloperTier, type PropertiTipe, type UkuranTipe, type RumahLamaJenis,
} from "@/data/ltv";
import type { NodeStatus } from "@/types/orchestration";
import type { AgunanData } from "@/types/agunan";

interface AgunanCalcCardProps {
  status: NodeStatus;
  agunan?: AgunanData;
  /** Uang muka (down payment) from the Data Diri form. */
  uangMuka?: number;
}

const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}%`;
const sel = "w-full rounded-lg border border-bri-line bg-white px-2 py-1 text-[9px] text-bri-ink focus:border-bri-blue focus:outline-none";

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] text-bri-muted">{label}</span>
      <span className={cn("tabular-nums", strong ? "text-[12px] font-bold" : "text-[10px] font-medium", className ?? "text-bri-ink")}>{value}</span>
    </div>
  );
}

/**
 * AgunanCalcCard — "Perhitungan Agunan". Plafon dari agunan = NPW (Nilai Pasar
 * Wajar) × LTV, where LTV is looked up from an editable classification (rumah
 * baru: tier/properti/tipe; rumah lama: secondary/refinancing). Compared with
 * the financing need (harga − DP); if the need exceeds the collateral plafon,
 * the shortfall is the extra down payment the nasabah must add.
 */
export function AgunanCalcCard({ status, agunan, uangMuka }: AgunanCalcCardProps) {
  const ready = status === "success";
  const [kategori, setKategori] = useState<AgunanKategori>("baru");
  const [tier, setTier] = useState<DeveloperTier>("tier1");
  const [prop, setProp] = useState<PropertiTipe>("tapak");
  const [ukuran, setUkuran] = useState<UkuranTipe>("gt70");
  const [jenisLama, setJenisLama] = useState<RumahLamaJenis>("secondary");

  const harga = agunan?.harga;
  const npw = computeNpw(agunan).value ?? harga ?? 0;
  const ltv = kategori === "baru" ? ltvBaru(tier, prop, ukuran) : ltvLama(jenisLama, harga);
  const plafonAgunan = Math.round(npw * ltv);
  const dp = uangMuka ?? 0;
  const kebutuhan = harga != null ? Math.max(0, harga - dp) : 0;
  const penambahanDp = Math.max(0, kebutuhan - plafonAgunan);
  const cukup = penambahanDp <= 0;

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2.5 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Home size={11} className="text-bri-navy" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Perhitungan Agunan</span>
        </div>
        <span className="rounded-pill bg-bri-bg px-2 py-0.5 text-[7.5px] font-semibold text-bri-navy">NPW × LTV {pct(ltv)}</span>
      </div>

      {!ready ? (
        <div className="flex h-12 items-center justify-center"><span className="text-[9px] italic text-bri-muted/40">Menunggu pemrosesan…</span></div>
      ) : harga == null ? (
        <div className="flex h-12 items-center justify-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-[9px] font-medium text-amber-600">Belum ada data agunan</span>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_1.15fr] gap-3">
          {/* Classification controls */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-1">
              {(["baru", "lama"] as AgunanKategori[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategori(k)}
                  className={cn("rounded-lg border px-2 py-1 text-[9px] font-semibold transition-all", kategori === k ? "border-bri-blue bg-bri-blue/5 text-bri-blue" : "border-bri-line text-bri-muted hover:border-bri-blue/50")}
                >
                  {k === "baru" ? "Rumah Baru" : "Rumah Lama"}
                </button>
              ))}
            </div>

            {kategori === "baru" ? (
              <>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-semibold uppercase tracking-[0.06em] text-bri-muted">Developer</span>
                  <select className={sel} value={tier} onChange={(e) => setTier(e.target.value as DeveloperTier)}>
                    {(Object.keys(TIER_LABEL) as DeveloperTier[]).map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-semibold uppercase tracking-[0.06em] text-bri-muted">Properti</span>
                  <select className={sel} value={prop} onChange={(e) => setProp(e.target.value as PropertiTipe)}>
                    {(Object.keys(PROPERTI_LABEL) as PropertiTipe[]).map((p) => <option key={p} value={p}>{PROPERTI_LABEL[p]}</option>)}
                  </select>
                </label>
                {prop !== "ruko" && (
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[7.5px] font-semibold uppercase tracking-[0.06em] text-bri-muted">Tipe</span>
                    <select className={sel} value={ukuran} onChange={(e) => setUkuran(e.target.value as UkuranTipe)}>
                      {(Object.keys(UKURAN_LABEL) as UkuranTipe[]).map((u) => <option key={u} value={u}>{UKURAN_LABEL[u]}</option>)}
                    </select>
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-semibold uppercase tracking-[0.06em] text-bri-muted">Jenis</span>
                  <select className={sel} value={jenisLama} onChange={(e) => setJenisLama(e.target.value as RumahLamaJenis)}>
                    {(Object.keys(LAMA_LABEL) as RumahLamaJenis[]).map((j) => <option key={j} value={j}>{LAMA_LABEL[j]}</option>)}
                  </select>
                </label>
                <div className="rounded-lg bg-bri-bg/50 px-2 py-1 text-[8px] text-bri-muted">
                  {jenisLama === "secondary" ? (
                    <>Rentang harga: <b className="text-bri-ink">{RANGE_LABEL[rangeHarga(harga)]}</b> → LTV {pct(ltv)}</>
                  ) : (
                    <>Refinancing → LTV tetap <b className="text-bri-ink">{pct(ltv)}</b></>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Calculation */}
          <div className="flex flex-col justify-center gap-1 rounded-lg bg-bri-bg/40 px-3 py-2">
            <Row label="Nilai Pasar Wajar (NPW)" value={formatRupiah(npw)} />
            <Row label={`LTV`} value={pct(ltv)} />
            <Row label="Plafon Agunan (NPW × LTV)" value={formatRupiah(plafonAgunan)} strong className="text-bri-navy" />
            <div className="my-0.5 border-t border-bri-line" />
            <Row label="Kebutuhan (Harga − DP)" value={formatRupiah(kebutuhan)} />
            {cukup ? (
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-pill bg-emerald-50 px-2 py-0.5 text-[8.5px] font-semibold text-emerald-600">
                <CheckCircle2 size={10} /> Plafon agunan mencukupi
              </span>
            ) : (
              <div className="mt-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1">
                <span className="flex items-center gap-1 text-[8.5px] font-semibold text-red-600">
                  <AlertTriangle size={10} /> Penambahan DP: {formatRupiah(penambahanDp)}
                </span>
                <span className="text-[7.5px] text-red-500/80">DP total jadi {formatRupiah(dp + penambahanDp)} (kebutuhan melebihi plafon agunan)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
