export declare const ACCEPTED_MIME_TYPES: string[];
/**
 * Sniffs the real file type from its magic bytes rather than trusting the
 * client-supplied MIME type. Deliberately hand-rolled instead of pulling in
 * `file-type`: that package is ESM-only and would break this repo's
 * enforced CommonJS build (see AGENTS.md) — Phase 1 only needs to recognize
 * the handful of types it accepts, not a general-purpose sniffer.
 */
export declare function sniffMimeType(buffer: Buffer): string | null;
//# sourceMappingURL=magic-byte.d.ts.map