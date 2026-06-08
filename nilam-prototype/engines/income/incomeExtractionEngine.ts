import type { OcrMutasiResult } from "@/types/engines";
import type { CustomerIncome, ComponentKey, IncomeComponent } from "@/types/income";

const KEYS: ComponentKey[] = ["Gaji", "THR", "Bonus", "Insentif"];

export function extractIncome(
  role: "nasabah" | "pasangan", name: string, mutasi: OcrMutasiResult, angsuran: number,
): CustomerIncome {
  const components = KEYS.map<IncomeComponent>((key) => {
    const b = mutasi[key];
    return { key, avg: Math.round(b.sum / b.count), min: b.min, mode: "avg", weight: 1 };
  });
  return { role, name, components, angsuran };
}
