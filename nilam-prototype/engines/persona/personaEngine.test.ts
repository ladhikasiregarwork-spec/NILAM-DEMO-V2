import { describe, it, expect } from "vitest";
import { planFlow } from "./personaEngine";
import { DEFAULT_PERSONA } from "@/data/personas";

// The flow is shared up to the loan_type step, then branches by product. Until a
// product is chosen (loanType null), the flow ends at loan_type.
const BASE_STEPS = ["opening", "term_condition", "requirement", "loan_type"];
const KPR_STEPS = [...BASE_STEPS, "data_diri", "agunan", "processing", "survey", "analyst_decision", "offering", "disburse"];
const AUTO_STEPS = [...BASE_STEPS, "vehicle_search", "vehicle_detail", "appointment", "appointment_done"];

describe("planFlow", () => {
  it("returns the base flow with DEFAULT_PERSONA and no product chosen", () => {
    expect(planFlow(DEFAULT_PERSONA)).toEqual(BASE_STEPS);
  });

  it("returns the base flow with no argument", () => {
    expect(planFlow()).toEqual(BASE_STEPS);
  });

  it("returns the base flow when loanType is null", () => {
    expect(planFlow(DEFAULT_PERSONA, null)).toEqual(BASE_STEPS);
  });

  it("returns the KPR branch when loanType is 'kpr'", () => {
    expect(planFlow(DEFAULT_PERSONA, "kpr")).toEqual(KPR_STEPS);
  });

  it("returns the auto (KKB) branch when loanType is 'auto'", () => {
    expect(planFlow(DEFAULT_PERSONA, "auto")).toEqual(AUTO_STEPS);
  });

  it("is independent of persona payroll flags", () => {
    const combos = [
      { nasabahPayroll: true, pasanganPayroll: false },
      { nasabahPayroll: false, pasanganPayroll: false },
      { nasabahPayroll: true, pasanganPayroll: true },
      { nasabahPayroll: false, pasanganPayroll: true },
    ];
    for (const p of combos) {
      expect(planFlow(p)).toEqual(BASE_STEPS);
      expect(planFlow(p, "kpr")).toEqual(KPR_STEPS);
      expect(planFlow(p, "auto")).toEqual(AUTO_STEPS);
    }
  });

  it("flow always starts with opening", () => {
    expect(planFlow()[0]).toBe("opening");
    expect(planFlow(DEFAULT_PERSONA, "kpr")[0]).toBe("opening");
    expect(planFlow(DEFAULT_PERSONA, "auto")[0]).toBe("opening");
  });

  it("every branch begins with the shared base steps", () => {
    expect(planFlow(DEFAULT_PERSONA, "kpr").slice(0, 4)).toEqual(BASE_STEPS);
    expect(planFlow(DEFAULT_PERSONA, "auto").slice(0, 4)).toEqual(BASE_STEPS);
  });

  it("KPR branch keeps processing immediately before survey", () => {
    const steps = planFlow(DEFAULT_PERSONA, "kpr");
    const procIdx = steps.indexOf("processing");
    expect(procIdx).toBeGreaterThan(-1);
    expect(steps[procIdx + 1]).toBe("survey");
  });

  it("KPR branch gates the offer behind analyst_decision (survey → analyst_decision → offering)", () => {
    const steps = planFlow(DEFAULT_PERSONA, "kpr");
    const surveyIdx = steps.indexOf("survey");
    expect(steps[surveyIdx + 1]).toBe("analyst_decision");
    expect(steps[surveyIdx + 2]).toBe("offering");
  });
});
