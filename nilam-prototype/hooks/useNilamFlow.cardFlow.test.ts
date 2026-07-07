import { describe, it, expect } from "vitest";
import { nilamReducer, initialState, type NilamState } from "./useNilamFlow";
import { planFlow } from "@/engines/persona/personaEngine";

// Reordered credit-card flow: analyst approves a limit FIRST (card_review), then
// the customer picks a card (card_select → card_detail).

const cc = (s: NilamState) => nilamReducer(s, { type: "setLoanType", loanType: "cc" });
const step = (s: NilamState) => s.steps[s.stepIndex];

describe("credit-card flow — analyst approval first", () => {
  it("planFlow(cc) puts card_review before card_select/card_detail", () => {
    expect(planFlow(undefined, "cc")).toEqual([
      "opening", "term_condition", "requirement", "loan_type",
      "card_review", "card_select", "card_detail", "card_done",
    ]);
  });

  it("choosing CC lands on card_review", () => {
    expect(step(cc(initialState()))).toBe("card_review");
  });

  it("submitCard sets analyst pending but stays on card_review", () => {
    const s = nilamReducer(cc(initialState()), { type: "submitCard" });
    expect(s.cardDecision).toBe("pending");
    expect(step(s)).toBe("card_review");
  });

  it("analyst approval records the granted limit and advances to card_select", () => {
    let s = nilamReducer(cc(initialState()), { type: "submitCard" });
    s = nilamReducer(s, { type: "submitCardDecision", decision: "approved", grantedLimit: 25_000_000 });
    expect(s.cardDecision).toBe("approved");
    expect(s.cardGrantedLimit).toBe(25_000_000);
    expect(step(s)).toBe("card_select");
  });

  it("analyst rejection keeps the customer on card_review", () => {
    let s = nilamReducer(cc(initialState()), { type: "submitCard" });
    s = nilamReducer(s, { type: "submitCardDecision", decision: "rejected" });
    expect(s.cardDecision).toBe("rejected");
    expect(step(s)).toBe("card_review");
    expect(s.cardGrantedLimit).toBeUndefined();
  });

  it("ignores an analyst decision before the application is submitted", () => {
    const s = nilamReducer(cc(initialState()), { type: "submitCardDecision", decision: "approved", grantedLimit: 9 });
    expect(s.cardDecision).toBe("none");
    expect(step(s)).toBe("card_review");
  });
});
