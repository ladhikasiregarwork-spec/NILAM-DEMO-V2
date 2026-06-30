"use client";

import { useState } from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_COLOR } from "@/data/vehicleCatalog";
import type { Vehicle } from "@/types/auto";

/**
 * Branded vehicle visual. Uses the catalog photo when present; otherwise (and
 * on image error) falls back to a clean category-coloured gradient with a car
 * silhouette + brand wordmark — so the demo always looks intentional offline.
 */
export function VehiclePhoto({
  vehicle,
  className,
  iconSize = 44,
}: {
  vehicle: Vehicle;
  className?: string;
  iconSize?: number;
}) {
  const [broken, setBroken] = useState(false);
  const color = CATEGORY_COLOR[vehicle.category] ?? "#00529C";

  if (vehicle.image && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={vehicle.image}
        alt={vehicle.fullName}
        onError={() => setBroken(true)}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 60%, ${color}99 100%)` }}
    >
      <Car size={iconSize} className="text-white/90" strokeWidth={1.5} />
      <span className="absolute left-2 top-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/80">
        {vehicle.brand}
      </span>
      <span className="absolute bottom-1.5 right-2 rounded-pill bg-white/20 px-1.5 py-px text-[7.5px] font-semibold text-white">
        {vehicle.category}
      </span>
    </div>
  );
}
