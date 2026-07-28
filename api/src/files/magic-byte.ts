interface Signature {
  mimeType: string;
  matches: (buffer: Buffer) => boolean;
}

const SIGNATURES: Signature[] = [
  { mimeType: "image/jpeg", matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mimeType: "image/png",
    matches: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: "image/webp",
    matches: (b) =>
      b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  { mimeType: "application/pdf", matches: (b) => b.length >= 5 && b.subarray(0, 5).toString("ascii") === "%PDF-" },
];

export const ACCEPTED_MIME_TYPES = SIGNATURES.map((signature) => signature.mimeType);

/**
 * Sniffs the real file type from its magic bytes rather than trusting the
 * client-supplied MIME type. Deliberately hand-rolled instead of pulling in
 * `file-type`: that package is ESM-only and would break this repo's
 * enforced CommonJS build (see AGENTS.md) — Phase 1 only needs to recognize
 * the handful of types it accepts, not a general-purpose sniffer.
 */
export function sniffMimeType(buffer: Buffer): string | null {
  return SIGNATURES.find((signature) => signature.matches(buffer))?.mimeType ?? null;
}
