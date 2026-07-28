"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPartialAcceptanceError = exports.SettlementExceedsAcceptedValueError = void 0;
exports.isLedgerTransactionBalanced = isLedgerTransactionBalanced;
exports.buildReversalEntries = buildReversalEntries;
exports.allocateSettlement = allocateSettlement;
exports.computePartialAcceptance = computePartialAcceptance;
/**
 * Spec 16.1's "every transaction has balanced entries" as a pure,
 * database-free check: total debits must equal total credits, and there
 * must be at least one entry on each side. Used both before a
 * LedgerService.post() ever reaches the database and in the domain's own
 * tests, so the invariant is provable without a Postgres connection.
 */
function isLedgerTransactionBalanced(entries) {
    if (entries.length < 2)
        return false;
    let debit = 0n;
    let credit = 0n;
    for (const entry of entries) {
        if (entry.amountRial <= 0n)
            return false;
        if (entry.direction === "DEBIT")
            debit += entry.amountRial;
        else
            credit += entry.amountRial;
    }
    return debit > 0n && debit === credit;
}
/**
 * A reversal is the exact debit/credit mirror of the transaction it
 * reverses — this is what makes a correction provably cancel the original
 * out (their sums net to zero per account) rather than being "just another
 * transaction that happens to look opposite." Always balanced if the input
 * was balanced, by construction.
 */
function buildReversalEntries(original) {
    return original.map((entry) => ({
        accountKey: entry.accountKey,
        direction: entry.direction === "DEBIT" ? "CREDIT" : "DEBIT",
        amountRial: entry.amountRial,
    }));
}
class SettlementExceedsAcceptedValueError extends Error {
    constructor() {
        super("Settlement amount exceeds the total accepted, unsettled service value.");
        this.name = "SettlementExceedsAcceptedValueError";
    }
}
exports.SettlementExceedsAcceptedValueError = SettlementExceedsAcceptedValueError;
/**
 * Spreads a settlement's total amount across explicit targets in the given
 * order, never exceeding each target's remaining available value and never
 * exceeding the sum of all targets (spec 27 invariant: "settlement cannot
 * exceed accepted service"). Pure allocation math — persistence just writes
 * the returned lines as SettlementAllocation rows.
 */
function allocateSettlement(totalRial, targets) {
    if (totalRial <= 0n) {
        throw new RangeError("Settlement total must be a positive amount.");
    }
    const totalAvailable = targets.reduce((sum, t) => sum + t.availableRial, 0n);
    if (totalRial > totalAvailable) {
        throw new SettlementExceedsAcceptedValueError();
    }
    const lines = [];
    let remaining = totalRial;
    for (const target of targets) {
        if (remaining <= 0n)
            break;
        if (target.availableRial <= 0n)
            continue;
        const amount = remaining < target.availableRial ? remaining : target.availableRial;
        lines.push({ obligationId: target.obligationId, deliverableId: target.deliverableId, amountRial: amount });
        remaining -= amount;
    }
    return lines;
}
class InvalidPartialAcceptanceError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidPartialAcceptanceError";
    }
}
exports.InvalidPartialAcceptanceError = InvalidPartialAcceptanceError;
/**
 * Partial acceptance requires an accepted rial value and a remaining amount
 * (spec 16.4) — computed together so the two numbers can never silently
 * drift apart (e.g. remaining left stale after an accepted-value edit).
 */
function computePartialAcceptance(input) {
    if (input.acceptedValueRial < 0n || input.acceptedValueRial > input.deliverableValueRial) {
        throw new InvalidPartialAcceptanceError("Accepted value must be between 0 and the obligation's full value.");
    }
    return {
        acceptedValueRial: input.acceptedValueRial,
        remainingValueRial: input.deliverableValueRial - input.acceptedValueRial,
    };
}
