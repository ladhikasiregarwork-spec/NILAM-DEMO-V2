import { describe, it, expect } from "vitest";
import { nilamReducer, initialState } from "./useNilamFlow";
import type { NilamState } from "./useNilamFlow";
import { planFlow } from "@/engines/persona/personaEngine";
import { DEFAULT_PERSONA } from "@/data/personas";
import type { PersonaConfig, FlowStep } from "@/types/flow";
import type { OrchestrationEvent } from "@/types/orchestration";
import type { CustomerIncome } from "@/types/income";
import { DEFAULT_KLASIFIKASI } from "@/data/ltv";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Shared base flow before a product is chosen on the loan_type step.
const BASE_STEPS = ["opening", "term_condition", "requirement", "loan_type"];

function makePersona(nasabahPayroll: boolean, pasanganPayroll: boolean): PersonaConfig {
  return { nasabahPayroll, pasanganPayroll };
}

function makeIncome(role: "nasabah" | "pasangan"): CustomerIncome {
  return {
    role,
    name: role === "nasabah" ? "Nasabah" : "Pasangan",
    components: [
      { key: "Gaji",     avg: 10_000_000, min: 10_000_000, mode: "avg", weight: 1 },
      { key: "THR",      avg: 20_000_000, min: 20_000_000, mode: "avg", weight: 1 },
      { key: "Bonus",    avg: 30_000_000, min: 10_000_000, mode: "avg", weight: 1 },
      { key: "Insentif", avg: 1_000_000,  min: 1_000_000,  mode: "avg", weight: 1 },
    ],
    angsuran: 2_500_000,
  };
}

