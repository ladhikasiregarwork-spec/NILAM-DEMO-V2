"use client";

import { Users, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface JointIncomeScreenProps {
  onAnswer: (ans: "ya" | "tidak") => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

/**
 * Joint Income screen — two option cards.
 * Both cards are always selectable (free runtime choice).
 * Clicking either calls onAnswer("ya") or onAnswer("tidak") and advances.
 */
export function JointIncomeScreen({ onAnswer, onGoBack, canGoBack }: JointIncomeScreenProps) {
  const cards = [
    {
      key: "joint" as const,
      icon: <Users size={16} />,
      label: "Ya, Joint Income",
      desc: "Penghasilan digabungkan dengan pasangan",
      answer: "ya" as const,
    },
    {
      key: "single" as const,
      icon: <User size={16} />,
      label: "Tidak, Penghasilan Sendiri",
      desc: "Penghasilan hanya dari nasabah",
      answer: "tidak" as const,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-4 py-3">
      {/* Title */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-bri-ink">Joint Income?</h2>
        <p className="mt-0.5 text-[10px] text-bri-muted">Pilih sesuai kondisi penghasilan Anda</p>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onAnswer(card.answer)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]",
              "border-bri-line bg-white hover:border-bri-navy hover:bg-bri-bg"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bri-bg text-bri-blue transition-colors">
              {card.icon}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-bri-ink">{card.label}</p>
              <p className="text-[9px] text-bri-muted">{card.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Back */}
      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-3 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
