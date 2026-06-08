"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Landmark, LayoutList, Braces } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import type { NodeStatus } from "@/types/orchestration";
import type { OcrSlipResult, OcrMutasiResult, OcrBucket } from "@/types/engines";

interface OcrJsonCardProps {
  ocrStatus: NodeStatus;
  slip: OcrSlipResult;
  mutasi: OcrMutasiResult;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Raw JSON tokenizer (technical / secondary tab)
 * ────────────────────────────────────────────────────────────────────────── */

type TokenType = "key" | "number" | "punctuation" | "whitespace";
interface Token {
  type: TokenType;
  text: string;
}

/** Very lightweight JSON tokenizer — handles keys, numbers, and punctuation. */
function tokenize(value: unknown, indent = 0): Token[] {
  const tokens: Token[] = [];
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (typeof value === "number") {
    tokens.push({ type: "number", text: String(value) });
  } else if (typeof value === "object" && value !== null) {
    tokens.push({ type: "punctuation", text: "{" });
    const entries = Object.entries(value as Record<string, unknown>);
    entries.forEach(([k, v], idx) => {
      tokens.push({ type: "whitespace", text: "\n" + padInner });
      tokens.push({ type: "key", text: `"${k}"` });
      tokens.push({ type: "punctuation", text: ": " });
      tokens.push(...tokenize(v, indent + 1));
      if (idx < entries.length - 1) {
        tokens.push({ type: "punctuation", text: "," });
      }
    });
    tokens.push({ type: "whitespace", text: "\n" + pad });
    tokens.push({ type: "punctuation", text: "}" });
  }

  return tokens;
}

/** Renders a syntax-colored JSON block. */
function JsonBlock({ title, data }: { title: string; data: unknown }) {
  const tokens = tokenize(data);

  return (
    <div className="flex flex-1 flex-col min-w-0 min-h-0">
      <span className="mb-1 block text-[8.5px] font-semibold text-bri-ink">{title}</span>
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin rounded-lg border border-bri-line/60 bg-bri-bg/60 px-2 py-1.5">
        <pre className="text-[8.5px] leading-[1.3] font-mono whitespace-pre-wrap break-words">
          {tokens.map((token, i) => (
            <span
              key={i}
              className={cn(
                token.type === "key" && "text-bri-blue font-medium",
                token.type === "number" && "text-emerald-600",
                token.type === "punctuation" && "text-bri-muted",
                token.type === "whitespace" && "text-transparent select-none",
              )}
            >
              {token.text}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Structured view (default / stakeholder-friendly tab)
 * ────────────────────────────────────────────────────────────────────────── */

const MUTASI_ROWS: { key: keyof OcrMutasiResult; label: string }[] = [
  { key: "Gaji", label: "Gaji" },
  { key: "THR", label: "THR" },
  { key: "Bonus", label: "Bonus" },
  { key: "Insentif", label: "Insentif" },
];

/** Tiny pill-style group heading with an icon. */
function GroupLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-bri-navy/10 text-bri-navy">
        {icon}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-bri-muted">
        {children}
      </span>
    </div>
  );
}

function StructuredView({ slip, mutasi }: { slip: OcrSlipResult; mutasi: OcrMutasiResult }) {
  return (
    <div className="flex flex-1 flex-col gap-2 min-h-0">
      {/* Slip Gaji — single headline extraction */}
      <section className="shrink-0">
        <GroupLabel icon={<FileText size={9} strokeWidth={2} />}>Slip Gaji</GroupLabel>
        <div className="mt-1 flex items-center justify-between rounded-lg border border-bri-line/70 bg-bri-bg/50 px-2 py-1.5">
          <span className="text-[9px] text-bri-muted">Gaji Pokok</span>
          <span className="text-[11px] font-bold text-bri-navy tabular-nums">
            {formatRupiah(slip.Gaji)}
          </span>
        </div>
      </section>

      {/* Mutasi Rekening — mini table per income component */}
      <section className="flex flex-1 flex-col min-h-0">
        <GroupLabel icon={<Landmark size={9} strokeWidth={2} />}>Mutasi Rekening</GroupLabel>

        <div className="mt-1 flex flex-1 flex-col overflow-hidden rounded-lg border border-bri-line/70">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 bg-bri-bg/70 px-2 py-1">
            <span className="text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Komponen
            </span>
            <span className="w-8 text-center text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Trx
            </span>
            <span className="w-[88px] text-right text-[7.5px] font-semibold uppercase tracking-[0.08em] text-bri-muted">
              Total
            </span>
          </div>

          {/* Rows */}
          <div className="flex flex-1 flex-col">
            {MUTASI_ROWS.map(({ key, label }) => {
              const bucket = mutasi[key] as OcrBucket;
              return (
                <div
                  key={key}
                  className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-bri-line/50 px-2 py-1 first:border-t-0"
                >
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[9px] font-medium text-bri-ink">{label}</span>
                    <span className="text-[7px] text-bri-muted">
                      min {formatRupiah(bucket.min)}
                    </span>
                  </div>
                  <span className="w-8 text-center text-[9px] font-semibold text-bri-muted tabular-nums">
                    {bucket.count}×
                  </span>
                  <span className="w-[88px] text-right text-[9px] font-bold text-bri-blue tabular-nums">
                    {formatRupiah(bucket.sum)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Segmented tab control
 * ────────────────────────────────────────────────────────────────────────── */

type TabKey = "structured" | "raw";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "structured", label: "Structured View", icon: <LayoutList size={9} strokeWidth={2.2} /> },
  { key: "raw", label: "Raw JSON", icon: <Braces size={9} strokeWidth={2.2} /> },
];

/**
 * OcrJsonCard — OCR extraction results with two tabs.
 *
 * "Structured View" (default): a stakeholder-friendly, labelled summary of the
 * extracted Slip Gaji + Mutasi Rekening figures (key→value rows / mini-table).
 * "Raw JSON": the original syntax-colored JSON for technical reviewers.
 *
 * Content is hidden ("Menunggu hasil ekstraksi…") until ocrStatus === "success".
 */
export function OcrJsonCard({ ocrStatus, slip, mutasi }: OcrJsonCardProps) {
  const [tab, setTab] = useState<TabKey>("structured");
  const isDone = ocrStatus === "success";

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-bri-line bg-white px-2.5 py-2 shadow-soft min-h-0">
      {/* Header: section label + segmented tabs */}
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">
          OCR Result
        </span>

        {isDone && (
          <div className="flex items-center gap-0.5 rounded-pill bg-bri-bg p-0.5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "relative flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.04em] transition-colors",
                    active ? "text-white" : "text-bri-muted hover:text-bri-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="ocrTabActive"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-pill bg-bri-navy shadow-soft"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    {t.icon}
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      {!isDone ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[10px] italic text-bri-muted/40">Menunggu hasil ekstraksi…</span>
        </div>
      ) : tab === "structured" ? (
        <StructuredView slip={slip} mutasi={mutasi} />
      ) : (
        <div className="flex flex-1 gap-2 min-h-0">
          <JsonBlock title="Slip Gaji" data={slip} />
          <JsonBlock title="Mutasi Rekening" data={mutasi} />
        </div>
      )}
    </div>
  );
}
