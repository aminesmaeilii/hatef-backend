/**
 * All monetary values in the platform are integer Rial amounts, represented
 * as bigint end-to-end (JS number, Prisma BigInt column, JSON as string) so
 * that no floating-point rounding can ever enter a financial calculation.
 */
export type RialAmount = bigint;
export declare function rial(value: bigint | number | string): RialAmount;
export declare function addRial(a: RialAmount, b: RialAmount): RialAmount;
export declare function subtractRial(a: RialAmount, b: RialAmount): RialAmount;
export declare function multiplyRial(amount: RialAmount, factor: bigint | number): RialAmount;
export declare function isNonNegativeRial(amount: RialAmount): boolean;
/** Serializes a Rial amount for JSON transport (bigint is not JSON-serializable natively). */
export declare function serializeRial(amount: RialAmount): string;
export declare function parseRial(serialized: string): RialAmount;
//# sourceMappingURL=money.d.ts.map