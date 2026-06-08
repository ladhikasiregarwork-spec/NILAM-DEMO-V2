# NILAM Prototype — Design Document

**Date:** 2026-06-01
**Author:** Davin D. Bhagaspati (Data Scientist, BRI) with Claude
**Status:** Approved — ready for implementation planning

---

## 1. What NILAM is

**NILAM — New Intelligent Loan Application Management.** Not a standalone app, but an
**intelligent, modular framework/engine** for loan onboarding and income assessment, intended
to be embeddable into BRImo, RM Tools, the underwriting platform, a conversational AI/chatbot,
or a standalone loan engine.

This deliverable is a **visual interactive demo prototype** that showcases how NILAM works
internally. It follows the proven pattern of the existing **SOFIA** prototype (in `../prototype`):
a split screen with a mobile-app simulation on the left and a "behind-the-scenes" AI
orchestration panel on the right.

**Business "so what?":** the value of NILAM is not a prettier form — it is demonstrating that
income assessment is a **governed, auditable, modular decision pipeline**. The demo makes the
underwriting reasoning **explainable** to RM / underwriting / risk stakeholders, and shows the
engine is **re-orderable and extensible** (slot in new analytics nodes without touching the UI).

### Scope of this prototype
- Covers **Fix Income** customers only.
- **Non Fix Income** appears in the UI but its button is **disabled** ("coming soon").
- All backends are **simulated** (mock JSON + simulated async latency). No real APIs.

---

## 2. Decisions locked during brainstorming

| Decision | Choice | Rationale |
|---|---|---|
| Visual theme | **SOFIA light, refined** | Maximum sibling-consistency with SOFIA; premium feel delivered via light glassmorphism, soft gradients, motion — not a dark reskin. |
| Build approach | **Step-by-step inline** | Coherent design system + engines; reviewed at each phase boundary. No multi-agent workflow. |
| Demo numbers | **Realistic mock values** | Editable later. |
| **Angsuran source** | **Output of the SLIK Retrieval engine** (AI analysis of the bureau pull), *not* OCR | Matches how it works in reality; modelled explicitly in the pipeline. |
| Architecture | **A+B blend** — SOFIA's file conventions + an **event-driven orchestrator** | Real-time, explainable, modular/scalable per the spec. |
| Back navigation | **First-class** in the state machine (added requirement) | Guided multi-step flow needs reversible navigation. |

---

## 3. Stack (identical to SOFIA → siblings)

- **Next.js 15.1.6** (App Router) · **React 19** · **TypeScript 5.7**
- **Tailwind 3.4** — reuse SOFIA `bri` color tokens, `card/bubble/pill` radii, `soft/panel/phone`
  shadows; add NILAM-specific glass/gradient utilities + `scan-shimmer` / `glow` keyframes.
- **Framer Motion 11** — screen transitions, staggered panel reveals, progress bars, count-up.
- **lucide-react** icons · `clsx` + `tailwind-merge` via `cn()`.
- **Vitest** — unit tests for the parts where correctness matters: `thpEngine`, `personaEngine`,
  `planFlow`.

---

## 4. System architecture

```
                          ┌─────────────────────────────────────────────┐
                          │            UI State Manager                  │
                          │  useNilamFlow()  ── persona, step, trace     │
                          └───────────────┬─────────────────────────────┘
                                          │ dispatch(action)
                  ┌───────────────────────▼────────────────────────┐
                  │           Workflow Orchestrator                 │
                  │  runs engines as NODES, emits lifecycle events  │
                  └──┬──────┬──────┬───────┬────────┬───────────────┘
        ┌────────────▼┐ ┌───▼────┐ ┌▼─────┐ ┌▼──────┐ ┌▼──────────┐
        │ OCR Engine  │ │ Fraud  │ │ SLIK │ │Income │ │ THP Engine│   ← Persona Engine
        │             │ │ Engine │ │Engine│ │Extract│ │           │      gates which
        └─────────────┘ └────────┘ └──────┘ └───────┘ └───────────┘      nodes run
              └──────────────┴─────────┴─────────┴───────────┘
                                   │ events
        ┌──────────────────────────▼──────────────────────────┐
        │  LEFT: Phone screens   │   RIGHT: Behind-the-scenes   │
        │  (state-driven)        │   (subscribes to events)     │
        └──────────────────────────────────────────────────────┘
```

