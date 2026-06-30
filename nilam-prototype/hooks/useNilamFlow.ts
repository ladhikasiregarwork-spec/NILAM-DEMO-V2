"use client";

import { useCallback, useEffect, useReducer, useRef, type Dispatch } from "react";
import type { FlowStep, PersonaConfig, SurveyStatus, AnalystDecisionStatus } from "@/types/flow";
import { SURVEY_THRESHOLD } from "@/types/flow";
import type { OrchestrationEvent, NodeId } from "@/types/orchestration";
import type { CustomerIncome, ComponentKey, ComponentMode } from "@/types/income";
import type { OcrResults, ClassifyResult, PreviewDoc } from "@/types/ocrExtract";
import type { DocumentId } from "@/types/documents";
import type { AgunanData } from "@/types/agunan";
import type { SlikReport } from "@/types/profile";
import type { UserInput } from "@/types/userInput";
import type { LoanType, Vehicle, AutoLoanCalc, AppointmentData, AutoVerifyStatus, AutoDecisionStatus } from "@/types/auto";
import { DEFAULT_DP_PCT, bestSchemeForTenor } from "@/data/autoRates";
import { usiaDariKtp } from "@/lib/usia";
import { type AgunanKlasifikasi, DEFAULT_KLASIFIKASI } from "@/data/ltv";
import type { EventListener } from "@/engines/orchestrator/events";
import { planFlow } from "@/engines/persona/personaEngine";
import { WorkflowOrchestrator } from "@/engines/orchestrator/workflowOrchestrator";
import { DEFAULT_PERSONA } from "@/data/personas";
import { SLIP_GAJI, MUTASI, IDENTITY_PASANGAN } from "@/data/ocrFixtures";
import { SLIK_NASABAH, SLIK_PASANGAN } from "@/data/slikFixtures";
import { FRAUD_RESULT } from "@/data/fraudFixtures";
import { NASABAH_INCOME, PASANGAN_INCOME } from "@/data/incomeFixtures";
import {
  DEMO_KTP,
  DEMO_KK,
  DEMO_SLIP_GAJI,
  DEMO_MUTASI,
  DEMO_SK,
  DEMO_SLIK,
  DEMO_AGUNAN,
  DEMO_DOC_COUNTS,
} from "@/data/demoSeed";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface NilamState {
  persona: PersonaConfig;
  steps: FlowStep[];
  stepIndex: number;
  jointAnswer: "ya" | "tidak" | null;
  uploads: Record<string, boolean>;
  events: OrchestrationEvent[];
  nasabah?: CustomerIncome;
  pasangan?: CustomerIncome;
  /** Real OCR-extracted data for Slip Gaji & SK Perusahaan (when uploaded). */
  ocr: OcrResults;
  /** Number of files classified per document type (e.g. how many slip/mutasi). */
  docCounts: Partial<Record<DocumentId, number>>;
  /** Collateral/property data (manual or from a Rumah123 link). */
  agunan?: AgunanData;
  /** SLIK report fetched by NIK (from the SLIK CSV). */
  slik?: SlikReport;
  /** NPW (Nilai Pasar Wajar) from the appraisal model, by agunan. */
  npw?: number;
  /** Land value portion of the NPW (for the nearby land-price comparison). */
  npwLand?: number;
  /** Collateral classification (drives LTV), shared by the dashboard + offer. */
  agunanKlas: AgunanKlasifikasi;
  /** Borrower application data (prefilled from OCR, editable on Data Diri). */
  userInput: UserInput;
  /** Uploaded documents kept for preview (blob URLs + classified type). */
  previewDocs: PreviewDoc[];
  /** Collateral-appraisal survey status (for collateral ≥ SURVEY_THRESHOLD). */
  surveyStatus: SurveyStatus;
  /** Appraised value entered by the appraiser during the survey (overrides NPW once approved). */
  surveyValue?: number;
  /** Collateral-appraisal note. */
  surveyNote?: string;
  /** Credit-analyst decision (KPR) — gates the offer; analyst approves in the dashboard. */
  analystDecision: AnalystDecisionStatus;
  /** Product chosen on the loan_type step. null until chosen. */
  loanType: LoanType | null;
  /** Auto-loan: the vehicle the customer selected from the catalog. */
  vehicle?: Vehicle;
  /** Auto-loan: calculator selections (DP / tenor / rate scheme). */
  autoLoan: AutoLoanCalc;
  /** Auto-loan: appointment booking details. */
  appointment: AppointmentData;
  /** Auto-loan: RM verification stage for the booked appointment. */
  autoVerify: AutoVerifyStatus;
  /** Auto-loan: RM verification note. */
  autoVerifyNote?: string;
  /** Auto-loan: analyst decision stage (after RM verification). */
  autoDecision: AutoDecisionStatus;
}

