import type { FormFieldType } from "../generated/client/index";
export interface FieldSeed {
    key: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    config?: unknown;
    options?: {
        value: string;
        label: string;
    }[];
}
export interface SectionSeed {
    title: string;
    fields: FieldSeed[];
}
export interface PageSeed {
    title: string;
    sections: SectionSeed[];
}
export interface RuleSeed {
    targetKey: string;
    action: "SHOW" | "REQUIRE" | "HIDE";
    condition: {
        sourceFieldKey: string;
        operator: string;
        value?: unknown;
    };
}
/**
 * The real 28-question onboarding form (spec section 9.2), authored as data
 * for the form engine's own tables — not hardcoded React. Q5 and Q27 each
 * become 2 FormField rows (a value + an image, and a yes/no gate + a
 * conditional detail field respectively); the two "separately versioned
 * confirmations" become CONSENT fields in the final section.
 */
export declare const ONBOARDING_PAGES: PageSeed[];
export declare const ONBOARDING_RULES: RuleSeed[];
//# sourceMappingURL=onboarding-form-definition.d.ts.map