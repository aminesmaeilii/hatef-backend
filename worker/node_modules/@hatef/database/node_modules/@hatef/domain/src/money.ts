/**
 * All monetary values in the platform are integer Rial amounts, represented
 * as bigint end-to-end (JS number, Prisma BigInt column, JSON as string) so
 * that no floating-point rounding can ever enter a financial calculation.
 */
export type RialAmount = bigint;

export function rial(value: bigint | number | string): RialAmount {
  if (typeof value === "number" && !Number.isInteger(value)) {
    throw new TypeError(`Rial amounts must be integers, received ${value}`);
  }
  return BigInt(value);
}

export function addRial(a: RialAmount, b: RialAmount): RialAmount {
  return a + b;
}

export function subtractRial(a: RialAmount, b: RialAmount): RialAmount {
  return a - b;
}

export function multiplyRial(amount: RialAmount, factor: bigint | number): RialAmount {
  if (typeof factor === "number" && !Number.isInteger(factor)) {
    throw new TypeError(`Rial multiplier must be an integer quantity, received ${factor}`);
  }
  return amount * BigInt(factor);
}

export function isNonNegativeRial(amount: RialAmount): boolean {
  return amount >= 0n;
}

/** Serializes a Rial amount for JSON transport (bigint is not JSON-serializable natively). */
export function serializeRial(amount: RialAmount): string {
  return amount.toString();
}

export function parseRial(serialized: string): RialAmount {
  if (!/^-?\d+$/.test(serialized)) {
    throw new TypeError(`Invalid serialized Rial amount: ${serialized}`);
  }
  return BigInt(serialized);
}
