# NILAM Prototype

**New Intelligent Loan Application Management** — an interactive demo prototype
showcasing a modular, event-driven loan onboarding and income-assessment engine
built for BRI.

> Design docs: [`docs/plans/`](docs/plans/)

---

## What NILAM Is

NILAM is not a prettier form. It is a **governed, auditable, modular decision
pipeline** for income assessment and loan onboarding. The framework is
designed to be embeddable into BRImo, RM Tools, underwriting platforms, or
conversational AI — wherever a loan decision needs to be made.

This prototype demonstrates the engine internals visually, following the same
two-canvas showcase model as the SOFIA prototype that precedes it.

**Scope:** Fix Income customers only. Non-Fix Income is shown in the UI but is
disabled ("coming soon").

---

## The Two Canvases

The page renders two **fixed-size canvases** side by side, with a centered
NILAM wordmark above and a System Status footer below. Because both canvases
are fixed-px (`360×900` mobile, `960×900` dashboard), browser zoom scales them
uniformly and proportions stay identical at any resolution. Only the page
scrolls — the canvases never scroll internally; on narrow screens the dashboard
wraps below the phone.

| Left — Mobile App canvas | Right — Behind The Scene Logic canvas |
|---|---|
| The customer's view: an iPhone mockup running the loan-onboarding flow, with a 5-step **Flow Stepper** pinned beneath it. | The **NILAM Engine** dashboard — a real-time AI orchestration panel. A `Demo Mode` pill is pinned to its header. |

The right canvas renders a live event-driven pipeline as it executes — OCR
extraction, document validation, fraud screening, identity check, SLIK bureau
retrieval, income extraction, and THP (Take Home Pay) computation. Every node
emits lifecycle events (`running → success`), making the underwriting decision
**explainable** to RM and risk stakeholders.

**Key design note:** Angsuran (monthly debt obligation) is an **output of the
SLIK Retrieval engine** — it comes from the bureau pull, not OCR. This matches
how it works in production underwriting.

---

## The Dashboard (Behind The Scene Logic)

A fixed, no-scroll grid that fills the canvas. Top to bottom:

- **Application Status Bar** — the 5-second headline outcome. Transitions
  `idle → processing → eligible`, ending on a bold **VERIFIED & ELIGIBLE**
  badge with a confidence score and a `LOW RISK` chip.
- **Row A** — a narrow left column (**Custom Persona** selector stacked above an
  **AI Underwriting Insight** card showing the model's *conclusions*, not the
  workflow) beside the **AI Orchestration Pipeline** and the OCR row
  (**OCR Processing** + raw **OCR JSON** tokenizer).
- **Row B** — **Fraud Detection** · **Identity Check** (joint only) · **SLIK
  Retrieval**.
- **Row C** — **Income Components — Nasabah** · **Income Components — Pasangan**
  (joint only) · **THP Calculation Engine**.

The **THP Engine** is the dashboard **hero**: THP is the final output of the
whole orchestration, so it gets extra width, a premium navy→blue treatment, and
an animated count-up of the total Take-Home Pay (nasabah + pasangan when joint),
plus a `RUMUS` formula strip (weighted income components − angsuran).

---

## The Customer Flow

Every application follows the **same fixed 6-step flow**, surfaced in the Flow
Stepper beneath the phone:

```
Opening → Income Type → Joint Income → Requirement → Processing → Analyst Decision
```

- **Income Type** — Fix Income is selectable; Non-Fix Income is "coming soon".
- **Joint Income** — the customer answers *joint or single*; this drives whether
  the spouse (**pasangan**) legs appear across the dashboard.
- **Requirement** — adapts to the persona: **Payroll** customers skip document
  upload (payroll is pulled from BRI core banking), while **Non-Payroll**
  customers upload Slip Gaji + Mutasi Rekening.
- **Processing → Analyst Decision** — Submit kicks the orchestrator; when the
  pipeline finishes, the flow advances to the analyst decision.

### Choosing a persona

The persona is set on the dashboard's **Custom Persona** control — two segmented
toggles, **Nasabah Utama** and **Pasangan**, each `Payroll | Non-Payroll`
(default: Nasabah *Payroll*, Pasangan *Non-Payroll*). Changing either toggle
**resets the flow**. Joint vs. single is chosen in-flow on the Joint Income
screen.

---

## The Pipeline

A single canonical **8-stage pipeline** runs for every application:

```
Upload → OCR → Validasi Dokumen → Fraud Detection → Identity Check
       → SLIK Retrieval → Income Extraction → THP Engine
```