/** Default auto-loan calculator selections. */
const DEFAULT_AUTO_LOAN: AutoLoanCalc = {
  dpPct: DEFAULT_DP_PCT,
  tenorMonths: 36,
  schemeId: bestSchemeForTenor(36).id,
  discountPct: 0,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type NilamAction =
  | { type: "setNasabahPayroll"; value: boolean }
  | { type: "setPasanganPayroll"; value: boolean }
  | { type: "next" }
  | { type: "goTo"; step: FlowStep }
  | { type: "goBack" }
  | { type: "setJointAnswer"; answer: "ya" | "tidak" }
  | { type: "setUpload"; key: string; value?: boolean }
  | { type: "appendEvent"; event: OrchestrationEvent }
  | { type: "setIncome"; role: "nasabah" | "pasangan"; income: CustomerIncome }
  | { type: "setComponent"; role: "nasabah" | "pasangan"; key: ComponentKey; patch: { mode?: ComponentMode; weight?: number } }
  | { type: "setOcr"; doc: keyof OcrResults; data: OcrResults[keyof OcrResults] }
  | { type: "classify"; counts: Partial<Record<DocumentId, number>> }
  | { type: "clearUploads" }
  | { type: "setAgunan"; data: AgunanData }
  | { type: "clearAgunan" }
  | { type: "setSlik"; data: SlikReport }
  | { type: "setNpw"; value: number | undefined; land?: number }
  | { type: "setAgunanKlas"; patch: Partial<AgunanKlasifikasi> }
  | { type: "setUserInput"; patch: Partial<UserInput> }
  | { type: "prefillUserInput"; data: Partial<UserInput> }
  | { type: "addPreviewDocs"; docs: PreviewDoc[] }
  | { type: "setSurveyStatus"; status: SurveyStatus }
  | { type: "submitSurvey"; decision: "approved" | "rejected"; value?: number; note?: string }
  | { type: "setAnalystDecision"; status: AnalystDecisionStatus }
  | { type: "submitAnalystDecision"; decision: "approved" | "rejected" }
  | { type: "setLoanType"; loanType: LoanType }
  | { type: "setVehicle"; vehicle: Vehicle }
  | { type: "setAutoLoan"; patch: Partial<AutoLoanCalc> }
  | { type: "setAppointment"; patch: Partial<AppointmentData> }
  | { type: "submitAutoVerify"; decision: "approved" | "rejected"; note?: string }
  | { type: "submitAutoDecision"; decision: "approved" | "rejected" }
  | { type: "reset" };

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function initialState(): NilamState {
  return {
    persona: DEFAULT_PERSONA,
    steps: planFlow(DEFAULT_PERSONA, null),
    stepIndex: 0,
    jointAnswer: null,
    uploads: {},
    events: [],
    nasabah: undefined,
    pasangan: undefined,
    ocr: {},
    docCounts: {},
    userInput: {},
    previewDocs: [],
    agunanKlas: DEFAULT_KLASIFIKASI,
    surveyStatus: "none",
    analystDecision: "none",
    loanType: null,
    autoLoan: DEFAULT_AUTO_LOAN,
    appointment: {},
    autoVerify: "none",
    autoDecision: "none",
  };
}

// ---------------------------------------------------------------------------
// Helper: reset flow fields but keep persona patch applied
// ---------------------------------------------------------------------------

function resetWithPersona(persona: PersonaConfig): NilamState {
  return {
    persona,
    steps: planFlow(persona, null),
    stepIndex: 0,
    jointAnswer: null,
    uploads: {},
    events: [],
    nasabah: undefined,
    pasangan: undefined,
    ocr: {},
    docCounts: {},
    userInput: {},
    previewDocs: [],
    agunanKlas: DEFAULT_KLASIFIKASI,
    surveyStatus: "none",
    analystDecision: "none",
    loanType: null,
    autoLoan: DEFAULT_AUTO_LOAN,
    appointment: {},
    autoVerify: "none",
    autoDecision: "none",
  };
}

// ---------------------------------------------------------------------------
// Pure reducer — exported so it can be unit-tested in isolation
// ---------------------------------------------------------------------------

export function nilamReducer(state: NilamState, action: NilamAction): NilamState {
  switch (action.type) {
    case "setNasabahPayroll": {
      const persona: PersonaConfig = { ...state.persona, nasabahPayroll: action.value };
      return resetWithPersona(persona);
    }

    case "setPasanganPayroll": {
      const persona: PersonaConfig = { ...state.persona, pasanganPayroll: action.value };
      return resetWithPersona(persona);
    }

    case "next":
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex + 1, state.steps.length - 1),
      };

    case "goTo": {
      const idx = state.steps.indexOf(action.step);
      if (idx === -1) return state;
      return { ...state, stepIndex: idx };
    }

    case "goBack": {
      const leavingStep = state.steps[state.stepIndex];
      const nextIndex = Math.max(state.stepIndex - 1, 0);
      const isRollingBack = leavingStep === "processing" || leavingStep === "analyst_decision";
      return {
        ...state,
        stepIndex: nextIndex,
        // Rollback pipeline state when leaving processing or analyst_decision
        ...(isRollingBack
          ? { events: [], nasabah: undefined, pasangan: undefined }
          : {}),
      };
    }

    case "setJointAnswer":
      return { ...state, jointAnswer: action.answer };

    case "setUpload":
      return {
        ...state,
        uploads: { ...state.uploads, [action.key]: action.value ?? true },
      };

    case "appendEvent":
      return { ...state, events: [...state.events, action.event] };

    case "setIncome":
      return {
        ...state,
        [action.role === "nasabah" ? "nasabah" : "pasangan"]: action.income,
      };

    case "setComponent": {
      const field = action.role === "nasabah" ? "nasabah" : "pasangan";
      const customer = state[field];
      if (!customer) return state;
      return {
        ...state,
        [field]: {
          ...customer,
          components: customer.components.map((c) =>
            c.key === action.key ? { ...c, ...action.patch } : c
          ),
        },
      };
    }

    case "setOcr":
      return { ...state, ocr: { ...state.ocr, [action.doc]: action.data } };

    case "classify": {
      const uploads = { ...state.uploads };
      const docCounts = { ...state.docCounts };
      for (const [key, count] of Object.entries(action.counts)) {
        if (!count) continue;
        uploads[key] = true;
        docCounts[key as DocumentId] = (docCounts[key as DocumentId] ?? 0) + count;
      }
      return { ...state, uploads, docCounts };
    }

    case "clearUploads":
      return { ...state, uploads: {}, docCounts: {}, ocr: {}, previewDocs: [] };

    case "addPreviewDocs":
      return { ...state, previewDocs: [...state.previewDocs, ...action.docs] };

    case "setSurveyStatus":
      return { ...state, surveyStatus: action.status };

    case "submitSurvey": {
      // Collateral appraisal finished. On approval the application is NOT shown
      // the offer yet — it advances to the analyst_decision waiting screen and
      // the Credit Analyst stage opens (pending). Only then can the analyst
      // approve in the dashboard. On rejection the borrower stays on the survey
      // step and sees the rejection notice.
      if (action.decision === "approved") {
        const idx = state.steps.indexOf("analyst_decision");
        return {
          ...state,
          surveyStatus: "approved",
          surveyValue: action.value,
          surveyNote: action.note,
          analystDecision: "pending",
          stepIndex: idx === -1 ? state.stepIndex : idx,
        };
      }
      return {
        ...state,
        surveyStatus: "rejected",
        surveyValue: action.value,
        surveyNote: action.note,
      };
    }

    case "setAnalystDecision":
      return { ...state, analystDecision: action.status };

    case "submitAnalystDecision": {
      // Credit Analyst decides in the dashboard. Strict order: the analyst can
      // only decide AFTER the collateral appraisal has approved, i.e. once the
      // analyst stage is pending (the dashboard buttons are disabled until then).
      // On approval the offer is released to the customer (advance to offering);
      // on rejection the borrower stays on the analyst_decision screen.
      if (state.analystDecision !== "pending") return state;
      if (action.decision === "approved") {
        const idx = state.steps.indexOf("offering");
        return {
          ...state,
          analystDecision: "approved",
          stepIndex: idx === -1 ? state.stepIndex : idx,
        };
      }
      return { ...state, analystDecision: "rejected" };
    }

    case "setAgunan":
      return { ...state, agunan: { ...state.agunan, ...action.data } };

    case "clearAgunan":
      return { ...state, agunan: undefined, npw: undefined, npwLand: undefined };

    case "setNpw":
      return { ...state, npw: action.value, npwLand: action.land };

    case "setAgunanKlas":
      return { ...state, agunanKlas: { ...state.agunanKlas, ...action.patch } };

    case "setSlik":
      return { ...state, slik: action.data };

    case "setUserInput":
      return { ...state, userInput: { ...state.userInput, ...action.patch } };

    case "prefillUserInput":
      // OCR-derived defaults fill only fields the user hasn't set yet.
      return { ...state, userInput: { ...action.data, ...state.userInput } };

    case "setLoanType": {
      // Choosing a product extends the flow with that branch and advances to
      // the first step after loan_type.
      const steps = planFlow(state.persona, action.loanType);
      const idx = steps.indexOf("loan_type");
      return {
        ...state,
        loanType: action.loanType,
        steps,
        stepIndex: idx === -1 ? state.stepIndex : Math.min(idx + 1, steps.length - 1),
      };
    }

    case "setVehicle":
      return { ...state, vehicle: action.vehicle };

    case "setAutoLoan": {
      const autoLoan = { ...state.autoLoan, ...action.patch };
      return { ...state, autoLoan };
    }

    case "setAppointment": {
      const appointment = { ...state.appointment, ...action.patch };
      // Booking the appointment opens the RM verification stage.
      const autoVerify =
        action.patch.booked && state.autoVerify === "none" ? "pending" : state.autoVerify;
      return { ...state, appointment, autoVerify };
    }

    case "submitAutoVerify": {
      // RM verified (or rejected) the appointment. On verify, hand off to the
      // analyst (decision → pending).
      if (action.decision === "approved") {
        return { ...state, autoVerify: "verified", autoVerifyNote: action.note, autoDecision: "pending" };
      }
      return { ...state, autoVerify: "rejected", autoVerifyNote: action.note };
    }

    case "submitAutoDecision":
      return { ...state, autoDecision: action.decision === "approved" ? "approved" : "rejected" };

    case "reset":
      return initialState();

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Demo seed — fills OCR/SLIK/agunan with ready-made fixtures so the flow can
// pass the upload gate without the local classifier/OCR backend. Used by the
// "Isi Otomatis (Demo)" button and as an automatic fallback when the classifier
// is unreachable. Gated behind DEMO_CONTROLS at the call sites.
// ---------------------------------------------------------------------------

function seedDemoInto(dispatch: Dispatch<NilamAction>) {
  dispatch({ type: "setOcr", doc: "ktp", data: DEMO_KTP });
  dispatch({ type: "setOcr", doc: "kk", data: DEMO_KK });
  dispatch({ type: "setOcr", doc: "slipGaji", data: DEMO_SLIP_GAJI });
  dispatch({ type: "setOcr", doc: "mutasi", data: DEMO_MUTASI });
  dispatch({ type: "setOcr", doc: "skPerusahaan", data: DEMO_SK });
  dispatch({ type: "setSlik", data: DEMO_SLIK });
  dispatch({ type: "setAgunan", data: DEMO_AGUNAN });
  dispatch({ type: "classify", counts: DEMO_DOC_COUNTS });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNilamFlow() {
  const [state, dispatch] = useReducer(nilamReducer, undefined, initialState);

  // Always-fresh mirror of state so callbacks (submit) never read a stale
  // closure — critical for the ≥ threshold survey decision after async work.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Holds the active orchestrator so we can cancel it on navigation or reset.
  const orchestratorRef = useRef<WorkflowOrchestrator | null>(null);

  // Cancel the current orchestrator and clear the ref so the `.then` guard
  // in submit() knows the run was abandoned.
  const cancelOrchestrator = useCallback(() => {
    orchestratorRef.current?.cancel();
    orchestratorRef.current = null;
  }, []);

  // Cancel on unmount to prevent dispatching to a stale component.
  useEffect(() => {
    return () => {
      cancelOrchestrator();
    };
  }, [cancelOrchestrator]);

  // Derived state
  const currentStep = state.steps[state.stepIndex];
  const isJoint = state.jointAnswer === "ya";
  const canGoBack =
    state.stepIndex > 0 &&
    currentStep !== "processing" &&
    currentStep !== "survey" &&
    currentStep !== "analyst_decision";

  // -------------------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------------------

  const setNasabahPayroll = useCallback(
    (v: boolean) => {
      cancelOrchestrator();
      dispatch({ type: "setNasabahPayroll", value: v });
    },
    [cancelOrchestrator]
  );

  const setPasanganPayroll = useCallback(
    (v: boolean) => {
      cancelOrchestrator();
      dispatch({ type: "setPasanganPayroll", value: v });
    },
    [cancelOrchestrator]
  );

  const start = useCallback(() => {
    dispatch({ type: "next" });
  }, []);

  const next = useCallback(() => {
    dispatch({ type: "next" });
  }, []);

  const goBack = useCallback(() => {
    cancelOrchestrator();
    dispatch({ type: "goBack" });
  }, [cancelOrchestrator]);

  // Jump straight back to the Agunan step (e.g. from the offer or a rejected
  // survey) to swap the collateral. Withdraw from the RM survey queue first so a
  // stale pending entry can't be approved mid-edit; re-submit re-runs everything.
  const editAgunan = useCallback(() => {
    cancelOrchestrator();
    dispatch({ type: "setSurveyStatus", status: "none" });
    dispatch({ type: "setAnalystDecision", status: "none" });
    dispatch({ type: "goTo", step: "agunan" });
  }, [cancelOrchestrator]);

  const setJointAnswer = useCallback((ans: "ya" | "tidak") => {
    dispatch({ type: "setJointAnswer", answer: ans });
  }, []);

  const setUpload = useCallback((key: string, value = true) => {
    dispatch({ type: "setUpload", key, value });
  }, []);

  // Real upload: send a PDF to the Next.js OCR proxy, store the extracted data,
  // and mark the document uploaded. Used for Slip Gaji & SK Perusahaan.
  const uploadOcrDocument = useCallback(
    async (
      docId: "slip_gaji" | "sk_perusahaan",
      files: File[],
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!files.length) return { ok: false, error: "Tidak ada file dipilih" };
      const endpoint = docId === "slip_gaji" ? "/api/ocr/slip-gaji" : "/api/ocr/sk-perusahaan";
      const form = new FormData();
      for (const f of files) form.append("file", f);
      try {
        const resp = await fetch(endpoint, { method: "POST", body: form });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.ok) {
          return { ok: false, error: json?.error ?? `Gagal memproses dokumen (${resp.status})` };
        }
        dispatch({
          type: "setOcr",
          doc: docId === "slip_gaji" ? "slipGaji" : "skPerusahaan",
          data: json.extract,
        });
        dispatch({ type: "setUpload", key: docId, value: true });
        return { ok: true };
      } catch {
        return { ok: false, error: "Tidak dapat menghubungi server OCR" };
      }
    },
    [],
  );

  // Single upload menu: classify every file (local classifier), assign each to a
  // document type, count them, then run OCR extraction for slip & SK.
  const classifyAndUpload = useCallback(
    async (
      files: File[],
    ): Promise<{ ok: boolean; results?: ClassifyResult[]; error?: string }> => {
      if (!files.length) return { ok: false, error: "Tidak ada file dipilih" };

      let results: ClassifyResult[];
      try {
        const form = new FormData();
        for (const f of files) form.append("file", f);
        const resp = await fetch("/api/ocr/classify", { method: "POST", body: form });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.ok) {
          return { ok: false, error: json?.error ?? `Gagal mengklasifikasi (${resp.status})` };
        }
        results = json.results as ClassifyResult[];
      } catch {
        // Classifier/OCR backend (port 8020) is not running — fall back to demo
        // fixtures so the flow can proceed instead of dead-ending at upload.
        seedDemoInto(dispatch);
        return { ok: true };
      }

      // Group files by detected document type. One upload menu handles ALL docs
      // (KTP/KK included) — each is auto-classified, then OCR-extracted below.
      const LABEL_TO_DOC: Record<string, DocumentId | undefined> = {
        ktp: "ktp",
        kk: "kk",
        slip: "slip_gaji",
        mutasi: "mutasi",
        sk: "sk_perusahaan",
        unknown: undefined,
      };
      const groups: Partial<Record<DocumentId, File[]>> = {};
      results.forEach((r, i) => {
        const docId = LABEL_TO_DOC[r.type];
        if (!docId || !files[i]) return;
        (groups[docId] ??= []).push(files[i]);
      });

      // Keep each uploaded file (blob URL + classified type) for the dashboard
      // document preview.
      const previewDocs: PreviewDoc[] = [];
      results.forEach((r, i) => {
        if (files[i]) previewDocs.push({ type: r.type, url: URL.createObjectURL(files[i]), originalName: files[i].name });
      });
      if (previewDocs.length) dispatch({ type: "addPreviewDocs", docs: previewDocs });

      const counts: Partial<Record<DocumentId, number>> = {};
      (Object.keys(groups) as DocumentId[]).forEach((k) => {
        counts[k] = groups[k]!.length;
      });
      dispatch({ type: "classify", counts });

      // Extract content for the dashboard cards.
      if (groups.ktp?.length) {
        // The classifier already extracted KTP fields in the same OCR pass —
        // reuse them instead of OCR-ing the KTP a second time.
        const ktpExtract = results.find((r) => r.type === "ktp" && r.extract)?.extract;
        if (ktpExtract) dispatch({ type: "setOcr", doc: "ktp", data: ktpExtract });
        else await uploadIdentitas("ktp", groups.ktp);
        // Pull the SLIK report for this NIK (from the SLIK CSV).
        const nik = ktpExtract?.nik;
        if (nik) {
          try {
            const r = await fetch(`/api/slik?nik=${encodeURIComponent(nik)}`);
            const j = await r.json().catch(() => null);
            if (r.ok && j?.ok && j.report) dispatch({ type: "setSlik", data: j.report });
          } catch {
            /* SLIK is best-effort */
          }
        }
      }
      if (groups.kk?.length) await uploadIdentitas("kk", groups.kk);
      if (groups.slip_gaji?.length) {
        const f = new FormData();
        for (const file of groups.slip_gaji) f.append("file", file); // all slips (per payment date)
        try {
          const resp = await fetch("/api/ocr/slip", { method: "POST", body: f });
          const json = await resp.json().catch(() => null);
          if (resp.ok && json?.ok) dispatch({ type: "setOcr", doc: "slipGaji", data: json.extract });
        } catch {
          /* best-effort */
        }
      }
      if (groups.sk_perusahaan?.length) {
        const f = new FormData();
        f.append("file", groups.sk_perusahaan[0]);
        try {
          const resp = await fetch("/api/ocr/sk", { method: "POST", body: f });
          const json = await resp.json().catch(() => null);
          if (resp.ok && json?.ok) dispatch({ type: "setOcr", doc: "skPerusahaan", data: json.extract });
        } catch {
          /* best-effort */
        }
      }
      if (groups.mutasi?.length) {
        const f = new FormData();
        for (const file of groups.mutasi) f.append("file", file); // all months
        try {
          const resp = await fetch("/api/ocr/mutasi", { method: "POST", body: f });
          const json = await resp.json().catch(() => null);
          if (resp.ok && json?.ok) dispatch({ type: "setOcr", doc: "mutasi", data: json.extract });
        } catch {
          /* mutasi extraction is best-effort */
        }
      }

      return { ok: true, results };
    },
    [uploadOcrDocument],
  );

  const clearUploads = useCallback(() => {
    dispatch({ type: "clearUploads" });
  }, []);

  // One-click demo fill: seed OCR/SLIK/agunan from fixtures so the flow can pass
  // the upload gate without the local classifier/OCR backend running.
  const seedDemo = useCallback(() => {
    seedDemoInto(dispatch);
  }, []);

  // Separate KTP/KK upload: read the document via OCR (Tesseract + regex) and
  // store the extracted identity — not dummy/auto-input.
  const uploadIdentitas = useCallback(
    async (docId: "ktp" | "kk", files: File[]): Promise<{ ok: boolean; error?: string }> => {
      if (!files.length) return { ok: false, error: "Tidak ada file dipilih" };
      const form = new FormData();
      form.append("file", files[0]);
      form.append("type", docId);
      try {
        const resp = await fetch("/api/ocr/identitas", { method: "POST", body: form });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.ok) {
          return { ok: false, error: json?.error ?? `Gagal membaca dokumen (${resp.status})` };
        }
        dispatch({ type: "setOcr", doc: docId, data: json.extract });
        dispatch({ type: "setUpload", key: docId, value: true });
        return { ok: true };
      } catch {
        return { ok: false, error: "Tidak dapat menghubungi server OCR" };
      }
    },
    [],
  );

  const setAgunan = useCallback((data: AgunanData) => {
    dispatch({ type: "setAgunan", data });
  }, []);

  const clearAgunan = useCallback(() => {
    dispatch({ type: "clearAgunan" });
  }, []);

  const setUserInput = useCallback((patch: Partial<UserInput>) => {
    dispatch({ type: "setUserInput", patch });
  }, []);

  const setAgunanKlas = useCallback((patch: Partial<AgunanKlasifikasi>) => {
    dispatch({ type: "setAgunanKlas", patch });
  }, []);

  // ── Auto-loan (KKB) actions ──────────────────────────────────────────────
  const setLoanType = useCallback((loanType: LoanType) => {
    cancelOrchestrator();
    dispatch({ type: "setLoanType", loanType });
  }, [cancelOrchestrator]);

  const setVehicle = useCallback((vehicle: Vehicle) => {
    dispatch({ type: "setVehicle", vehicle });
  }, []);

  const setAutoLoan = useCallback((patch: Partial<AutoLoanCalc>) => {
    dispatch({ type: "setAutoLoan", patch });
  }, []);

  const setAppointment = useCallback((patch: Partial<AppointmentData>) => {
    dispatch({ type: "setAppointment", patch });
  }, []);

  // RM verifies the booked appointment (KKB). On approval the analyst stage opens.
  const submitAutoVerify = useCallback((decision: "approved" | "rejected", note?: string) => {
    dispatch({ type: "submitAutoVerify", decision, note });
  }, []);

  // Analyst approves/rejects the KKB application (after RM verification).
  const submitAutoDecision = useCallback((decision: "approved" | "rejected") => {
    dispatch({ type: "submitAutoDecision", decision });
  }, []);

  // Pull the SLIK report (Excel by NIK) as soon as the KTP NIK is known.
  useEffect(() => {
    const nik = state.ocr.ktp?.nik;
    if (!nik || state.slik) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/slik?nik=${encodeURIComponent(nik)}`);
        const j = await r.json().catch(() => null);
        if (!cancelled && r.ok && j?.ok && j.report) dispatch({ type: "setSlik", data: j.report });
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.ocr.ktp?.nik, state.slik]);

  // Appraise NPW (Nilai Pasar Wajar) from the agunan whenever its size/location
  // changes (via the house_fair_market_value model).
  useEffect(() => {
    const a = state.agunan;
    if (!a?.luasTanah || a.luasTanah <= 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/npw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            luasTanah: a.luasTanah,
            luasBangunan: a.luasBangunan,
            kodepos: a.kodepos,
            kelurahan: a.kelurahan,
          }),
        });
        const j = await r.json().catch(() => null);
        if (!cancelled && r.ok && j?.ok && j.fairValue != null) {
          dispatch({
            type: "setNpw",
            value: Math.round(j.fairValue),
            land: j.landValue != null ? Math.round(j.landValue) : undefined,
          });
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.agunan?.luasTanah, state.agunan?.luasBangunan, state.agunan?.kelurahan, state.agunan?.kodepos]);

  // Prefill the Data Diri form from KTP/KK OCR (only fields not yet edited).
  useEffect(() => {
    const ktp = state.ocr.ktp;
    const kk = state.ocr.kk;
    const prefill: Partial<UserInput> = {};
    if (ktp?.nik) prefill.nik = ktp.nik;
    if (ktp?.nama) prefill.nama = ktp.nama;
    const usia = usiaDariKtp(ktp?.tanggalLahir);
    if (usia != null) prefill.usia = usia;
    if (ktp?.statusPerkawinan) prefill.statusKawin = ktp.statusPerkawinan;
    if (kk?.members?.length) prefill.jumlahTanggungan = Math.max(0, kk.members.length - 1);
    if (Object.keys(prefill).length) dispatch({ type: "prefillUserInput", data: prefill });
  }, [state.ocr.ktp, state.ocr.kk]);

  // Fetch & extract agunan data from a property listing link (Rumah123).
  const fetchAgunanFromLink = useCallback(
    async (url: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const resp = await fetch("/api/agunan/from-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.ok) {
          return { ok: false, error: json?.error ?? `Gagal mengambil data (${resp.status})` };
        }
        dispatch({ type: "setAgunan", data: json.data });
        return { ok: true };
      } catch {
        return { ok: false, error: "Tidak dapat menghubungi server" };
      }
    },
    [],
  );

  const setComponentMode = useCallback(
    (role: "nasabah" | "pasangan", key: ComponentKey, mode: ComponentMode) => {
      dispatch({ type: "setComponent", role, key, patch: { mode } });
    },
    []
  );

  const setComponentWeight = useCallback(
    (role: "nasabah" | "pasangan", key: ComponentKey, weight: number) => {
      dispatch({ type: "setComponent", role, key, patch: { weight } });
    },
    []
  );

  const reset = useCallback(() => {
    cancelOrchestrator();
    dispatch({ type: "reset" });
  }, [cancelOrchestrator]);

  // -------------------------------------------------------------------------
  // submit() — orchestration kick (called from Requirement step)
  // -------------------------------------------------------------------------

  // RM submits the survey result for the current (≥ threshold) application.
  const submitSurvey = useCallback(
    (decision: "approved" | "rejected", value?: number, note?: string) => {
      dispatch({ type: "submitSurvey", decision, value, note });
    },
    [],
  );

  // Credit Analyst decides in the dashboard. On approval the offer is released to
  // the customer (advances them from the analyst_decision waiting screen).
  const submitAnalystDecision = useCallback((decision: "approved" | "rejected") => {
    dispatch({ type: "submitAnalystDecision", decision });
  }, []);

  const submit = useCallback(() => {
    // Cancel any in-flight orchestrator before starting a new run.
    cancelOrchestrator();

    // Fresh survey + analyst state for this run (a re-submit after "Ganti Agunan").
    dispatch({ type: "setSurveyStatus", status: "none" });
    dispatch({ type: "setAnalystDecision", status: "none" });

    // Read the LATEST state from the ref (never a stale closure).
    const s = stateRef.current;

    // Collateral price decides whether an RM survey gate applies.
    const hargaAgunan = s.agunan?.harga ?? 0;
    const needsSurvey = hargaAgunan >= SURVEY_THRESHOLD;

    // Derive joint at submit time from the current jointAnswer.
    const joint = s.jointAnswer === "ya";

    // Build outputs keyed by NodeId
    const outputs: Partial<Record<NodeId, unknown>> = {
      upload:   { files: ["slip_gaji_nasabah.pdf", "mutasi_12_bulan.pdf"] },
      ocr:      { slip: SLIP_GAJI, mutasi: MUTASI },
      validasi: { monthsVerified: 12, complete: true },
      fraud:    FRAUD_RESULT,
      identity: joint ? IDENTITY_PASANGAN : null,
      slik:     { nasabah: SLIK_NASABAH, pasangan: joint ? SLIK_PASANGAN : undefined },
      income:   {
        nasabah: NASABAH_INCOME,
        pasangan: joint ? PASANGAN_INCOME : undefined,
      },
      thp:      null,
    };

    // Navigate to the processing step.
    dispatch({ type: "goTo", step: "processing" });

    // Create a fresh orchestrator and wire events.
    const orch = new WorkflowOrchestrator();
    orchestratorRef.current = orch;

    const emit: EventListener = (e) => {
      dispatch({ type: "appendEvent", event: e });
      // When income node succeeds, set nasabah/pasangan from its output.
      if (e.status === "success" && e.nodeId === "income" && e.output) {
        const out = e.output as { nasabah: CustomerIncome; pasangan?: CustomerIncome };
        dispatch({ type: "setIncome", role: "nasabah", income: out.nasabah });
        if (out.pasangan) {
          dispatch({ type: "setIncome", role: "pasangan", income: out.pasangan });
        }
      }
    };

    // Run the pipeline. Only advance if this specific orchestrator instance is
    // still the active one. Collateral ≥ threshold goes to the appraisal queue
    // (waiting screen) first; otherwise it skips straight to the analyst stage.
    // In both cases the offer is released only after the Credit Analyst approves.
    orch.run(s.persona, outputs, emit).then(() => {
      if (orchestratorRef.current !== orch) return;
      if (needsSurvey) {
        dispatch({ type: "setSurveyStatus", status: "pending" });
        dispatch({ type: "goTo", step: "survey" });
      } else {
        dispatch({ type: "setAnalystDecision", status: "pending" });
        dispatch({ type: "goTo", step: "analyst_decision" });
      }
    });
  }, [cancelOrchestrator]);

  return {
    persona: state.persona,
    jointAnswer: state.jointAnswer,
    isJoint,
    steps: state.steps,
    currentStep,
    stepIndex: state.stepIndex,
    canGoBack,
    uploads: state.uploads,
    events: state.events,
    nasabah: state.nasabah,
    pasangan: state.pasangan,
    ocr: state.ocr,
    docCounts: state.docCounts,
    agunan: state.agunan,
    slik: state.slik,
    npw: state.npw,
    npwLand: state.npwLand,
    agunanKlas: state.agunanKlas,
    setAgunanKlas,
    loanType: state.loanType,
    vehicle: state.vehicle,
    autoLoan: state.autoLoan,
    appointment: state.appointment,
    autoVerify: state.autoVerify,
    autoVerifyNote: state.autoVerifyNote,
    autoDecision: state.autoDecision,
    setLoanType,
    setVehicle,
    setAutoLoan,
    setAppointment,
    submitAutoVerify,
    submitAutoDecision,
    userInput: state.userInput,
    setUserInput,
    previewDocs: state.previewDocs,
    surveyStatus: state.surveyStatus,
    surveyValue: state.surveyValue,
    surveyNote: state.surveyNote,
    submitSurvey,
    analystDecision: state.analystDecision,
    submitAnalystDecision,
    setNasabahPayroll,
    setPasanganPayroll,
    setJointAnswer,
    start,
    next,
    goBack,
    editAgunan,
    setUpload,
    uploadOcrDocument,
    classifyAndUpload,
    uploadIdentitas,
    clearUploads,
    seedDemo,
    setAgunan,
    clearAgunan,
    fetchAgunanFromLink,
    submit,
    setComponentMode,
    setComponentWeight,
    reset,
  };
}
