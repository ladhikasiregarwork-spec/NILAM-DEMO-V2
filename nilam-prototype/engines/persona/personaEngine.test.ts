import { describe, it, expect } from "vitest";
import { planFlow } from "./personaEngine";
import { DEFAULT_PERSONA } from "@/data/personas";

const EXPECTED_STEPS = ["opening", "income_type", "joint_income", "requirement", "processing", "analyst_decision"];

describe("planFlow", () => {
  it("returns the 6-step uniform flow with DEFAULT_PERSONA", () => {
    expect(planFlow(DEFAULT_PERSONA)).toEqual(EXPECTED_STEPS);
  });

  it("returns the 6-step uniform flow with no argument", () => {
    expect(planFlow()).toEqual(EXPECTED_STEPS);
  });

  it("returns the 6-step uniform flow for nasabahPayroll=true, pasanganPayroll=false", () => {
    expect(planFlow({ nasabahPayroll: true, pasanganPayroll: false })).toEqual(EXPECTED_STEPS);
  });

  it("returns the 6-step uniform flow for nasabahPayroll=false, pasanganPayroll=false", () => {
    expect(planFlow({ nasabahPayroll: false, pasanganPayroll: false })).toEqual(EXPECTED_STEPS);
  });

  it("returns the 6-step uniform flow for nasabahPayroll=true, pasanganPayroll=true", () => {
    expect(planFlow({ nasabahPayroll: true, pasanganPayroll: true })).toEqual(EXPECTED_STEPS);
  });

  it("returns the 6-step uniform flow for nasabahPayroll=false, pasanganPayroll=true", () => {
    expect(planFlow({ nasabahPayroll: false, pasanganPayroll: true })).toEqual(EXPECTED_STEPS);
  });

  it("flow always starts with opening", () => {
    expect(planFlow()[0]).toBe("opening");
  });

  it("flow always ends with analyst_decision", () => {
    const steps = planFlow();
    expect(steps[steps.length - 1]).toBe("analyst_decision");
  });

  it("flow always includes processing before analyst_decision", () => {
    const steps = planFlow();
    const procIdx = steps.indexOf("processing");
    const analystIdx = steps.indexOf("analyst_decision");
    expect(procIdx).toBeGreaterThan(-1);
    expect(analystIdx).toBe(procIdx + 1);
  });
});
