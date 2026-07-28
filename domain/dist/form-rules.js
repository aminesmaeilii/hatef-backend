"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFieldVisibility = evaluateFieldVisibility;
function isEmptyValue(value) {
    if (value === undefined || value === null || value === "")
        return true;
    return Array.isArray(value) && value.length === 0;
}
function evaluateCondition(condition, answers) {
    const actual = answers[condition.sourceFieldKey];
    switch (condition.operator) {
        case "equals":
            return actual === condition.value;
        case "notEquals":
            return actual !== condition.value;
        case "in":
            return Array.isArray(condition.value) && condition.value.includes(actual);
        case "notIn":
            return Array.isArray(condition.value) && !condition.value.includes(actual);
        case "isEmpty":
            return isEmptyValue(actual);
        case "isNotEmpty":
            return !isEmptyValue(actual);
        default:
            return false;
    }
}
/**
 * Pure, framework-free conditional-logic evaluator shared by the server
 * (authoritative — never trust the client's own show/hide state at submit
 * time) and the partner-web wizard (live show/hide as the user types). A
 * HIDE match forces invisible; a REQUIRE match only adds to the field's own
 * static `required` flag, never removes it; a hidden field is never
 * required (there's nothing to validate).
 */
function evaluateFieldVisibility(rules, answers, fieldKey, baseRequired) {
    let visible = true;
    let required = baseRequired;
    for (const rule of rules) {
        if (rule.targetFieldKey !== fieldKey)
            continue;
        const matches = evaluateCondition(rule.condition, answers);
        if (rule.action === "SHOW" && !matches)
            visible = false;
        if (rule.action === "HIDE" && matches)
            visible = false;
        if (rule.action === "REQUIRE" && matches)
            required = true;
    }
    return { visible, required: visible && required };
}
