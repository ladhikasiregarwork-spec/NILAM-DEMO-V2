# NILAM Prototype Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build NILAM — a modular, event-driven loan-onboarding + income-assessment demo with a SOFIA-style split screen (left: mobile-app simulation; right: real-time "behind-the-scenes" AI orchestration), covering Fix Income across 4 personas.

**Architecture:** SOFIA's file conventions (Next 15 App Router, single split-screen page) + an event-driven `WorkflowOrchestrator` that runs each engine (OCR, Fraud, SLIK, Income, THP) as a *node* emitting lifecycle events. One store (`useNilamFlow`) feeds both panels. `thpEngine`/`personaEngine` are pure and unit-tested.

**Tech Stack:** Next.js 15.1.6, React 19, TypeScript 5.7, Tailwind 3.4, Framer Motion 11, lucide-react, clsx + tailwind-merge, Vitest.

**Design doc:** `docs/plans/2026-06-01-nilam-prototype-design.md` (read it first).

**Working dir for all paths:** `/Users/davindb/Documents/BRI/Work/2026/robo_advisor/nilam_prototype`
Git is already initialised here (1 commit: the design doc). Commit after every task.

**Conventions:**
- Import alias `@/*` → project root.
- Styling mirrors SOFIA: `bri` color tokens, `card/bubble/pill` radii, `soft/panel/phone` shadows, `cn()` util, `.scroll-thin`. When a component has a SOFIA analog, open the SOFIA file (`../prototype/...`) and mirror its className patterns.
- All "backends" are simulated; no network. Engines return typed fixtures; the orchestrator simulates latency.

---

## PHASE 0 — Scaffold (verify dev server boots)

### Task 0.1: Create `package.json`

**Files:** Create `package.json`

```json
{
  "name": "nilam-prototype",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.471.0",
    "next": "15.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

### Task 0.2: Create config files

**Files:** Create `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `lib/cn.ts`

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

`postcss.config.mjs`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Task 0.3: Create `tailwind.config.ts` (SOFIA tokens + NILAM extras)

**Files:** Create `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bri: {
          navy: "#00529C", blue: "#1A6FC4", sky: "#4FB3E8",
          bg: "#EAF2FB", bubble: "#F4F5F6", ink: "#111827",
          muted: "#6B7280", line: "#E5E7EB",
        },
        // NILAM accents for orchestration states
        nilam: {
          ok: "#10B981", warn: "#F59E0B", run: "#1A6FC4", glow: "#4FB3E8",
        },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { card: "16px", bubble: "14px", pill: "999px" },
      boxShadow: {
        soft: "0 2px 12px rgba(16, 24, 40, 0.06)",
        panel: "0 8px 32px rgba(16, 24, 40, 0.10)",
        phone: "0 24px 60px rgba(16, 24, 40, 0.22)",
        glow: "0 0 0 4px rgba(79, 179, 232, 0.15)",
      },
      backgroundImage: {
        "nilam-glass": "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(234,242,251,0.6))",
      },
      keyframes: {
        "bubble-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "scan-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79,179,232,0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(79,179,232,0)" },
        },
      },
      animation: {
        "bubble-in": "bubble-in 0.28s ease-out",
        "dot-bounce": "dot-bounce 1.2s infinite ease-in-out",
        "scan-shimmer": "scan-shimmer 1.4s infinite linear",
        "glow-pulse": "glow-pulse 1.6s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
```

### Task 0.4: Create `app/globals.css` and `app/layout.tsx`

