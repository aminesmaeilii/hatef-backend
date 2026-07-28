/** Converts Persian and Arabic-Indic digits in a string to Latin digits. Leaves everything else untouched. */
export declare function toLatinDigits(input: string): string;
/** Converts Latin digits in a string to Persian digits, for display purposes only. */
export declare function toPersianDigits(input: string | number): string;
/** Formats an integer rial amount with Persian digit grouping, e.g. 1234000 -> "۱٬۲۳۴٬۰۰۰". */
export declare function formatRial(amountRial: number | bigint): string;
//# sourceMappingURL=digits.d.ts.map