Both panels read from **one store**; they never talk to each other. Left = the *customer's* view
of the current step; right = the *engine's* view of the same moment.

### Engines run as **nodes**; each emits lifecycle events
`idle → running (progress, reasoning) → success (confidence, output) | failed`. The right panel
subscribes to the event feed and animates node-by-node in real time. Adding an engine = adding a
node; nodes are re-orderable per persona.

`thpEngine` is **pure & synchronous** (no I/O) so it can drive instant live recalculation from
the sliders and be unit-tested.

---

## 5. Folder structure

```
nilam_prototype/
├── app/  layout.tsx · page.tsx (AppShell) · globals.css
├── components/
│   ├── layout/      AppShell · ShowcaseHeader
│   ├── phone/       (LEFT — mobile app UI)
│   │   ├── PhoneFrame · PhoneStatusBar
│   │   ├── screens/ OpeningScreen · IncomeTypeScreen · PayrollConfirmScreen ·
│   │   │            DocumentUploadScreen · JointDocumentScreen · ProcessingScreen ·
│   │   │            SubmittedScreen
│   │   └── ui/      UploadCard · PrimaryButton · DisabledOption · SelfieCapture · BackButton
│   ├── orchestration/ (RIGHT — behind-the-scenes)
│   │   ├── BehindTheScenePanel · JourneyFlowTracker · PipelineNode
│   │   ├── OcrPipeline · FraudDetectionPanel · SlikRetrievalPanel · ExtractedFieldsCard
│   │   ├── ReasoningLog · PersonaSelector · PersonaSwitcher
│   │   ├── CustomerCard · IncomeComponentRow · ThpEngineCard · ConfidenceMeter
│   └── common/      SectionHeading · LiveIndicator · GlassCard
├── engines/  (THE MODULAR CORE)
│   ├── orchestrator/ workflowOrchestrator.ts · pipelines.ts · events.ts
│   ├── ocr/ocrEngine.ts · fraud/fraudEngine.ts · slik/slikEngine.ts
│   ├── income/incomeExtractionEngine.ts · thp/thpEngine.ts · persona/personaEngine.ts
├── hooks/  useNilamFlow.ts · useOrchestrationFeed.ts
├── data/   personas.ts · ocrFixtures.ts · slikFixtures.ts
├── types/  flow.ts · engines.ts · orchestration.ts · income.ts
├── lib/cn.ts
└── tailwind.config.ts · tsconfig.json · next.config.mjs · postcss.config.mjs · package.json
    + engines/*.test.ts (Vitest)
```

---

## 6. Engine contracts

