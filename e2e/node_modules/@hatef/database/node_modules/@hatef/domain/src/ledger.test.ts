import { describe, expect, it } from "vitest";
import {
  allocateSettlement,
  buildReversalEntries,
  computePartialAcceptance,
  InvalidPartialAcceptanceError,
  isLedgerTransactionBalanced,
  SettlementExceedsAcceptedValueError,
} from "./ledger";

describe("isLedgerTransactionBalanced", () => {
  it("accepts a simple two-entry balanced transaction", () => {
    expect(
      isLedgerTransactionBalanced([
        { accountKey: "a", direction: "DEBIT", amountRial: 1000n },
        { accountKey: "b", direction: "CREDIT", amountRial: 1000n },
      ]),
    ).toBe(true);
  });

  it("accepts a four-entry balanced transaction (support + reciprocal debt posted together)", () => {
    expect(
      isLedgerTransactionBalanced([
        { accountKey: "channel_support", direction: "DEBIT", amountRial: 500n },
        { accountKey: "channel_obligation", direction: "DEBIT", amountRial: 500n },
        { accountKey: "platform_support", direction: "CREDIT", amountRial: 500n },
        { accountKey: "platform_service", direction: "CREDIT", amountRial: 500n },
      ]),
    ).toBe(true);
  });

  it("rejects unbalanced entries", () => {
    expect(
      isLedgerTransactionBalanced([
        { accountKey: "a", direction: "DEBIT", amountRial: 1000n },
        { accountKey: "b", direction: "CREDIT", amountRial: 900n },
      ]),
    ).toBe(false);
  });

  it("rejects a single-sided transaction", () => {
    expect(isLedgerTransactionBalanced([{ accountKey: "a", direction: "DEBIT", amountRial: 1000n }])).toBe(false);
  });

  it("rejects a zero or negative amount entry", () => {
    expect(
      isLedgerTransactionBalanced([
        { accountKey: "a", direction: "DEBIT", amountRial: 0n },
        { accountKey: "b", direction: "CREDIT", amountRial: 0n },
      ]),
    ).toBe(false);
  });
});

describe("buildReversalEntries", () => {
  it("mirrors direction while preserving amounts, netting the original to zero per account", () => {
    const original = [
      { accountKey: "a", direction: "DEBIT" as const, amountRial: 700n },
      { accountKey: "b", direction: "CREDIT" as const, amountRial: 700n },
    ];
    const reversal = buildReversalEntries(original);
    expect(reversal).toEqual([
      { accountKey: "a", direction: "CREDIT", amountRial: 700n },
      { accountKey: "b", direction: "DEBIT", amountRial: 700n },
    ]);
    expect(isLedgerTransactionBalanced(reversal)).toBe(true);
  });
});

describe("allocateSettlement", () => {
  it("allocates fully against a single target", () => {
    const lines = allocateSettlement(1000n, [{ obligationId: "o1", availableRial: 1000n }]);
    expect(lines).toEqual([{ obligationId: "o1", deliverableId: undefined, amountRial: 1000n }]);
  });

  it("splits across several obligations in order (several obligations against one support)", () => {
    const lines = allocateSettlement(1500n, [
      { obligationId: "o1", availableRial: 1000n },
      { obligationId: "o2", availableRial: 1000n },
    ]);
    expect(lines).toEqual([
      { obligationId: "o1", deliverableId: undefined, amountRial: 1000n },
      { obligationId: "o2", deliverableId: undefined, amountRial: 500n },
    ]);
  });

  it("throws rather than exceeding total accepted value", () => {
    expect(() => allocateSettlement(2000n, [{ obligationId: "o1", availableRial: 1000n }])).toThrow(
      SettlementExceedsAcceptedValueError,
    );
  });

  it("skips exhausted targets", () => {
    const lines = allocateSettlement(500n, [
      { obligationId: "o1", availableRial: 0n },
      { obligationId: "o2", availableRial: 500n },
    ]);
    expect(lines).toEqual([{ obligationId: "o2", deliverableId: undefined, amountRial: 500n }]);
  });
});

describe("computePartialAcceptance", () => {
  it("computes the remaining amount alongside the accepted amount", () => {
    expect(computePartialAcceptance({ deliverableValueRial: 1000n, acceptedValueRial: 600n })).toEqual({
      acceptedValueRial: 600n,
      remainingValueRial: 400n,
    });
  });

  it("rejects an accepted value above the full deliverable value", () => {
    expect(() => computePartialAcceptance({ deliverableValueRial: 1000n, acceptedValueRial: 1001n })).toThrow(
      InvalidPartialAcceptanceError,
    );
  });

  it("rejects a negative accepted value", () => {
    expect(() => computePartialAcceptance({ deliverableValueRial: 1000n, acceptedValueRial: -1n })).toThrow(
      InvalidPartialAcceptanceError,
    );
  });
});