**Files:** Create `app/globals.css`, `app/layout.tsx`

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { height: 100%; }
body { background: #F5F7FA; color: #111827; }

.scroll-thin::-webkit-scrollbar { width: 6px; }
.scroll-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 999px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NILAM — New Intelligent Loan Application Management",
  description: "BRI modular loan-onboarding & income-assessment engine — prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
```

### Task 0.5: Temporary placeholder page + boot check

**Files:** Create `app/page.tsx` (temporary)

```tsx
export default function Page() {
  return <main className="grid min-h-screen place-items-center text-bri-navy">NILAM scaffold OK</main>;
}
```

**Step — install & boot:**
```bash
npm install
npm run dev   # open http://localhost:3000 → see "NILAM scaffold OK"
```
Stop the server (Ctrl-C) once verified.

**Commit:**
```bash
git add -A && git commit -m "chore: scaffold NILAM Next.js app (config, tailwind, layout)"
```

---

## PHASE 1 — Engines + types + data + tests (TDD core first)

### Task 1.1: Type definitions

**Files:** Create `types/flow.ts`, `types/orchestration.ts`, `types/engines.ts`, `types/income.ts`

`types/flow.ts`:
```ts
export type FlowStep =
  | 'opening' | 'income_type' | 'payroll_confirm'
  | 'document_upload' | 'joint_documents' | 'processing' | 'submitted';

export interface PersonaConfig {
  id: string;
  label: string;
  shortLabel: string;
  incomeType: 'fix';
  isPayrollBRI: boolean;
  isJointIncome: boolean;
}
```

`types/orchestration.ts`:
```ts
export type NodeId =
  | 'payroll_pull' | 'ocr_slip' | 'ocr_mutasi' | 'doc_validation'
  | 'fraud_screening' | 'doc_classification' | 'identity_ocr'
  | 'liveness_selfie' | 'slik_retrieval' | 'income_extraction' | 'thp_computation';

export type NodeStatus = 'idle' | 'running' | 'success' | 'failed';
export type NodeLeg = 'nasabah' | 'pasangan';
export type NodeGroup = 'payroll' | 'ocr' | 'fraud' | 'identity' | 'slik' | 'income' | 'thp';

export interface NodeSpec { nodeId: NodeId; leg: NodeLeg; label: string; group: NodeGroup; }

export interface OrchestrationEvent {
  nodeId: NodeId; leg: NodeLeg; status: NodeStatus; label: string;
  progress?: number; confidence?: number; reasoning?: string; output?: unknown; ts: number;
}

/** Unique key for a node instance (a node id can appear on both legs). */
export const nodeKey = (leg: NodeLeg, id: NodeId) => `${leg}:${id}`;
```

`types/engines.ts`:
```ts
export interface OcrSlipResult { Gaji: number }
export interface OcrBucket { count: number; sum: number; min: number }
export interface OcrMutasiResult {
  Gaji: OcrBucket; THR: OcrBucket; Bonus: OcrBucket; Insentif: OcrBucket;
}
export interface FraudCheck { name: string; passed: boolean; score: number }
export interface FraudResult { passed: boolean; confidence: number; checks: FraudCheck[] }
export interface SlikFacility { lender: string; type: string; installment: number }
export interface SlikResult {
  found: boolean; facilities: SlikFacility[]; totalAngsuran: number; reasoning: string;
}
export interface IdentityResult {
  NIK: string; Nama: string; Gender: 'L' | 'P'; TanggalLahir: string; isPayrollBRI: boolean;
}
```

`types/income.ts`:
```ts
export type ComponentKey = 'Gaji' | 'THR' | 'Bonus' | 'Insentif';
export type ComponentMode = 'avg' | 'min';

export interface IncomeComponent {
  key: ComponentKey; avg: number; min: number; mode: ComponentMode; weight: number;
}
export interface CustomerIncome {
  role: 'nasabah' | 'pasangan'; name: string; components: IncomeComponent[]; angsuran: number;
}
export interface ThpResult {
  adjusted: Record<string, number>; grossBeforeAngsuran: number; angsuran: number; thp: number;
}
export interface JointThp { nasabah: ThpResult; pasangan?: ThpResult; total: number; }
```

**Commit:** `git add -A && git commit -m "feat(types): NILAM flow, orchestration, engine, income types"`

### Task 1.2: THP engine — TDD

**Files:** Create `engines/thp/thpEngine.test.ts`, then `engines/thp/thpEngine.ts`

**Step 1 — failing test** (`engines/thp/thpEngine.test.ts`):
```ts
import { describe, it, expect } from "vitest";
import { adjusted, computeThp, computeJointThp } from "./thpEngine";
import type { CustomerIncome, IncomeComponent } from "@/types/income";

const comp = (over: Partial<IncomeComponent>): IncomeComponent => ({
  key: "Gaji", avg: 10_000_000, min: 10_000_000, mode: "avg", weight: 1, ...over,
});

const nasabah = (): CustomerIncome => ({
  role: "nasabah", name: "Nasabah", angsuran: 2_500_000,
  components: [
    comp({ key: "Gaji", avg: 10_000_000, min: 10_000_000 }),
    comp({ key: "THR", avg: 20_000_000, min: 20_000_000 }),
    comp({ key: "Bonus", avg: 30_000_000, min: 10_000_000 }),
    comp({ key: "Insentif", avg: 1_000_000, min: 1_000_000 }),
  ],
});

describe("adjusted", () => {
  it("uses avg * weight in avg mode (spec example: 10jt * 0.5 = 5jt)", () => {
    expect(adjusted(comp({ avg: 10_000_000, mode: "avg", weight: 0.5 }))).toBe(5_000_000);
  });
  it("uses min * weight in min mode", () => {
    expect(adjusted(comp({ min: 8_000_000, mode: "min", weight: 1 }))).toBe(8_000_000);
  });
});

describe("computeThp", () => {
  it("THP = sum(adjusted) - angsuran at full weight/avg", () => {
    const r = computeThp(nasabah());
    expect(r.grossBeforeAngsuran).toBe(61_000_000);
    expect(r.thp).toBe(58_500_000);
    expect(r.adjusted.Gaji).toBe(10_000_000);
  });
});

describe("computeJointThp", () => {
  it("total = nasabah.thp + pasangan.thp", () => {
    const p: CustomerIncome = { ...nasabah(), role: "pasangan", name: "Pasangan", angsuran: 1_500_000 };
    const r = computeJointThp(nasabah(), p);
    expect(r.total).toBe(r.nasabah.thp + (r.pasangan?.thp ?? 0));
  });
  it("total = nasabah.thp when no pasangan", () => {
    const r = computeJointThp(nasabah());
    expect(r.total).toBe(r.nasabah.thp);
  });
});
```

**Step 2 — run, expect FAIL:** `npm test -- thpEngine` → fails (module not found).

**Step 3 — implement** (`engines/thp/thpEngine.ts`):
```ts
import type { CustomerIncome, IncomeComponent, ThpResult, JointThp } from "@/types/income";

export function adjusted(c: IncomeComponent): number {
  const base = c.mode === "avg" ? c.avg : c.min;
  return Math.round(base * c.weight);
}

export function computeThp(cust: CustomerIncome): ThpResult {
  const adj: Record<string, number> = {};
  let gross = 0;
  for (const c of cust.components) {
    const v = adjusted(c);
    adj[c.key] = v;
    gross += v;
  }
  return { adjusted: adj, grossBeforeAngsuran: gross, angsuran: cust.angsuran, thp: gross - cust.angsuran };
}

export function computeJointThp(nasabah: CustomerIncome, pasangan?: CustomerIncome): JointThp {
  const n = computeThp(nasabah);
  const p = pasangan ? computeThp(pasangan) : undefined;
  return { nasabah: n, pasangan: p, total: n.thp + (p?.thp ?? 0) };
}
```

**Step 4 — run, expect PASS:** `npm test -- thpEngine`
**Step 5 — commit:** `git add -A && git commit -m "feat(thp): pure THP engine with avg/min weighting + joint total (TDD)"`

### Task 1.3: Persona engine (`planFlow`) — TDD

**Files:** Create `engines/persona/personaEngine.test.ts`, then `engines/persona/personaEngine.ts`

**Step 1 — failing test:**
```ts
import { describe, it, expect } from "vitest";
import { planFlow } from "./personaEngine";
import type { PersonaConfig } from "@/types/flow";

const make = (o: Partial<PersonaConfig>): PersonaConfig => ({
  id: "x", label: "x", shortLabel: "x", incomeType: "fix",
  isPayrollBRI: false, isJointIncome: false, ...o,
});

describe("planFlow", () => {
  it("payroll non-joint skips income_type & upload, uses payroll_confirm", () => {
    expect(planFlow(make({ isPayrollBRI: true }))).toEqual(
      ["opening", "payroll_confirm", "processing", "submitted"]);
  });
  it("non-payroll non-joint shows income_type + document_upload", () => {
    expect(planFlow(make({ isPayrollBRI: false }))).toEqual(
      ["opening", "income_type", "document_upload", "processing", "submitted"]);
  });
  it("payroll joint adds joint_documents", () => {
    expect(planFlow(make({ isPayrollBRI: true, isJointIncome: true }))).toEqual(
      ["opening", "payroll_confirm", "joint_documents", "processing", "submitted"]);
  });
  it("non-payroll joint adds joint_documents after upload", () => {
    expect(planFlow(make({ isJointIncome: true }))).toEqual(
      ["opening", "income_type", "document_upload", "joint_documents", "processing", "submitted"]);
  });
});
```

**Step 2 — run, expect FAIL.**

**Step 3 — implement** (`engines/persona/personaEngine.ts`):
```ts
import type { FlowStep, PersonaConfig } from "@/types/flow";

export function planFlow(p: PersonaConfig): FlowStep[] {
  const steps: FlowStep[] = ["opening"];
  if (p.isPayrollBRI) steps.push("payroll_confirm");
  else steps.push("income_type", "document_upload");
  if (p.isJointIncome) steps.push("joint_documents");
  steps.push("processing", "submitted");
  return steps;
}
```

**Step 4 — run, expect PASS. Step 5 — commit:** `feat(persona): planFlow persona branching (TDD)`

### Task 1.4: Data fixtures

**Files:** Create `data/personas.ts`, `data/ocrFixtures.ts`, `data/slikFixtures.ts`

`data/personas.ts`:
```ts
import type { PersonaConfig } from "@/types/flow";

export const PERSONAS: PersonaConfig[] = [
  { id: "payroll-single", label: "Fix Income · Payroll BRI · Non-Joint", shortLabel: "Payroll · Single", incomeType: "fix", isPayrollBRI: true, isJointIncome: false },
  { id: "payroll-joint", label: "Fix Income · Payroll BRI · Joint", shortLabel: "Payroll · Joint", incomeType: "fix", isPayrollBRI: true, isJointIncome: true },
  { id: "nonpayroll-single", label: "Fix Income · Non-Payroll · Non-Joint", shortLabel: "Non-Payroll · Single", incomeType: "fix", isPayrollBRI: false, isJointIncome: false },
  { id: "nonpayroll-joint", label: "Fix Income · Non-Payroll · Joint", shortLabel: "Non-Payroll · Joint", incomeType: "fix", isPayrollBRI: false, isJointIncome: true },
];

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);
```

`data/ocrFixtures.ts`:
```ts
import type { OcrSlipResult, OcrMutasiResult } from "@/types/engines";

