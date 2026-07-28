import { toLatinDigits } from "@hatef/localization";

export class InvalidEitaaIdError extends Error {
  constructor(public readonly rawInput: string) {
    super("Invalid Eitaa channel identifier");
    this.name = "InvalidEitaaIdError";
  }
}

const EITAA_URL_PREFIXES = ["https://eitaa.com/", "http://eitaa.com/", "eitaa.com/", "@"];
const VALID_ID_PATTERN = /^[a-zA-Z0-9_]{4,32}$/;

/**
 * Normalizes an Eitaa channel identifier supplied as a bare handle, an
 * "@handle" mention, or a full eitaa.com URL, into a canonical lowercase
 * handle with no prefix. Throws InvalidEitaaIdError if the result does not
 * look like a valid Eitaa identifier.
 */
export function normalizeEitaaId(rawInput: string): string {
  let value = toLatinDigits(rawInput).trim();

  for (const prefix of EITAA_URL_PREFIXES) {
    if (value.toLowerCase().startsWith(prefix)) {
      value = value.slice(prefix.length);
      break;
    }
  }

  value = value.replace(/\/+$/, "").trim();

  if (!VALID_ID_PATTERN.test(value)) {
    throw new InvalidEitaaIdError(rawInput);
  }

  return value.toLowerCase();
}

export function isValidEitaaId(rawInput: string): boolean {
  try {
    normalizeEitaaId(rawInput);
    return true;
  } catch {
    return false;
  }
}

export function toEitaaUrl(normalizedId: string): string {
  return `https://eitaa.com/${normalizedId}`;
}