```ts
// types/orchestration.ts
export type NodeId =
  | 'payroll_pull' | 'ocr_slip' | 'ocr_mutasi' | 'doc_validation'
  | 'fraud_screening' | 'doc_classification' | 'identity_ocr'
  | 'liveness_selfie' | 'slik_retrieval' | 'income_extraction' | 'thp_computation';
export type NodeStatus = 'idle' | 'running' | 'success' | 'failed';
export interface OrchestrationEvent {
  nodeId: NodeId; status: NodeStatus; label: string;
  progress?: number;   // 0..1 running bar
  confidence?: number; // 0..1 fraud/identity meter
  reasoning?: string;  // one streamed AI-reasoning line
  output?: unknown; ts: number;
}

// types/engines.ts  (the supplied OCR JSON, typed)
export interface OcrSlipResult { Gaji: number }                       // slip gaji
export interface OcrBucket { count: number; sum: number; min: number }
export interface OcrMutasiResult { Gaji: OcrBucket; THR: OcrBucket; Bonus: OcrBucket; Insentif: OcrBucket }
export interface FraudResult { passed: boolean; confidence: number; checks: {name:string;passed:boolean;score:number}[] }
export interface SlikResult { found: boolean; facilities:{lender:string;type:string;installment:number}[]; totalAngsuran: number; reasoning: string }
export interface IdentityResult { NIK:string; Nama:string; Gender:'L'|'P'; TanggalLahir:string; isPayrollBRI:boolean }

// types/income.ts  (THP / card model)
export type ComponentMode = 'avg' | 'min';
export interface IncomeComponent { key:'Gaji'|'THR'|'Bonus'|'Insentif'; avg:number; min:number; mode:ComponentMode; weight:number }
//   adjusted = (mode === 'avg' ? avg : min) * weight
export interface CustomerIncome { role:'nasabah'|'pasangan'; name:string; components:IncomeComponent[]; angsuran:number }
export interface ThpResult { adjusted:Record<string,number>; grossBeforeAngsuran:number; angsuran:number; thp:number }
```

Each engine is `async function run(input): Promise<Result>`; the orchestrator wraps it to emit
`running → success` with simulated latency. THP is pure/sync.

---

## 7. Persona engine — branching state machine

```ts
export type FlowStep =
  | 'opening' | 'income_type' | 'payroll_confirm'
  | 'document_upload' | 'joint_documents' | 'processing' | 'submitted';

export interface PersonaConfig {
  id: string; label: string;
  incomeType: 'fix';            // 'non_fix' exists in UI but disabled
  isPayrollBRI: boolean; isJointIncome: boolean;
}

export function planFlow(p: PersonaConfig): FlowStep[] {
  const steps: FlowStep[] = ['opening'];
  if (p.isPayrollBRI) steps.push('payroll_confirm');         // income known + docs auto-pulled
  else steps.push('income_type', 'document_upload');          // choose Fix, then upload
  if (p.isJointIncome) steps.push('joint_documents');         // spouse docs always uploaded
  steps.push('processing', 'submitted');
  return steps;
}
```

### The 4 personas (selecting one drives the whole flow; changing mid-flow → full reset)

| Persona | Skip income-type? | Customer uploads | Joint card? |
|---|---|---|---|
| Fix + Payroll BRI + Non-Joint | yes (`payroll_confirm`) | nothing — auto-pulled | no |
| Fix + Payroll BRI + Joint | yes | spouse KTP/selfie/slip/mutasi | yes |
| Fix + Non-Payroll + Non-Joint | no — shows Fix/Non-Fix | own slip + mutasi 12bln | no |
| Fix + Non-Payroll + Joint | no | own + spouse docs | yes |

### Pipeline per persona (nodes the orchestrator fires)
- **Payroll, Non-Joint:** `payroll_pull → slik_retrieval → income_extraction → thp_computation`
- **Non-Payroll, Non-Joint:** `ocr_slip → ocr_mutasi → doc_validation(12-mo) → fraud_screening
  → doc_classification → slik_retrieval → income_extraction → thp_computation`
- **+ Joint (either):** append spouse leg `identity_ocr(KTP) → liveness_selfie(selfie vs KTP)
  → ocr_slip → ocr_mutasi → fraud_screening → slik_retrieval → income_extraction`, then a final
  `thp_computation` producing **THP Total = THP Nasabah + THP Pasangan**.

