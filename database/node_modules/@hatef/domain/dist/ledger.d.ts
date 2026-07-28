import type { RialAmount } from "./money";
export type LedgerEntryDirection = "DEBIT" | "CREDIT";
export interface LedgerEntryLine {
    accountKey: string;
    direction: LedgerEntryDirection;
    amountRial: RialAmount;
}
/**
 * Spec 16.1's "every transaction has balanced entries" as a pure,
 * database-free check: total debits must equal total credits, and there
 * must be at least one entry on each side. Used both before a
 * LedgerService.post() ever reaches the database and in the domain's own
 * tests, so the invariant is provable without a Postgres connection.
 */
export declare function isLedgerTransactionBalanced(entries: LedgerEntryLine[]): boolean;
/**
 * A reversal is the exact debit/credit mirror of the transaction it
 * reverses — this is what makes a correction provably cancel the original
 * out (their sums net to zero per account) rather than being "just another
 * transaction that happens to look opposite." Always balanced if the input
 * was balanced, by construction.
 */
export declare function buildReversalEntries(original: LedgerEntryLine[]): LedgerEntryLine[];
export interface AllocationTarget {
    obligationId: string;
    deliverableId?: string;
    /** The accepted (settleable) value not yet consumed by any prior settlement allocation. */
    availableRial: RialAmount;
}
export interface SettlementAllocationLine {
    obligationId: string;
    deliverableId?: string;
    amountRial: RialAmount;
}
export declare class SettlementExceedsAcceptedValueError extends Error {
    constructor();
}
/**
 * Spreads a settlement's total amount across explicit targets in the given
 * order, never exceeding each target's remaining available value and never
 * exceeding the sum of all targets (spec 27 invariant: "settlement cannot
 * exceed accepted service"). Pure allocation math — persistence just writes
 * the returned lines as SettlementAllocation rows.
 */
export declare function allocateSettlement(totalRial: RialAmount, targets: AllocationTarget[]): SettlementAllocationLine[];
export interface PartialAcceptanceInput {
    deliverableValueRial: RialAmount;
    acceptedValueRial: RialAmount;
}
export interface PartialAcceptanceResult {
    acceptedValueRial: RialAmount;
    remainingValueRial: RialAmount;
}
export declare class InvalidPartialAcceptanceError extends Error {
    constructor(message: string);
}
/**
 * Partial acceptance requires an accepted rial value and a remaining amount
 * (spec 16.4) — computed together so the two numbers can never silently
 * drift apart (e.g. remaining left stale after an accepted-value edit).
 */
export declare function computePartialAcceptance(input: PartialAcceptanceInput): PartialAcceptanceResult;
//# sourceMappingURL=ledger.d.ts.map