Each node emits `running → success` lifecycle events with mock outputs. The
**joint-income legs** (Identity Check, plus the spouse's SLIK & income) only
populate when the customer answered "joint"; otherwise they resolve empty and
their dashboard cards are hidden.

### OCR Processing & mutasi gap detection

The **OCR Processing** card groups extraction by party (**Nasabah Utama**, plus
**Pasangan Nasabah** when joint) and by document (**Slip Gaji**, **Mutasi
Rekening**). Slip Gaji shows the extracted period; Mutasi runs **coverage
analysis** — *X of 12 months detected* with per-month chips and interior-gap
flagging. A **demo-only** `Lengkap | Gap` toggle (gated by `DEMO_CONTROLS`,
see below) flips mutasi between complete data and a missing-month scenario.

---

## Module Map

```
app/
  page.tsx                    Wires useNilamFlow → AppShell (MobileApp + BehindTheScene)
  layout.tsx, globals.css     Root layout + BRI design tokens / .scroll-thin

components/
  layout/                     AppShell (SOFIA two-canvas frame), AppHeader, AppFooter
  mobile/                     Left canvas — PhoneMockup, MobileHeader, BottomNav, FlowStepper
    screens/                  Opening, IncomeType, JointIncome, Requirement, Processing,
                               AnalystDecision (one per FlowStep)
  dashboard/                  Right canvas — BehindTheScene (the grid) + its cards:
                               ApplicationStatusBar, PersonaSelector, AiInsightCard,
                               OrchestrationPipeline, OcrProcessingCard, OcrJsonCard,
                               FraudDetectionCard, IdentityCheckCard, SlikRetrievalCard,
                               IncomeComponentsCard, ThpEngineCard, SpiderChart

engines/
  orchestrator/
    workflowOrchestrator.ts   Event-emitting async pipeline runner (per-node delay + cancellable)
    pipelines.ts              PIPELINE_NODES — the canonical 8-stage node list
    events.ts                 EventListener type contract
  ocr/
    ocrEngine.ts              OCR engine — extracts slip gaji & mutasi components
    coverage.ts               analyzeOcrCoverage() — month coverage + interior-gap detection
  fraud/                      Fraud screening & liveness engine (confidence-scored)
  slik/                       SLIK retrieval engine — produces totalAngsuran
  income/                     Income extraction engine — structures avg/min per component
  thp/                        THP computation engine — computeThp / computeJointThp
  persona/
    personaEngine.ts          planFlow() — pure function returning the fixed FlowStep[]

hooks/
  useNilamFlow.ts             Central state machine (useReducer) + orchestration kick
  useOrchestrationFeed.ts     Derives O(1) latest-event Map + statusOf() from the event stream
  useCountUp.ts               Animated integer count-up; respects prefers-reduced-motion

data/
  personas.ts                 DEFAULT_PERSONA
  ocrFixtures.ts              Mock OCR outputs + month-coverage fixtures (full / gap variants)
  fraudFixtures.ts            Mock fraud result (per-check + overall scores)
  slikFixtures.ts             Mock SLIK outputs (SLIK_NASABAH, SLIK_PASANGAN)
  incomeFixtures.ts           Mock structured income (NASABAH_INCOME, PASANGAN_INCOME)

lib/
  formatRupiah.ts             Rupiah/juta formatters (handles negatives with proper − sign)
  cn.ts                       Tailwind class merger (clsx + tailwind-merge)
  demo.ts                     DEMO_CONTROLS flag — gates demo-only controls

types/
  flow.ts                     FlowStep, PersonaConfig
  orchestration.ts            OrchestrationEvent, NodeId, NodeStatus, nodeKey()
  income.ts                   CustomerIncome, IncomeComponent, ComponentKey, ComponentMode
  engines.ts                  OcrSlipResult, OcrMutasiResult, FraudResult, SlikResult, IdentityResult
```

---

## Running the App

```bash
npm install
npm run dev          # Development server → http://localhost:3000
npm test             # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
npm run lint         # Next.js lint
npm run build        # Production build verification
```

**Tests** cover the pure logic: `thpEngine`, `personaEngine`,
`incomeExtractionEngine`, OCR `coverage`, orchestrator `pipelines`, and the
`useNilamFlow` reducer.

### Demo Mode

Demo-only controls (e.g. the OCR `Lengkap | Gap` simulator) are gated behind
`DEMO_CONTROLS`, which defaults to **on**. Set
`NEXT_PUBLIC_DEMO_CONTROLS=false` in a production build to hide every demo-only
control at once.

---

## Simulated-Backend Disclaimer

All engines (`engines/`) return mock fixture data with simulated async
latency. No real APIs are called. No PII is processed. The SLIK figures,
OCR outputs, fraud scores, and confidence values are illustrative only and
are designed to demonstrate the pipeline structure and UI pattern — not to
represent actual credit bureau or bank data.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.1.6 (App Router) |
| UI | React 19, TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 (BRI design tokens) |
| Animation | Framer Motion 11 |
| Icons | lucide-react |
| Class utils | clsx + tailwind-merge |
| Tests | Vitest 2 |

---

*NILAM Prototype — BRI Data Science · 2026*
