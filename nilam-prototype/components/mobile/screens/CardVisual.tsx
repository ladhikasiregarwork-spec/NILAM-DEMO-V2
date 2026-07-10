"use client";

import { useState } from "react";
import { Wifi } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CreditCard } from "@/types/card";

/**
 * CardVisual — the credit-card artwork block. Uses the real BRI card photo
 * (public/cards/*.png) when the product carries one; otherwise (and on image
 * error) falls back to a synthetic gradient card with chip + masked number, so
 * the demo always looks intentional offline. Mirrors VehiclePhoto.
 *
 * Sizes itself to a standard card aspect ratio (85.6 × 53.98 mm ≈ 1.586:1) and
 * fills the available width; pass `className` for rounding/margins.
 */
export function CardVisual({ card, className }: { card: CreditCard; className?: string }) {
  const [broken, setBroken] = useState(false);

  if (card.image && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={card.image}
        alt={`Kartu ${card.name}`}
        onError={() => setBroken(true)}
        className={cn("block aspect-[1.586/1] w-full rounded-2xl object-cover shadow-soft", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-2xl p-3 text-white shadow-soft",
        className,
      )}
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
  );
}