export const SLIP_GAJI: OcrSlipResult = { Gaji: 10_000_000 };
export const MUTASI: OcrMutasiResult = {
  Gaji: { count: 12, sum: 120_000_000, min: 10_000_000 },
  THR: { count: 1, sum: 20_000_000, min: 20_000_000 },
  Bonus: { count: 2, sum: 60_000_000, min: 10_000_000 },
  Insentif: { count: 6, sum: 6_000_000, min: 1_000_000 },
};
export const SPOUSE_SLIP_GAJI: OcrSlipResult = { Gaji: 8_000_000 };
export const SPOUSE_MUTASI: OcrMutasiResult = {
  Gaji: { count: 12, sum: 96_000_000, min: 8_000_000 },
  THR: { count: 1, sum: 8_000_000, min: 8_000_000 },
  Bonus: { count: 2, sum: 24_000_000, min: 5_000_000 },
  Insentif: { count: 6, sum: 4_800_000, min: 500_000 },
};
export const KTP_PASANGAN = { NIK: "3201234567890002", Nama: "Damar Pratama", Gender: "L" as const, TanggalLahir: "1989-04-12", isPayrollBRI: false };
```

`data/slikFixtures.ts`:
```ts
import type { SlikResult } from "@/types/engines";

export const SLIK_NASABAH: SlikResult = {
  found: true,
  facilities: [
    { lender: "Bank BRI", type: "KKB (Kredit Kendaraan)", installment: 1_800_000 },
    { lender: "Bank Lain", type: "Kartu Kredit", installment: 700_000 },
  ],
  totalAngsuran: 2_500_000,
  reasoning: "2 fasilitas aktif terdeteksi; total angsuran berjalan Rp2.500.000 (kolektibilitas lancar).",
};
export const SLIK_PASANGAN: SlikResult = {
  found: true,
  facilities: [{ lender: "Bank BRI", type: "KUR Mikro", installment: 1_500_000 }],
  totalAngsuran: 1_500_000,
  reasoning: "1 fasilitas aktif terdeteksi; total angsuran berjalan Rp1.500.000 (kolektibilitas lancar).",
};
```

**Commit:** `feat(data): personas + OCR/SLIK mock fixtures`

### Task 1.5: Income-extraction engine — TDD

**Files:** Create `engines/income/incomeExtractionEngine.test.ts`, then `engines/income/incomeExtractionEngine.ts`

**Test (key assertions):** from `MUTASI`, `extractIncome('nasabah','Nasabah',MUTASI,2_500_000)` →
Gaji `{avg:10_000_000, min:10_000_000}`, Bonus `{avg:30_000_000, min:10_000_000}`, Insentif `{avg:1_000_000,min:1_000_000}`, default `mode:'avg'`, `weight:1`, `angsuran:2_500_000`.

**Implementation:**
```ts
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
```
Run tests → PASS. **Commit:** `feat(income): mutasi → CustomerIncome extraction (TDD)`

### Task 1.6: OCR / Fraud / SLIK engines (thin typed returners)

**Files:** Create `engines/ocr/ocrEngine.ts`, `engines/fraud/fraudEngine.ts`, `engines/slik/slikEngine.ts`

These return fixtures (latency is simulated by the orchestrator). Keep them tiny:
```ts
// engines/ocr/ocrEngine.ts
import type { OcrSlipResult, OcrMutasiResult, IdentityResult } from "@/types/engines";
export const readSlip = (slip: OcrSlipResult): OcrSlipResult => slip;
export const readMutasi = (m: OcrMutasiResult): OcrMutasiResult => m;
export const readKtp = (k: IdentityResult): IdentityResult => k;
```
```ts
// engines/fraud/fraudEngine.ts
import type { FraudResult } from "@/types/engines";
export function screen(label = "dokumen"): FraudResult {
  return {
    passed: true, confidence: 0.985,
    checks: [
      { name: "Metadata integrity", passed: true, score: 0.99 },
      { name: "Tampering / splicing", passed: true, score: 0.98 },
      { name: `Konsistensi nominal (${label})`, passed: true, score: 0.985 },
    ],
  };
}
export function livenessMatch(): FraudResult {
  return {
    passed: true, confidence: 0.971,
    checks: [
      { name: "Liveness (anti-spoof)", passed: true, score: 0.97 },
      { name: "Face match selfie ↔ KTP", passed: true, score: 0.972 },
    ],
  };
}
```
```ts
// engines/slik/slikEngine.ts
import type { SlikResult } from "@/types/engines";
export const retrieveSlik = (s: SlikResult): SlikResult => s;
```
**Commit:** `feat(engines): OCR/Fraud/SLIK simulated engines`

### Task 1.7: Orchestrator (events, pipelines, runner)

**Files:** Create `engines/orchestrator/events.ts`, `engines/orchestrator/pipelines.ts`, `engines/orchestrator/workflowOrchestrator.ts`

`events.ts`:
```ts
import type { OrchestrationEvent } from "@/types/orchestration";
export type EventListener = (e: OrchestrationEvent) => void;
export class EventEmitter {
  private listeners = new Set<EventListener>();
  subscribe(l: EventListener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  emit(e: OrchestrationEvent) { this.listeners.forEach((l) => l(e)); }
}
```

`pipelines.ts`: implement `buildPipeline(persona): NodeSpec[]` exactly as in the design doc §7 (nasabah leg → optional payroll vs OCR/fraud chain → slik → income; optional pasangan leg with identity_ocr + liveness_selfie + ocr + fraud + slik + income; final `thp_computation`). Full code:
```ts
import type { PersonaConfig } from "@/types/flow";
import type { NodeSpec } from "@/types/orchestration";

export function buildPipeline(p: PersonaConfig): NodeSpec[] {
  const n: NodeSpec[] = [];
  if (p.isPayrollBRI) {
    n.push({ nodeId: "payroll_pull", leg: "nasabah", label: "Payroll Data Retrieval (BRI)", group: "payroll" });
  } else {
    n.push(
      { nodeId: "ocr_slip", leg: "nasabah", label: "OCR — Slip Gaji", group: "ocr" },
      { nodeId: "ocr_mutasi", leg: "nasabah", label: "OCR — Mutasi 12 Bulan", group: "ocr" },
      { nodeId: "doc_validation", leg: "nasabah", label: "Validasi Dokumen (≥12 bln)", group: "ocr" },
      { nodeId: "fraud_screening", leg: "nasabah", label: "Fraud Screening", group: "fraud" },
      { nodeId: "doc_classification", leg: "nasabah", label: "Klasifikasi Dokumen", group: "ocr" },
    );
  }
  n.push(
    { nodeId: "slik_retrieval", leg: "nasabah", label: "SLIK Retrieval (OJK)", group: "slik" },
    { nodeId: "income_extraction", leg: "nasabah", label: "Income Extraction", group: "income" },
  );
  if (p.isJointIncome) {
    n.push(
      { nodeId: "identity_ocr", leg: "pasangan", label: "OCR — KTP Pasangan", group: "identity" },
      { nodeId: "liveness_selfie", leg: "pasangan", label: "Selfie vs KTP (Liveness)", group: "identity" },
      { nodeId: "ocr_slip", leg: "pasangan", label: "OCR — Slip Gaji Pasangan", group: "ocr" },
      { nodeId: "ocr_mutasi", leg: "pasangan", label: "OCR — Mutasi Pasangan", group: "ocr" },
      { nodeId: "fraud_screening", leg: "pasangan", label: "Fraud Screening Pasangan", group: "fraud" },
      { nodeId: "slik_retrieval", leg: "pasangan", label: "SLIK Retrieval Pasangan", group: "slik" },
      { nodeId: "income_extraction", leg: "pasangan", label: "Income Extraction Pasangan", group: "income" },
    );
  }
  n.push({ nodeId: "thp_computation", leg: "nasabah", label: "THP Computation", group: "thp" });
  return n;
}
```

`workflowOrchestrator.ts`: cancellable sequential runner that emits `running` (2 progress ticks + reasoning) then `success` (confidence for fraud/identity, output payload) per node. Use the `REASONING` map and `outputs` keyed by `nodeKey(leg,nodeId)`. (Full code in design doc §"orchestrator"; implement as written — `class WorkflowOrchestrator { cancel(); async run(persona, outputs, emit) {...} }` with `setTimeout`-based `delay()` and a `cancelled` guard checked between every await.)

> Optional test `engines/orchestrator/pipelines.test.ts`: assert node count & order per persona (e.g. non-payroll-joint has both legs and ends with `thp_computation`).

**Commit:** `feat(orchestrator): event-driven pipeline runner + per-persona node sequence`

### Task 1.8: Run full test suite

```bash
npm test
```
Expected: all suites PASS (`thpEngine`, `personaEngine`, `incomeExtractionEngine`, optional `pipelines`).
**Commit (if anything changed):** `test: green engine suite`

---

## PHASE 2 — State manager + app shell

### Task 2.1: `useNilamFlow` (UI State Manager)

**Files:** Create `hooks/useNilamFlow.ts`

Responsibilities (single source of truth, reducer-based, SOFIA `useConversation` style):
- State: `persona | null`, `steps: FlowStep[]`, `stepIndex`, `uploads: Record<string,boolean>`, `events: OrchestrationEvent[]`, `nasabah?: CustomerIncome`, `pasangan?: CustomerIncome`.
- Derived: `currentStep = steps[stepIndex]`, `canGoBack = stepIndex>0 && currentStep!=='processing' && currentStep!=='submitted'`.
- Actions:
  - `selectPersona(id)` → set persona, `steps = planFlow(persona)`, `stepIndex=0`, clear events/uploads/income, cancel orchestrator.
  - `start()` / `next()` → `stepIndex = min(stepIndex+1, steps.length-1)`.
  - `goBack()` → cancel orchestrator; `stepIndex = max(stepIndex-1,0)`; **roll back events** to those whose step ≤ target (simplest: clear `events` when leaving `processing`/`submitted` back into an input step, since the pipeline only runs during `processing`); keep `uploads`.
  - `setUpload(key, true)`.
  - `submit()` → advance to `processing`; build `outputs` map (fixtures keyed by `nodeKey`), create `new WorkflowOrchestrator()`, store in a ref, `run(persona, outputs, emit)`; `emit` appends events; on `income_extraction` success, set `nasabah`/`pasangan` via `extractIncome(...)`; when the run resolves, `next()` → `submitted`.
  - `setComponentMode(role,key,mode)` / `setComponentWeight(role,key,weight)` → update the matching `IncomeComponent` immutably (drives live THP recalculation in the cards).
  - `reset()` → back to a fresh state (persona kept or cleared per caller).
- Keep an `orchestratorRef` and a `timersRef`; `goBack`, `selectPersona`, `reset`, and unmount all call `orchestratorRef.current?.cancel()`.

Return everything the page/panel needs: `{ persona, steps, currentStep, stepIndex, canGoBack, events, nasabah, pasangan, selectPersona, start, next, goBack, setUpload, uploads, submit, setComponentMode, setComponentWeight, reset }`.

**Manual check:** add a tiny temporary `console`/JSX dump on the page to confirm `selectPersona` then `submit` produces a stream of events and finally sets `currentStep === 'submitted'`. Remove after verifying.

**Commit:** `feat(state): useNilamFlow reducer — persona, steps, back, orchestration wiring`

### Task 2.2: `useOrchestrationFeed` helper

**Files:** Create `hooks/useOrchestrationFeed.ts`

Pure selector over `events`: returns `Map<string, OrchestrationEvent>` keyed by `nodeKey(leg,nodeId)` holding the **latest** event per node, plus helpers `statusOf(leg,id)` and `latestReasoning`. Used by the panel so each node renders its newest status without scanning the array.

**Commit:** `feat(state): orchestration feed selector`

### Task 2.3: AppShell + ShowcaseHeader + PhoneFrame

**Files:** Create `components/layout/AppShell.tsx`, `components/layout/ShowcaseHeader.tsx`, `components/phone/PhoneFrame.tsx`

- `AppShell`: copy SOFIA's (`../prototype/components/layout/AppShell.tsx`) verbatim (phone left `shrink-0`, panel right `flex-1 min-w-[480px]`, `max-w-[1400px]`, `gap-8`).
- `ShowcaseHeader`: "NILAM" wordmark (2xl bold, `tracking-wider`, `text-bri-navy`) + tagline "New Intelligent Loan Application Management" (xs uppercase, `tracking-widest`, `text-bri-muted`). Accept `className`.
- `PhoneFrame`: copy SOFIA's (`h-[760px] w-[400px] rounded-[32px] bg-white shadow-phone`, window-control strip). Children fill the frame.

**Commit:** `feat(layout): AppShell, ShowcaseHeader, PhoneFrame`

---

## PHASE 3 — Left phone screens (+ Back button)

### Task 3.1: Phone UI primitives

**Files:** Create `components/phone/ui/BackButton.tsx`, `PrimaryButton.tsx`, `UploadCard.tsx`, `DisabledOption.tsx`, `SelfieCapture.tsx`, `components/phone/PhoneStatusBar.tsx`

- `BackButton`: chevron-left + "Kembali"; `onClick`; hidden via parent when `!canGoBack`. Subtle `text-bri-muted hover:text-bri-navy`.
- `PrimaryButton`: full-width `rounded-bubble bg-bri-navy text-white py-3 font-semibold`, `disabled:opacity-40`.
- `UploadCard`: dashed `rounded-card border-2 border-dashed border-bri-line` dropzone; props `{ title, hint, uploaded, onPick }`; on click calls `onPick()` (simulates a file pick → flips to a "✓ filename.pdf" success row with `bg-bri-bg`).
- `DisabledOption`: card with a lock badge + "Segera hadir" for Non-Fix Income.
- `SelfieCapture`: framed camera-style box; click → simulated capture (shows a placeholder avatar + "✓ Terverifikasi").
- `PhoneStatusBar`: faux iOS status row (time `09:41`, signal/wifi/battery lucide icons) in `text-bri-ink/70`.

**Commit:** `feat(phone): UI primitives + back button + status bar`

### Task 3.2: Screens

**Files:** Create under `components/phone/screens/`: `OpeningScreen.tsx`, `IncomeTypeScreen.tsx`, `PayrollConfirmScreen.tsx`, `DocumentUploadScreen.tsx`, `JointDocumentScreen.tsx`, `ProcessingScreen.tsx`, `SubmittedScreen.tsx`

Each screen receives the slice of `useNilamFlow` it needs (via props from the page) and renders inside a column with `PhoneStatusBar` on top and (except opening/processing) a header row with `BackButton`. Behaviors per design doc §8:
- `OpeningScreen`: NILAM wordmark/glyph, short description, **Start** (`PrimaryButton`) → `start()`. (Persona must be selected first; if none, Start is disabled with hint "Pilih persona di panel kanan".)
- `IncomeTypeScreen`: two options — **Fix Income** (`PrimaryButton`-style card, `onClick → next()`) and **Non Fix Income** (`DisabledOption`).
- `PayrollConfirmScreen`: info card "Terdeteksi nasabah Payroll BRI — data payroll & internal akan digunakan", **Konfirmasi** → `submit()`.
- `DocumentUploadScreen`: two `UploadCard`s (Slip Gaji, Mutasi 12 bln) wired to `setUpload`; **Submit** appears/enables when both uploaded → `next()` if joint else `submit()`.
- `JointDocumentScreen`: KTP `UploadCard`, `SelfieCapture`, spouse Slip Gaji + spouse Mutasi `UploadCard`s; **Submit** when all present → `submit()`.
- `ProcessingScreen`: centered premium "Memproses aplikasi…" with an animated ring/`animate-glow-pulse`; no back. (Auto-advances when orchestrator resolves.)
- `SubmittedScreen`: elegant success — animated ✓ (Framer Motion scale/draw), "Application submitted. Waiting for analyst review.", a faux application ID, and a subtle **"Mulai aplikasi baru"** → `reset()`.

**Commit:** `feat(phone): all flow screens`

### Task 3.3: Wire screens into the page with transitions

**Files:** Modify `app/page.tsx`

Replace the placeholder. Instantiate `useNilamFlow()`, render `AppShell` with:
- `phone`: `<PhoneFrame>` containing an `AnimatePresence mode="wait"` that switches the screen by `currentStep` (slide-x + fade, ~0.25s). Header row shows `BackButton` when `canGoBack`.
- `panel`: `<BehindTheScenePanel .../>` (built in Phase 4).

**Manual check:** click through all 4 personas (selecting in the right panel once Phase 4 exists; until then temporarily default a persona) and confirm screens advance and Back reverses. **Commit:** `feat(app): wire phone flow with screen transitions`

---

## PHASE 4 — Right behind-the-scenes panel

### Task 4.1: Common panel primitives

**Files:** Create `components/common/SectionHeading.tsx`, `LiveIndicator.tsx`, `GlassCard.tsx`; `components/orchestration/ConfidenceMeter.tsx`

- `SectionHeading`: 11px uppercase semibold `tracking-tight text-bri-muted` (copy SOFIA).
- `LiveIndicator`: emerald `animate-ping` ring + solid dot + "Live" (copy SOFIA `LiveReasoningIndicator`).
- `GlassCard`: `rounded-card bg-nilam-glass backdrop-blur-sm ring-1 ring-bri-line shadow-soft` wrapper (the "light glassmorphism" premium touch).
- `ConfidenceMeter`: copy SOFIA's (animated navy fill + % + level chip).

**Commit:** `feat(panel): common primitives + confidence meter`

### Task 4.2: PersonaSelector + PersonaSwitcher + JourneyFlowTracker

**Files:** Create `components/orchestration/PersonaSelector.tsx`, `PersonaSwitcher.tsx`, `JourneyFlowTracker.tsx`

- `PersonaSelector` (shown at `opening`): 4 `PERSONAS` as selectable `GlassCard`s showing `label` + attribute chips (Payroll/Non-Payroll, Joint/Non-Joint). Selected → `bg-bri-navy text-white` highlight; calls `selectPersona(id)`.
- `PersonaSwitcher` (shown after start): compact chip with `persona.shortLabel` + chevron; opening it lists personas; choosing one calls `selectPersona` (which resets the flow). Mirror SOFIA `PersonaSwitcher`.
- `JourneyFlowTracker`: horizontal stepper over `steps` (filter out internal-only if desired), current step = filled `bg-bri-navy` + emerald `animate-pulse` dot, past = filled, future = outline; connectors navy when both ends done. Mirror SOFIA `HorizontalFlowStateTracker`.

**Commit:** `feat(panel): persona selector/switcher + journey tracker`

### Task 4.3: PipelineNode + node groups

**Files:** Create `components/orchestration/PipelineNode.tsx`, `OcrPipeline.tsx`, `FraudDetectionPanel.tsx`, `SlikRetrievalPanel.tsx`, `ExtractedFieldsCard.tsx`, `ReasoningLog.tsx`

- `PipelineNode`: one node row — icon (lucide per `group`), `label`, and a status visual:
  - `idle`: muted dot, "Menunggu".
  - `running`: `animate-glow-pulse` ring + a Framer Motion progress bar (width→`progress`) + `scan-shimmer` overlay + the streamed `reasoning` line.
  - `success`: emerald check + (if present) `ConfidenceMeter`.
  Driven by the latest event from `useOrchestrationFeed`.
- `OcrPipeline`: groups the OCR/validation nodes; as `ocr_mutasi` succeeds, reveal extracted buckets (Gaji/THR/Bonus/Insentif `count/sum/min`) with staggered fade.
- `FraudDetectionPanel`: lists fraud `checks` ticking to passed + overall `ConfidenceMeter`.
- `SlikRetrievalPanel`: "bureau retrieval" animation → `facilities` rows → highlighted **Total Angsuran** (with a note "→ feeds Angsuran in the income card"), plus `reasoning`.
- `ExtractedFieldsCard` (joint): NIK / Nama / Gender / Tanggal Lahir reveal as `identity_ocr` succeeds.
- `ReasoningLog`: streaming list of the latest reasoning lines (newest on top), monospace-ish, `text-bri-muted`.

**Commit:** `feat(panel): pipeline node + OCR/fraud/SLIK/identity/reasoning views`

### Task 4.4: BehindTheScenePanel container

**Files:** Create `components/orchestration/BehindTheScenePanel.tsx`

Mirror SOFIA `BehindTheScenePanel`: 760px white panel, header (`Cpu` badge + "Behind The Scene Logic" + `LiveIndicator`), `scroll-thin` body with staggered `motion.div` sections. Content by `currentStep`:
- `opening` → `PersonaSelector`.
- input steps → `JourneyFlowTracker` + `PersonaSwitcher` + pipeline nodes in `idle` preview + idle `ReasoningLog`.
- `processing` → tracker + live `OcrPipeline`/`Fraud`/`SLIK`/`ExtractedFields` + `ReasoningLog`.
- `submitted` → tracker (all done) + the full completed pipeline summary + **Customer Cards + THP Engine** (Phase 5).

**Manual check:** run a non-payroll-joint persona end-to-end; watch nodes animate idle→running→success with reasoning and SLIK producing Angsuran. **Commit:** `feat(panel): BehindTheScenePanel orchestration container`

---

## PHASE 5 — Customer cards + THP engine (the centerpiece)

### Task 5.1: IncomeComponentRow (avg/min toggle + weight slider + live adjusted)

**Files:** Create `components/orchestration/IncomeComponentRow.tsx`

Props: `{ component: IncomeComponent, onMode(mode), onWeight(weight) }`. Render:
- label (`Gaji/THR/Bonus/Insentif`),
- segmented **avg | min** toggle (active = `bg-bri-navy text-white`),
- a native `range` input (`min=0 max=1 step=0.05`) styled premium (accent navy),
- the **adjusted value only** (formatted `Rp`, `tabular-nums`), animated count-up on change (Framer Motion `animate` on a number, or a small `useAnimatedNumber` hook).
`adjusted = (mode==='avg'?avg:min) * weight` — recomputed from props each render; parent owns state via `setComponentMode/Weight`.

**Commit:** `feat(cards): income component row with avg/min + weight slider`

### Task 5.2: CustomerCard

**Files:** Create `components/orchestration/CustomerCard.tsx`

Props: `{ income: CustomerIncome, onMode, onWeight }`. A `GlassCard` titled by role ("Nasabah" / "Pasangan Nasabah") with an avatar/initial; renders the 4 `IncomeComponentRow`s + a read-only **Angsuran** row (`from SLIK` tag, not weighted). Mirror SOFIA card spacing/ring.

**Commit:** `feat(cards): CustomerCard (Nasabah / Pasangan)`

### Task 5.3: ThpEngineCard (explainable formula + live recalc)

**Files:** Create `components/orchestration/ThpEngineCard.tsx`

Props: `{ nasabah: CustomerIncome, pasangan?: CustomerIncome }`. Compute via `computeJointThp`. Render:
- the visual formula `THP = Gaji + THR + Bonus + Insentif − Angsuran` with the **live adjusted intermediate values** substituted per role,
- per-role THP, and **THP Total** (joint) with animated count-up,
- an "explainable breakdown" list (each component's mode/weight → adjusted).
Recomputes instantly because the income objects are owned by `useNilamFlow` and updated by the slider/toggle actions.

**Commit:** `feat(thp): explainable THP engine card with live recalculation`

### Task 5.4: Mount cards in the panel's submitted state

**Files:** Modify `components/orchestration/BehindTheScenePanel.tsx`

In `submitted`, render `CustomerCard`(s) + `ThpEngineCard`, wired to `nasabah/pasangan` and `setComponentMode/Weight`.

**Manual check:** at the final state, drag a slider / toggle avg↔min and confirm the adjusted value and THP (+ THP Total for joint) update live. **Commit:** `feat(panel): interactive cards + THP in final state`

---

## PHASE 6 — Choreography, full runs, polish

### Task 6.1: Tune orchestration timing & reasoning

Adjust per-node delays so the whole pipeline feels like a real engine (~6–12s total). Ensure reasoning lines read like genuine AI steps (Indonesian, banking-accurate). Verify `prefers-reduced-motion` collapses animations.

**Commit:** `polish: orchestration timing + reasoning copy`

### Task 6.2: End-to-end pass on all 4 personas

Manually run each persona; verify against design doc §14 success criteria:
1. branching correct (payroll skip, joint leg), 2. panel in sync, 3. **Angsuran from SLIK**, 4. avg/min + weight → adjusted-only + live THP + THP Total, 5. Back rolls back + preserves input, 6. premium look, 7. `npm test` green.

Fix any gaps; commit per fix.

### Task 6.3: README + final verification

**Files:** Create `README.md` (what NILAM is, how to run, the 4 personas, the module map, "simulated backend" disclaimer).

```bash
npm test          # all green
npm run build     # production build succeeds
npm run dev       # smoke-test all personas
```

**Commit:** `docs: NILAM README + final verification`

---

## Notes for the executor

- **Mirror SOFIA, don't reinvent:** for any styling question, open the analog in `../prototype` and match its tokens/classes.
- **The orchestrator owns latency; engines stay pure** — keeps logic unit-testable.
- **One store, two views:** never let the phone screens and the panel hold separate copies of flow state.
- **Angsuran always comes from the SLIK node** — surface that lineage visibly in the SLIK panel.
- **Commit after every task.** Keep `npm test` green from Phase 1 onward.
