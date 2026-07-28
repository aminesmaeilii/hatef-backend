export declare class InvalidIranianMobileError extends Error {
    readonly rawInput: string;
    constructor(rawInput: string);
}
/**
 * Normalizes an Iranian mobile number to canonical E.164 form (+989XXXXXXXXX).
 * Accepts Persian/Arabic-Indic digits and the 0098 / +98 / 98 / 0 prefixes
 * users commonly type. Throws InvalidIranianMobileError for anything else.
 */
export declare function normalizeIranianMobile(rawInput: string): string;
export declare function isValidIranianMobile(rawInput: string): boolean;
/** Masks a normalized mobile number for display/audit logs: +989121234567 -> +9891****567 */
export declare function maskMobile(normalizedMobile: string): string;
//# sourceMappingURL=phone.d.ts.map