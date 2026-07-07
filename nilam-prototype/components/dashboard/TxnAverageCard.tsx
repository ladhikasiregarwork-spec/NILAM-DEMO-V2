"use client";

import { useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatJuta } from "@/lib/formatRupiah";
import type { MonthlyTxn, MonthlyTxnSummary } from "@/lib/cardAnalytics";

interface TxnAverageCardProps {
  months: MonthlyTxn[];
  summary: MonthlyTxnSummary;
}

// Shared chart geometry so both stacked panels align on x, and hover maps cleanly.
const CHART_W = 480;
const PAD_L = 44;
const PAD_R = 12;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const FS = 4.3; // single, synchronized SVG label size (scales with the viewBox)

const NAVY = "#00529C";
const CREDIT = "#059669";
const DEBIT = "#DC2626";

/**
 * TxnAverageCard — monthly transaction analytics (Detail-Transaksi tab). Balance
 * is aggregated per month by AVERAGE (a line); credit & debit are aggregated per
 * month by SUM (bars) with the transaction COUNT labelled. Tiles show 12-month
 * roll-ups. Hover shows the month's figures. DUMMY data pending a real feed.
 */
export function TxnAverageCard({ months, summary }: TxnAverageCardProps) {
  const n = months.length;
  const slotW = PLOT_W / n;
  const [hover, setHover] = useState<{ idx: number; px: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let idx = Math.floor((vbX - PAD_L) / slotW);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover({ idx, px: e.clientX - rect.left });
  }

  return (
    <div className="rounded-xl border border-bri-line bg-white px-3 py-2.5 shadow-soft">
      <div className="mb-2 flex items-center gap-1">
        <Activity size={11} className="text-bri-navy" strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">Transaksi &amp; Saldo Bulanan · 12 Bulan</span>
        <span className="ml-auto rounded-pill bg-amber-100 px-1.5 py-px text-[7px] font-bold text-amber-700">DUMMY</span>
      </div>

      {/* 12-month roll-ups */}
      <div className="grid grid-cols-3 gap-2">
        <SumTile tone="credit" icon={ArrowDownCircle} label="Kredit (masuk)" sum={summary.creditTotal} count={summary.creditCount} />
        <SumTile tone="debit" icon={ArrowUpCircle} label="Debit (keluar)" sum={summary.debitTotal} count={summary.debitCount} />
        <div className="rounded-lg border border-bri-navy/30 px-2.5 py-2 text-white" style={{ background: "linear-gradient(135deg, #00305C 0%, #00529C 100%)" }}>
          <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.06em] text-white/80"><Wallet size={10} /> Saldo Rata-rata</p>
          <p className="mt-1 text-[13px] font-extrabold leading-tight tabular-nums text-white">{formatRupiah(summary.avgBalance)}</p>
          <p className="text-[8px] text-white/60">rata-rata saldo bulanan</p>
        </div>
      </div>

      {/* small multiples */}
      <div ref={wrapRef} className="relative mt-2" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <BalancePanel months={months} hoverIdx={hover?.idx} />
        <FlowsPanel months={months} hoverIdx={hover?.idx} />
        {hover && (
          <Tooltip
            px={hover.px}
            wrapW={wrapRef.current?.clientWidth ?? CHART_W}
            month={months[hover.idx].month}
            rows={[
              { color: NAVY, label: "Saldo (avg)", value: months[hover.idx].avgBalance },
              { color: CREDIT, label: "Kredit", value: months[hover.idx].creditSum, count: months[hover.idx].creditCount },
              { color: DEBIT, label: "Debit", value: months[hover.idx].debitSum, count: months[hover.idx].debitCount },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ── sum + count tile ──────────────────────────────────────────────────────────
function SumTile({ tone, icon: Icon, label, sum, count }: {
  tone: "credit" | "debit"; icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; sum: number; count: number;
}) {
  const c = tone === "credit"
    ? { border: "border-emerald-200", bg: "bg-emerald-50/60", text: "text-emerald-700" }
    : { border: "border-red-200", bg: "bg-red-50/60", text: "text-red-600" };
  return (
    <div className={cn("rounded-lg border px-2.5 py-2", c.border, c.bg)}>
      <p className={cn("flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.06em]", c.text)}><Icon size={10} /> {label}</p>
      <p className={cn("mt-1 text-[13px] font-extrabold leading-tight tabular-nums", c.text)}>{formatRupiah(sum)}</p>
      <div className="mt-1 flex items-center justify-between text-[8px] text-bri-muted">
        <span>total 12 bln</span>
        <span><b className="text-bri-ink">{count}</b> transaksi</span>
      </div>
    </div>
  );
}

const xCenter = (i: number, n: number) => PAD_L + (i + 0.5) * (PLOT_W / n);

// ── balance panel — monthly AVERAGE saldo (area + line) ───────────────────────
function BalancePanel({ months, hoverIdx }: { months: MonthlyTxn[]; hoverIdx?: number }) {
  const H = 88, padT = 8, padB = 6, plotH = H - padT - padB;
  const n = months.length;
  const data = months.map((m) => m.avgBalance);
  const yMax = Math.max(1, ...data) * 1.12;
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;
  const yBase = padT + plotH;

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${xCenter(i, n).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `M ${xCenter(0, n).toFixed(1)},${yBase} ${data.map((v, i) => `L ${xCenter(i, n).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} L ${xCenter(n - 1, n).toFixed(1)},${yBase} Z`;

  return (
    <div className="mb-1.5">
      <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-bri-muted">Saldo Rata-rata Bulanan</p>
      <div className="overflow-hidden rounded-lg border border-bri-line bg-white">
        <svg width="100%" viewBox={`0 0 ${CHART_W} ${H}`} className="block">
          <defs>
            <linearGradient id="grad-saldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity={0.2} />
              <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((f) => {
            const yy = padT + plotH - f * plotH;
            return (
              <g key={f}>
                <line x1={PAD_L} y1={yy} x2={CHART_W - PAD_R} y2={yy} stroke="#EDF1F5" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <text x={PAD_L - 4} y={yy + 1.6} textAnchor="end" fontSize={FS} fill="#9AA6B2">{formatJuta(Math.round(f * yMax))}</text>
              </g>
            );
          })}
          {hoverIdx != null && (
            <line x1={xCenter(hoverIdx, n)} y1={padT} x2={xCenter(hoverIdx, n)} y2={yBase} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          )}
          <path d={area} fill="url(#grad-saldo)" stroke="none" />
          <path d={line} fill="none" stroke={NAVY} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {hoverIdx != null && (
            <circle cx={xCenter(hoverIdx, n)} cy={y(data[hoverIdx])} r={2.4} fill="#fff" stroke={NAVY} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      </div>
    </div>
  );
}

// ── flows panel — monthly SUM bars (credit/debit) with COUNT labels ───────────
function barTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M ${x} ${y + h} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} Z`;
}

function FlowsPanel({ months, hoverIdx }: { months: MonthlyTxn[]; hoverIdx?: number }) {
  const H = 104, padT = 12, padB = 14, plotH = H - padT - padB;
  const n = months.length;
  const yMax = Math.max(1, ...months.flatMap((m) => [m.creditSum, m.debitSum])) * 1.18;
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;
  const yBase = padT + plotH;
  const slotW = PLOT_W / n;
  const barW = slotW * 0.3;
  const gap = slotW * 0.1;

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-bri-muted">Kredit &amp; Debit (Jumlah &amp; Frekuensi)</span>
        <span className="flex items-center gap-2.5">
          <LegendDot color={CREDIT} label="Kredit" />
          <LegendDot color={DEBIT} label="Debit" />
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-bri-line bg-white">
        <svg width="100%" viewBox={`0 0 ${CHART_W} ${H}`} className="block">
          {[0, 0.5, 1].map((f) => {
            const yy = padT + plotH - f * plotH;
            return (
              <g key={f}>
                <line x1={PAD_L} y1={yy} x2={CHART_W - PAD_R} y2={yy} stroke="#EDF1F5" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <text x={PAD_L - 4} y={yy + 1.6} textAnchor="end" fontSize={FS} fill="#9AA6B2">{formatJuta(Math.round(f * yMax))}</text>
              </g>
            );
          })}

          {months.map((m, i) => {
            const cx = xCenter(i, n);
            const cX = cx - gap / 2 - barW;
            const dX = cx + gap / 2;
            const cY = y(m.creditSum);
            const dY = y(m.debitSum);
            return (
              <g key={i}>
                {hoverIdx === i && <rect x={cx - slotW / 2} y={padT} width={slotW} height={plotH} fill="#F3F6FA" />}
                <path d={barTop(cX, cY, barW, yBase - cY, 1.4)} fill={CREDIT} opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.55} />
                <path d={barTop(dX, dY, barW, yBase - dY, 1.4)} fill={DEBIT} opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.55} />
                {/* count labels above each bar */}
                <text x={cX + barW / 2} y={cY - 1.6} textAnchor="middle" fontSize={FS} fill={CREDIT} fontWeight={700}>{m.creditCount}</text>
                <text x={dX + barW / 2} y={dY - 1.6} textAnchor="middle" fontSize={FS} fill={DEBIT} fontWeight={700}>{m.debitCount}</text>
                {/* month label */}
                <text x={cx} y={H - 4} textAnchor="middle" fontSize={FS} fill="#9AA6B2">{m.month}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[8px] font-medium text-bri-muted">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

// ── floating tooltip ──────────────────────────────────────────────────────────
function Tooltip({ px, wrapW, month, rows }: {
  px: number; wrapW: number; month: string; rows: { color: string; label: string; value: number; count?: number }[];
}) {
  const TW = 132;
  const left = Math.max(2, Math.min(wrapW - TW - 2, px - TW / 2));
  return (
    <div className="pointer-events-none absolute top-0 z-10 rounded-lg border border-bri-line bg-white/95 px-2 py-1.5 shadow-soft backdrop-blur" style={{ left, width: TW }}>
      <p className="mb-1 text-[8px] font-bold text-bri-ink">{month}</p>
      <div className="flex flex-col gap-0.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[8px] text-bri-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: r.color }} /> {r.label}
            </span>
            <span className="text-[8px] tabular-nums text-bri-ink">
              <b>{formatRupiah(r.value)}</b>{r.count != null && <span className="text-bri-muted"> · {r.count}×</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
