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
export function isLedgerTransactionBalanced(entries: LedgerEntryLine[]): boolean {
  if (entries.length < 2) return false;
  let debit = 0n;
  let credit = 0n;
  for (const entry of entries) {
    if (entry.amountRial <= 0n) return false;
    if (entry.direction === "DEBIT") debit += entry.amountRial;
    else credit += entry.amountRial;
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
export function buildReversalEntries(original: LedgerEntryLine[]): LedgerEntryLine[] {
  return original.map((entry) => ({
    accountKey: entry.accountKey,
    direction: entry.direction === "DEBIT" ? "CREDIT" : "DEBIT",
    amountRial: entry.amountRial,
  }));
}

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

export class SettlementExceedsAcceptedValueError extends Error {
  constructor() {
    super("Settlement amount exceeds the total accepted, unsettled service value.");
    this.name = "SettlementExceedsAcceptedValueError";
  }
}

/**
 * Spreads a settlement's total amount across explicit targets in the given
 * order, never exceeding each target's remaining available value and never
 * exceeding the sum of all targets (spec 27 invariant: "settlement cannot
 * exceed accepted service"). Pure allocation math — persistence just writes
 * the returned lines as SettlementAllocation rows.
 */
export function allocateSettlement(totalRial: RialAmount, targets: AllocationTarget[]): SettlementAllocationLine[] {
  if (totalRial <= 0n) {
    throw new RangeError("Settlement total must be a positive amount.");
  }
  const totalAvailable = targets.reduce((sum, t) => sum + t.availableRial, 0n);
  if (totalRial > totalAvailable) {
    throw new SettlementExceedsAcceptedValueError();
  }

  const lines: SettlementAllocationLine[] = [];
  let remaining = totalRial;
  for (const target of targets) {
    if (remaining <= 0n) break;
    if (target.availableRial <= 0n) continue;
    const amount = remaining < target.availableRial ? remaining : target.availableRial;
    lines.push({ obligationId: target.obligationId, deliverableId: target.deliverableId, amountRial: amount });
    remaining -= amount;
  }
  return lines;
}

export interface PartialAcceptanceInput {
  deliverableValueRial: RialAmount;
  acceptedValueRial: RialAmount;
}

export interface PartialAcceptanceResult {
  acceptedValueRial: RialAmount;
  remainingValueRial: RialAmount;
}

export class InvalidPartialAcceptanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPartialAcceptanceError";
  }
}

/**
 * Partial acceptance requires an accepted rial value and a remaining amount
 * (spec 16.4) — computed together so the two numbers can never silently
 * drift apart (e.g. remaining left stale after an accepted-value edit).
 */
export function computePartialAcceptance(input: PartialAcceptanceInput): PartialAcceptanceResult {
  if (input.acceptedValueRial < 0n || input.acceptedValueRial > input.deliverableValueRial) {
    throw new InvalidPartialAcceptanceError("Accepted value must be between 0 and the obligation's full value.");
  }
  return {
    acceptedValueRial: input.acceptedValueRial,
    remainingValueRial: input.deliverableValueRial - input.acceptedValueRial,
  };
}
