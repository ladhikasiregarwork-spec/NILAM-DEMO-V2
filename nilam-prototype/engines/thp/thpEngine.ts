import type { CustomerIncome, ComponentKey, IncomeComponent, ThpResult, JointThp } from "@/types/income";

export function adjusted(c: IncomeComponent): number {
  const base = c.mode === "avg" ? c.avg : c.min;
  return Math.round(base * c.weight);
}

export function computeThp(cust: CustomerIncome): ThpResult {
  const adj: Partial<Record<ComponentKey, number>> = {};
  let gross = 0;
  for (const c of cust.components) {
    const v = adjusted(c);
    adj[c.key] = v;
    gross += v;
  }
  return { adjusted: adj as Record<ComponentKey, number>, grossBeforeAngsuran: gross, angsuran: cust.angsuran, thp: gross - cust.angsuran };
}

export function computeJointThp(nasabah: CustomerIncome, pasangan?: CustomerIncome): JointThp {
  const n = computeThp(nasabah);
  const p = pasangan ? computeThp(pasangan) : undefined;
  return { nasabah: n, pasangan: p, total: n.thp + (p?.thp ?? 0) };
}
