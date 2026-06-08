import type { FraudResult } from "@/types/engines";

export const FRAUD_RESULT: FraudResult = {
  checks: [
    { name: "Slip Gaji Authentic",      score: 0.95 },
    { name: "Mutasi Valid (12 Bulan)",  score: 0.93 },
    { name: "Consistency Check",        score: 0.96 },
    { name: "Pattern Analysis",         score: 0.91 },
  ],
  overall: 0.94,
};