function makeEvent(nodeId: string = "slik"): OrchestrationEvent {
  return {
    nodeId: nodeId as OrchestrationEvent["nodeId"],
    status: "running",
    label: "Test node",
    progress: 0.5,
    ts: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// setNasabahPayroll
// ---------------------------------------------------------------------------

describe("nilamReducer — setNasabahPayroll", () => {
  it("sets persona.nasabahPayroll to the new value", () => {
    const state = nilamReducer(initialState(), { type: "setNasabahPayroll", value: false });
    expect(state.persona.nasabahPayroll).toBe(false);
  });

  it("resets stepIndex to 0", () => {
    const prior: NilamState = {
      ...initialState(),
      stepIndex: 3,
    };
    const state = nilamReducer(prior, { type: "setNasabahPayroll", value: false });
    expect(state.stepIndex).toBe(0);
  });

  it("clears uploads, events, nasabah, pasangan on setNasabahPayroll", () => {
    const prior: NilamState = {
      ...initialState(),
      stepIndex: 2,
      uploads: { slip: true },
      events: [makeEvent()],
      nasabah: makeIncome("nasabah"),
      pasangan: makeIncome("pasangan"),
    };
    const state = nilamReducer(prior, { type: "setNasabahPayroll", value: false });
    expect(state.uploads).toEqual({});
    expect(state.events).toEqual([]);
    expect(state.nasabah).toBeUndefined();
    expect(state.pasangan).toBeUndefined();
  });

  it("clears jointAnswer on setNasabahPayroll", () => {
    let state = nilamReducer(initialState(), { type: "setJointAnswer", answer: "ya" });
    state = nilamReducer(state, { type: "setNasabahPayroll", value: false });
    expect(state.jointAnswer).toBeNull();
  });

  it("keeps pasanganPayroll unchanged when setting nasabahPayroll", () => {
    const prior: NilamState = {
      ...initialState(),
      persona: { nasabahPayroll: true, pasanganPayroll: true },
    };
    const state = nilamReducer(prior, { type: "setNasabahPayroll", value: false });
    expect(state.persona.nasabahPayroll).toBe(false);
    expect(state.persona.pasanganPayroll).toBe(true);
  });

  it("resets to the base flow after setNasabahPayroll", () => {
    const state = nilamReducer(initialState(), { type: "setNasabahPayroll", value: false });
    expect(state.steps).toEqual(BASE_STEPS);
  });
});

// ---------------------------------------------------------------------------
// setPasanganPayroll
// ---------------------------------------------------------------------------

describe("nilamReducer — setPasanganPayroll", () => {
  it("sets persona.pasanganPayroll to the new value", () => {
    const state = nilamReducer(initialState(), { type: "setPasanganPayroll", value: true });
    expect(state.persona.pasanganPayroll).toBe(true);
  });

  it("resets stepIndex to 0", () => {
    const prior: NilamState = {
      ...initialState(),
      stepIndex: 4,
    };
    const state = nilamReducer(prior, { type: "setPasanganPayroll", value: true });
    expect(state.stepIndex).toBe(0);
  });

  it("clears uploads, events, nasabah, pasangan on setPasanganPayroll", () => {
    const prior: NilamState = {
      ...initialState(),
      stepIndex: 2,
      uploads: { mutasi: true },
      events: [makeEvent("income")],
      nasabah: makeIncome("nasabah"),
      pasangan: makeIncome("pasangan"),
    };
    const state = nilamReducer(prior, { type: "setPasanganPayroll", value: true });
    expect(state.uploads).toEqual({});
    expect(state.events).toEqual([]);
    expect(state.nasabah).toBeUndefined();
    expect(state.pasangan).toBeUndefined();
  });

  it("clears jointAnswer on setPasanganPayroll", () => {
    let state = nilamReducer(initialState(), { type: "setJointAnswer", answer: "tidak" });
    state = nilamReducer(state, { type: "setPasanganPayroll", value: true });
    expect(state.jointAnswer).toBeNull();
  });

  it("keeps nasabahPayroll unchanged when setting pasanganPayroll", () => {
    const prior: NilamState = {
      ...initialState(),
      persona: { nasabahPayroll: false, pasanganPayroll: false },
    };
    const state = nilamReducer(prior, { type: "setPasanganPayroll", value: true });
    expect(state.persona.nasabahPayroll).toBe(false);
    expect(state.persona.pasanganPayroll).toBe(true);
  });

  it("resets to the base flow after setPasanganPayroll", () => {
    const state = nilamReducer(initialState(), { type: "setPasanganPayroll", value: true });
    expect(state.steps).toEqual(BASE_STEPS);
  });
});

// ---------------------------------------------------------------------------
// setJointAnswer — does NOT reset flow
// ---------------------------------------------------------------------------

describe("nilamReducer — setJointAnswer", () => {
  it("sets jointAnswer to 'ya'", () => {
    const state = nilamReducer(initialState(), { type: "setJointAnswer", answer: "ya" });
    expect(state.jointAnswer).toBe("ya");
  });

  it("sets jointAnswer to 'tidak'", () => {
    const state = nilamReducer(initialState(), { type: "setJointAnswer", answer: "tidak" });
    expect(state.jointAnswer).toBe("tidak");
  });

  it("can overwrite a previous jointAnswer", () => {
    let state = nilamReducer(initialState(), { type: "setJointAnswer", answer: "ya" });
    state = nilamReducer(state, { type: "setJointAnswer", answer: "tidak" });
    expect(state.jointAnswer).toBe("tidak");
  });

  it("does NOT reset stepIndex when setting jointAnswer", () => {
    let state = nilamReducer(initialState(), { type: "next" });
    state = nilamReducer(state, { type: "next" });
    const indexBefore = state.stepIndex;
    state = nilamReducer(state, { type: "setJointAnswer", answer: "ya" });
    expect(state.stepIndex).toBe(indexBefore);
  });

  it("does NOT clear events or uploads when setting jointAnswer", () => {
    let state: NilamState = {
      ...initialState(),
      uploads: { slip: true },
      events: [makeEvent()],
    };
    state = nilamReducer(state, { type: "setJointAnswer", answer: "ya" });
    expect(state.uploads).toEqual({ slip: true });
    expect(state.events).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// next
// ---------------------------------------------------------------------------

describe("nilamReducer — next", () => {
  it("increments stepIndex by 1", () => {
    const s0 = initialState(); // stepIndex = 0
    expect(s0.stepIndex).toBe(0);

    const s1 = nilamReducer(s0, { type: "next" });
    expect(s1.stepIndex).toBe(1);

    const s2 = nilamReducer(s1, { type: "next" });
    expect(s2.stepIndex).toBe(2);
  });

  it("clamps at the last step of the base flow (loan_type) — does not go beyond", () => {
    let state = initialState();

    // Advance past the last step many times
    for (let i = 0; i < 10; i++) {
      state = nilamReducer(state, { type: "next" });
    }

    expect(state.stepIndex).toBe(state.steps.length - 1);
    expect(state.steps[state.stepIndex]).toBe("loan_type");
  });
});

// ---------------------------------------------------------------------------
// goBack
// ---------------------------------------------------------------------------

describe("nilamReducer — goBack", () => {
  it("decrements stepIndex by 1 from a normal step", () => {
    const s0 = initialState();
    const s1 = nilamReducer(s0, { type: "next" }); // stepIndex = 1 (term_condition)
    const s2 = nilamReducer(s1, { type: "goBack" }); // stepIndex → 0

    expect(s2.stepIndex).toBe(0);
  });

  it("clamps at 0 — does not go negative", () => {
    const s0 = initialState();
    const s1 = nilamReducer(s0, { type: "goBack" });

    expect(s1.stepIndex).toBe(0);
  });

  it("does NOT clear events/nasabah/pasangan when leaving a normal step", () => {
    let state = nilamReducer(initialState(), { type: "next" }); // stepIndex = 1 (term_condition)
    state = { ...state, events: [makeEvent()], nasabah: makeIncome("nasabah") };

    const after = nilamReducer(state, { type: "goBack" });

    expect(after.events).toHaveLength(1);
    expect(after.nasabah).toBeDefined();
  });

  it("clears events, nasabah, pasangan when leaving 'processing' (rollback)", () => {
    const allSteps = planFlow(DEFAULT_PERSONA, "kpr");
    const processingIdx = allSteps.indexOf("processing");

    const stateAtProcessing: NilamState = {
      ...initialState(),
      persona: DEFAULT_PERSONA,
      steps: allSteps,
      stepIndex: processingIdx,
      jointAnswer: "ya",
      uploads: { slip: true },
      events: [makeEvent(), makeEvent("income")],
      nasabah: makeIncome("nasabah"),
      pasangan: makeIncome("pasangan"),
    };

    const after = nilamReducer(stateAtProcessing, { type: "goBack" });

    expect(after.events).toEqual([]);
    expect(after.nasabah).toBeUndefined();
    expect(after.pasangan).toBeUndefined();
    // uploads should be preserved (not part of rollback spec)
    expect(after.uploads).toEqual({ slip: true });
    // moved back one step
    expect(after.stepIndex).toBe(processingIdx - 1);
  });

  it("clears events, nasabah, pasangan when leaving 'analyst_decision' (rollback)", () => {
    const allSteps = planFlow(DEFAULT_PERSONA, "kpr");
    const analystIdx = allSteps.indexOf("analyst_decision");
    expect(analystIdx).toBeGreaterThan(-1);

    const stateAtAnalyst: NilamState = {
      ...initialState(),
      persona: DEFAULT_PERSONA,
      steps: allSteps,
      stepIndex: analystIdx,
      jointAnswer: null,
      events: [makeEvent()],
      nasabah: makeIncome("nasabah"),
    };

    const after = nilamReducer(stateAtAnalyst, { type: "goBack" });

    expect(after.events).toEqual([]);
    expect(after.nasabah).toBeUndefined();
    expect(after.pasangan).toBeUndefined();
    expect(after.stepIndex).toBe(analystIdx - 1);
  });
});

// ---------------------------------------------------------------------------
// submitSurvey → analyst_decision gate, then submitAnalystDecision → offering
// ---------------------------------------------------------------------------

describe("nilamReducer — analyst decision gate", () => {
  function stateInKprAt(step: FlowStep): NilamState {
    const steps = planFlow(DEFAULT_PERSONA, "kpr");
    return { ...initialState(), persona: DEFAULT_PERSONA, steps, stepIndex: steps.indexOf(step) };
  }

  it("approving the survey advances to analyst_decision (NOT offering) and sets analystDecision=pending", () => {
    const before = stateInKprAt("survey");
    const after = nilamReducer(before, { type: "submitSurvey", decision: "approved", value: 800_000_000 });

    expect(after.steps[after.stepIndex]).toBe("analyst_decision");
    expect(after.surveyStatus).toBe("approved");
    expect(after.surveyValue).toBe(800_000_000);
    expect(after.analystDecision).toBe("pending");
  });

  it("analyst approval releases the offer (advances to offering) and sets analystDecision=approved", () => {
    const before = { ...stateInKprAt("analyst_decision"), analystDecision: "pending" as const };
    const after = nilamReducer(before, { type: "submitAnalystDecision", decision: "approved" });

    expect(after.analystDecision).toBe("approved");
    expect(after.steps[after.stepIndex]).toBe("offering");
  });

  it("analyst rejection keeps the customer on analyst_decision (no offer)", () => {
    const before = { ...stateInKprAt("analyst_decision"), analystDecision: "pending" as const };
    const after = nilamReducer(before, { type: "submitAnalystDecision", decision: "rejected" });

    expect(after.analystDecision).toBe("rejected");
    expect(after.steps[after.stepIndex]).toBe("analyst_decision");
  });

  it("setAnalystDecision resets the decision (used on re-submit / Ganti Agunan)", () => {
    const before = { ...stateInKprAt("analyst_decision"), analystDecision: "approved" as const };
    const after = nilamReducer(before, { type: "setAnalystDecision", status: "none" });
    expect(after.analystDecision).toBe("none");
  });

  it("submitAnalystDecision is a no-op until the appraisal approves (strict order)", () => {
    // Appraisal still pending → analyst stage not open yet (analystDecision "none").
    const before = { ...stateInKprAt("survey"), surveyStatus: "pending" as const };
    const after = nilamReducer(before, { type: "submitAnalystDecision", decision: "approved" });

    expect(after.analystDecision).toBe("none"); // ignored — appraisal must go first
    expect(after.steps[after.stepIndex]).toBe("survey"); // stayed put — no offer
  });

  it("strict order: appraisal approves → analyst stage opens → analyst releases the offer", () => {
    // 1. Appraisal approves → analyst stage opens (pending); customer waits.
    const afterSurvey = nilamReducer(
      { ...stateInKprAt("survey"), surveyStatus: "pending" as const },
      { type: "submitSurvey", decision: "approved", value: 800_000_000 },
    );
    expect(afterSurvey.analystDecision).toBe("pending");
    expect(afterSurvey.steps[afterSurvey.stepIndex]).toBe("analyst_decision");

    // 2. Only now can the analyst approve → offer released.
    const afterAnalyst = nilamReducer(afterSurvey, { type: "submitAnalystDecision", decision: "approved" });
    expect(afterAnalyst.analystDecision).toBe("approved");
    expect(afterAnalyst.steps[afterAnalyst.stepIndex]).toBe("offering");
  });
});

// ---------------------------------------------------------------------------
// setComponent
// ---------------------------------------------------------------------------

describe("nilamReducer — setComponent", () => {
  function stateWithNasabah(): NilamState {
    return {
      ...initialState(),
      persona: makePersona(false, false),
      nasabah: makeIncome("nasabah"),
    };
  }

  it("updates the targeted component's mode immutably", () => {
    const before = stateWithNasabah();
    const after = nilamReducer(before, {
      type: "setComponent",
      role: "nasabah",
      key: "Gaji",
      patch: { mode: "min" },
    });

    const gajiAfter = after.nasabah?.components.find((c) => c.key === "Gaji");
    expect(gajiAfter?.mode).toBe("min");
  });

  it("leaves other components unchanged", () => {
    const before = stateWithNasabah();
    const after = nilamReducer(before, {
      type: "setComponent",
      role: "nasabah",
      key: "Gaji",
      patch: { mode: "min" },
    });

    const thrAfter = after.nasabah?.components.find((c) => c.key === "THR");
    expect(thrAfter?.mode).toBe("avg"); // unchanged
  });

  it("does not mutate the original state's component array", () => {
    const before = stateWithNasabah();
    const beforeComponents = before.nasabah!.components;

    nilamReducer(before, {
      type: "setComponent",
      role: "nasabah",
      key: "Gaji",
      patch: { mode: "min" },
    });

    // Original state array is untouched
    expect(beforeComponents.find((c) => c.key === "Gaji")?.mode).toBe("avg");
  });

  it("updates weight on the targeted component", () => {
    const before = stateWithNasabah();
    const after = nilamReducer(before, {
      type: "setComponent",
      role: "nasabah",
      key: "Bonus",
      patch: { weight: 0.5 },
    });

    const bonusAfter = after.nasabah?.components.find((c) => c.key === "Bonus");
    expect(bonusAfter?.weight).toBe(0.5);
  });

  it("is a no-op when the role has no income (pasangan not set)", () => {
    const before = stateWithNasabah(); // pasangan is undefined
    const after = nilamReducer(before, {
      type: "setComponent",
      role: "pasangan",
      key: "Gaji",
      patch: { mode: "min" },
    });

    expect(after).toBe(before); // returns original reference unchanged
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe("nilamReducer — reset", () => {
  it("returns to initial state: DEFAULT_PERSONA, base steps, stepIndex 0", () => {
    const populated: NilamState = {
      ...initialState(),
      persona: makePersona(false, true),
      steps: BASE_STEPS as FlowStep[],
      stepIndex: 3,
      jointAnswer: "ya",
      uploads: { slip: true, mutasi: true },
      events: [makeEvent(), makeEvent()],
      nasabah: makeIncome("nasabah"),
      pasangan: makeIncome("pasangan"),
    };

    const after = nilamReducer(populated, { type: "reset" });

    expect(after.persona).toEqual(DEFAULT_PERSONA);
    expect(after.steps).toEqual(planFlow(DEFAULT_PERSONA, null));
    expect(after.stepIndex).toBe(0);
    expect(after.jointAnswer).toBeNull();
    expect(after.uploads).toEqual({});
    expect(after.events).toEqual([]);
    expect(after.nasabah).toBeUndefined();
    expect(after.pasangan).toBeUndefined();
  });

  it("does not mutate the original state object", () => {
    const before = initialState();
    const beforeRef = before;
    nilamReducer(before, { type: "reset" });
    expect(before).toBe(beforeRef); // original object unchanged
  });
});

// ---------------------------------------------------------------------------
// goTo
// ---------------------------------------------------------------------------

describe("nilamReducer — goTo", () => {
  it("jumps to the correct step index", () => {
    // Choose KPR so the flow contains the processing step.
    const s0 = nilamReducer(initialState(), { type: "setLoanType", loanType: "kpr" });

    const after = nilamReducer(s0, { type: "goTo", step: "processing" });
    const expectedIdx = s0.steps.indexOf("processing");
    expect(expectedIdx).toBeGreaterThan(-1);
    expect(after.stepIndex).toBe(expectedIdx);
  });

  it("jumps to a later branch step (offering) correctly", () => {
    const s0 = nilamReducer(initialState(), { type: "setLoanType", loanType: "kpr" });

    const after = nilamReducer(s0, { type: "goTo", step: "offering" });
    expect(after.steps[after.stepIndex]).toBe("offering");
  });

  it("is a no-op for an absent step", () => {
    const s0 = initialState();

    // "submitted" does not exist in the flow
    const after = nilamReducer(s0, { type: "goTo", step: "submitted" as never });
    expect(after.stepIndex).toBe(s0.stepIndex);
  });
});

// ---------------------------------------------------------------------------
// appendEvent + setIncome (basic sanity)
// ---------------------------------------------------------------------------

describe("nilamReducer — appendEvent", () => {
  it("appends events in order", () => {
    const e1 = makeEvent("upload");
    const e2 = makeEvent("slik");

    let state = initialState();
    state = nilamReducer(state, { type: "appendEvent", event: e1 });
    state = nilamReducer(state, { type: "appendEvent", event: e2 });

    expect(state.events).toHaveLength(2);
    expect(state.events[0].nodeId).toBe("upload");
    expect(state.events[1].nodeId).toBe("slik");
  });
});

describe("nilamReducer — setIncome", () => {
  it("sets nasabah income correctly", () => {
    const income = makeIncome("nasabah");
    const state = nilamReducer(initialState(), {
      type: "setIncome",
      role: "nasabah",
      income,
    });

    expect(state.nasabah).toBe(income);
    expect(state.pasangan).toBeUndefined();
  });

  it("sets pasangan income correctly", () => {
    const income = makeIncome("pasangan");
    const state = nilamReducer(initialState(), {
      type: "setIncome",
      role: "pasangan",
      income,
    });

    expect(state.pasangan).toBe(income);
    expect(state.nasabah).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// initialState shape
// ---------------------------------------------------------------------------

describe("initialState", () => {
  it("has DEFAULT_PERSONA with nasabahPayroll=true, pasanganPayroll=false", () => {
    const s = initialState();
    expect(s.persona.nasabahPayroll).toBe(true);
    expect(s.persona.pasanganPayroll).toBe(false);
  });

  it("has jointAnswer=null initially", () => {
    expect(initialState().jointAnswer).toBeNull();
  });

  it("has the base flow (before a product is chosen)", () => {
    expect(initialState().steps).toEqual(BASE_STEPS);
  });

  it("stepIndex starts at 0", () => {
    expect(initialState().stepIndex).toBe(0);
  });
});
