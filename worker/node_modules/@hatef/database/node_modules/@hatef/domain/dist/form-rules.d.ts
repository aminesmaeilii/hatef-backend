export type FormRuleOperator = "equals" | "notEquals" | "in" | "notIn" | "isEmpty" | "isNotEmpty";
export interface FormRuleCondition {
    sourceFieldKey: string;
    operator: FormRuleOperator;
    value?: unknown;
}
export type FormRuleActionType = "SHOW" | "REQUIRE" | "HIDE";
export interface FormRuleDefinition {
    targetFieldKey: string;
    action: FormRuleActionType;
    condition: FormRuleCondition;
}
export interface FieldVisibility {
    visible: boolean;
    required: boolean;
}
/**
 * Pure, framework-free conditional-logic evaluator shared by the server
 * (authoritative — never trust the client's own show/hide state at submit
 * time) and the partner-web wizard (live show/hide as the user types). A
 * HIDE match forces invisible; a REQUIRE match only adds to the field's own
 * static `required` flag, never removes it; a hidden field is never
 * required (there's nothing to validate).
 */
export declare function evaluateFieldVisibility(rules: readonly FormRuleDefinition[], answers: Readonly<Record<string, unknown>>, fieldKey: string, baseRequired: boolean): FieldVisibility;
//# sourceMappingURL=form-rules.d.ts.map