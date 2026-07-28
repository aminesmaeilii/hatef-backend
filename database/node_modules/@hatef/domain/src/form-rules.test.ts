import { describe, expect, it } from "vitest";
import { evaluateFieldVisibility, type FormRuleDefinition } from "./form-rules";

describe("evaluateFieldVisibility", () => {
  it("Q12 becomes required when Q11 is 'partly' or 'no' (REQUIRE + in)", () => {
    const rules: FormRuleDefinition[] = [
      {
        targetFieldKey: "admin_action_plan",
        action: "REQUIRE",
        condition: { sourceFieldKey: "admin_qualified", operator: "in", value: ["partly", "no"] },
      },
    ];

    expect(evaluateFieldVisibility(rules, { admin_qualified: "yes" }, "admin_action_plan", false)).toEqual({
      visible: true,
      required: false,
    });
    expect(evaluateFieldVisibility(rules, { admin_qualified: "partly" }, "admin_action_plan", false)).toEqual({
      visible: true,
      required: true,
    });
    expect(evaluateFieldVisibility(rules, { admin_qualified: "no" }, "admin_action_plan", false)).toEqual({
      visible: true,
      required: true,
    });
  });

  it("Q19 only shows when Q18's previous-promotion answer is non-empty (SHOW + isNotEmpty)", () => {
    const rules: FormRuleDefinition[] = [
      {
        targetFieldKey: "target_post_analysis",
        action: "SHOW",
        condition: { sourceFieldKey: "previous_promotion_experience", operator: "isNotEmpty" },
      },
    ];

    expect(evaluateFieldVisibility(rules, { previous_promotion_experience: "" }, "target_post_analysis", false).visible).toBe(
      false,
    );
    expect(
      evaluateFieldVisibility(rules, { previous_promotion_experience: undefined }, "target_post_analysis", false).visible,
    ).toBe(false);
    expect(
      evaluateFieldVisibility(rules, { previous_promotion_experience: "قبلا تبلیغ داشتیم" }, "target_post_analysis", false)
        .visible,
    ).toBe(true);
  });

  it("Q27's shutdown details only show when the shutdown gate is 'yes' (SHOW + equals)", () => {
    const rules: FormRuleDefinition[] = [
      {
        targetFieldKey: "shutdown_details",
        action: "SHOW",
        condition: { sourceFieldKey: "had_shutdown", operator: "equals", value: "yes" },
      },
    ];

    expect(evaluateFieldVisibility(rules, { had_shutdown: "no" }, "shutdown_details", false).visible).toBe(false);
    expect(evaluateFieldVisibility(rules, { had_shutdown: "yes" }, "shutdown_details", false).visible).toBe(true);
  });

  it("a HIDE match wins even if a REQUIRE rule also matches — a hidden field is never required", () => {
    const rules: FormRuleDefinition[] = [
      { targetFieldKey: "x", action: "REQUIRE", condition: { sourceFieldKey: "a", operator: "equals", value: 1 } },
      { targetFieldKey: "x", action: "HIDE", condition: { sourceFieldKey: "b", operator: "equals", value: 2 } },
    ];

    expect(evaluateFieldVisibility(rules, { a: 1, b: 2 }, "x", false)).toEqual({ visible: false, required: false });
  });

  it("a field's own static required flag survives with no matching rules", () => {
    expect(evaluateFieldVisibility([], {}, "unrelated", true)).toEqual({ visible: true, required: true });
  });

  it("notEquals and notIn behave as the logical inverse of equals/in", () => {
    const rules: FormRuleDefinition[] = [
      { targetFieldKey: "x", action: "SHOW", condition: { sourceFieldKey: "a", operator: "notEquals", value: "z" } },
    ];
    expect(evaluateFieldVisibility(rules, { a: "z" }, "x", false).visible).toBe(false);
    expect(evaluateFieldVisibility(rules, { a: "y" }, "x", false).visible).toBe(true);

    const notInRules: FormRuleDefinition[] = [
      { targetFieldKey: "x", action: "SHOW", condition: { sourceFieldKey: "a", operator: "notIn", value: ["y", "z"] } },
    ];
    expect(evaluateFieldVisibility(notInRules, { a: "z" }, "x", false).visible).toBe(false);
    expect(evaluateFieldVisibility(notInRules, { a: "q" }, "x", false).visible).toBe(true);
  });
});