**PayrollConfirm decision:** Payroll personas see a confirm screen ("Terdeteksi nasabah Payroll
BRI; data payroll & internal akan digunakan") instead of upload — making the *Payroll =
frictionless onboarding* story explicit (minimal left effort, rich right activity).

---

## 8. UX flow — LEFT phone screens (with Back)

Every screen except `opening` and `processing` shows a **chevron-left Back button** in a slim header.

| Step | Screen | Back → | Primary action |
|---|---|---|---|
| 1 | Opening — NILAM wordmark, tagline, **Start** | — | Start |
| 2 | IncomeType *(Non-Payroll)* — `Fix` ✅ / `Non Fix` 🔒 | opening | Fix → upload |
| 3a | PayrollConfirm *(Payroll)* | opening | Confirm → processing/joint |
| 3b | DocumentUpload *(Non-Payroll)* — Slip Gaji + Mutasi 12bln; Submit when both present | income_type | Submit → processing/joint |
| 4 | JointDocuments *(Joint)* — KTP, Selfie+KTP, spouse Slip Gaji, spouse Mutasi 12bln | prev upload | Submit → processing |
| — | Processing — premium "memproses…" | hidden | auto-advance on completion |
| 5 | Submitted — "Application submitted. Waiting for analyst review." ✓ | hidden → **"Mulai aplikasi baru"** (full reset) | done |

### Back semantics (state manager)
`useNilamFlow` holds `stepIndex` into `planFlow(persona)`. `goBack()`:
1. decrements the index,
2. **cancels in-flight orchestrator timers** (SOFIA-style cleanup),
3. **rolls orchestration events back** to that step's snapshot (later nodes → `idle`),
4. **preserves entered data** (uploads/toggles) so the user can edit and re-submit.

Left and right stay in sync because both read the same store.

---

## 9. RIGHT panel — behind-the-scenes choreography

- **Persistent top:** `JourneyFlowTracker` (horizontal stepper over the persona's actual steps) +
  compact `PersonaSwitcher` chip (change → full reset from `opening`).
- **At `opening`:** `PersonaSelector` — the 4 personas as selectable cards (required by spec).
- **During upload steps:** pipeline nodes shown `idle` (preview) + ReasoningLog idle.
- **During `processing`:** nodes fire sequentially — `idle → running` (progress + streamed reasoning
  line) `→ success` (✓ + confidence). Order: OCR pipeline (fields populate live) → doc validation
  (12-mo check) → Fraud (checks pass, ConfidenceMeter) → [joint: Identity OCR + Selfie-vs-KTP
  liveness] → SLIK (bureau pull → facilities → **computed Angsuran**) → Income extraction → THP.
- **At `submitted` (final state):** all nodes ✓; **Customer Cards + THP Engine become interactive**
  — the analyst-facing "explainable underwriting" surface.

---

## 10. Centerpiece — Customer Cards + THP Engine

- **CustomerCard** per role (`Nasabah`, and `Pasangan` when joint). Each lists 4
  **IncomeComponentRow**s (Gaji, THR, Bonus, Insentif) + an **Angsuran** row.
- Each component row: label · **avg/min** segmented toggle · **0–1 weight slider** · **live
  adjusted value** (only the adjusted value is displayed).
  `adjusted = (mode === 'avg' ? avg : min) × weight` — e.g. Gaji avg 10jt, slider 0.5 → **5jt**.
  *Angsuran is read-only* (from SLIK, not weighted).
- **ThpEngineCard** — explainable formula with live intermediate values:
  `THP = Gaji + THR + Bonus + Insentif − Angsuran`, recomputed instantly on any toggle/slider via
  the pure `thpEngine` with animated count-up. Joint → **THP Nasabah**, **THP Pasangan**,
  **THP Total = sum**.

### Mock figures (editable)
- **Nasabah** (from OCR mutasi): Gaji 10jt (min 10), THR 20jt (min 20), Bonus 30jt (min 10),
  Insentif 1jt (min 1); **Angsuran 2.5jt (from SLIK)**.
- **Pasangan**: Gaji 8jt, THR 8jt, Bonus 12jt (min 5), Insentif 0.8jt; **Angsuran 1.5jt (from SLIK)**.

> Note: `avg = sum / count`, `min = bucket.min` derived from the mutasi JSON. The THP formula is
> kept literal to the spec for explainability; a production system would normalize annual vs
> monthly components — noted as a future refinement.

### Supplied OCR fixtures
```jsonc
// Slip Gaji
{ "Gaji": 10000000 }
// Mutasi 12 bulan
{ "Gaji":    { "count": 12, "sum": 120000000, "min": 10000000 },
  "THR":     { "count": 1,  "sum": 20000000,  "min": 20000000 },
  "Bonus":   { "count": 2,  "sum": 60000000,  "min": 10000000 },
  "Insentif":{ "count": 6,  "sum": 6000000,   "min": 1000000  } }
```

---

## 11. Animation approach

- **Framer Motion:** `AnimatePresence` slide/fade between phone screens; staggered panel reveals
  (`staggerChildren: 0.06`); progress bars `width 0→1` easeOut 0.6s; node status transitions;
  **count-up** on adjusted values & THP.
- **Tailwind keyframes:** `animate-pulse` / `animate-ping` live dots (SOFIA); new **scan-shimmer**
  (OCR) and **glow** (active node).
- `prefers-reduced-motion` respected throughout.

---

## 12. State management

- **`useNilamFlow`** (reducer) — single source of truth: `persona`, `stepIndex`, `uploads`,
  `orchestration events`, `customer income (cards)`. Actions: `selectPersona`, `start`, `next`,
  `goBack`, `setUpload`, `submit` (kicks orchestrator), `setComponentMode`, `setComponentWeight`,
  `reset`. Persona change and `reset` clear all derived state and timers (SOFIA `switchProfile`).
- **`useOrchestrationFeed`** — subscribes to orchestrator events, exposes node statuses to the panel.
- **`workflowOrchestrator`** — given persona + uploads, runs the persona's pipeline, emitting
  events with simulated latency; cancellable (for `goBack` / persona change).

---

## 13. Implementation roadmap (inline; review at each phase boundary)

- **Phase 0 — Scaffold:** Next 15 app, tailwind (SOFIA tokens + glass/glow), globals.css, `cn`,
  package.json, layout. *Verify dev server boots.*
- **Phase 1 — Engines + types + data + tests:** all `engines/*`, `types/*`, fixtures; **Vitest** for
  `thpEngine`, `personaEngine`, `planFlow`. *(Testable core first.)*
- **Phase 2 — State + shell:** `useNilamFlow`, `useOrchestrationFeed`, `AppShell`, `PhoneFrame`,
  panel skeleton.
- **Phase 3 — Left screens:** all screens + ui primitives + **Back button** + transitions.
- **Phase 4 — Right panel:** JourneyFlowTracker, PipelineNode, OcrPipeline, Fraud, SLIK,
  ExtractedFields, ReasoningLog, PersonaSelector.
- **Phase 5 — Cards + THP:** CustomerCard, IncomeComponentRow (avg/min + slider), ThpEngineCard
  live recalc + count-up.
- **Phase 6 — Choreography + polish:** wire event timing to animations, run all 4 personas
  end-to-end, reduced-motion, final polish + browser verification.

---

## 14. Success criteria

1. All **4 personas** run end-to-end with correctly branched flows (payroll skip, joint leg).
2. Right panel animates the pipeline **in sync** with the left flow; nodes show progress,
   reasoning, confidence.
3. **Angsuran** visibly originates from the **SLIK** node.
4. Customer cards support **avg/min + 0–1 weight**, showing only the **adjusted value**, with
   **live THP recalculation** (and **THP Total** for joint).
5. **Back button** reverses steps, rolls back orchestration, preserves input.
6. Visual language reads as a **premium, explainable AI underwriting engine**, sibling to SOFIA.
7. `thpEngine` / `personaEngine` / `planFlow` covered by passing **Vitest** unit tests.
