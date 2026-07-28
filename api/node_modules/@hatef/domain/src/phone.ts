import { toLatinDigits } from "@hatef/localization";

export class InvalidIranianMobileError extends Error {
  constructor(public readonly rawInput: string) {
    super("Invalid Iranian mobile number");
    this.name = "InvalidIranianMobileError";
  }
}

const CLEAN_PATTERN = /[\s\-()]/g;

/**
 * Normalizes an Iranian mobile number to canonical E.164 form (+989XXXXXXXXX).
 * Accepts Persian/Arabic-Indic digits and the 0098 / +98 / 98 / 0 prefixes
 * users commonly type. Throws InvalidIranianMobileError for anything else.
 */
export function normalizeIranianMobile(rawInput: string): string {
  const latin = toLatinDigits(rawInput).replace(CLEAN_PATTERN, "");

  let local = latin;
  if (local.startsWith("+98")) {
    local = local.slice(3);
  } else if (local.startsWith("0098")) {
    local = local.slice(4);
  } else if (local.startsWith("98")) {
    local = local.slice(2);
  } else if (local.startsWith("0")) {
    local = local.slice(1);
  }

  if (!/^9\d{9}$/.test(local)) {
    throw new InvalidIranianMobileError(rawInput);
  }

  return `+98${local}`;
}

export function isValidIranianMobile(rawInput: string): boolean {
  try {
    normalizeIranianMobile(rawInput);
    return true;
  } catch {
    return false;
  }
}

/** Masks a normalized mobile number for display/audit logs: +989121234567 -> +9891****567 */
export function maskMobile(normalizedMobile: string): string {
  if (normalizedMobile.length < 8) return normalizedMobile;
  const prefix = normalizedMobile.slice(0, 5);
  const suffix = normalizedMobile.slice(-3);
  return `${prefix}****${suffix}`;
}
