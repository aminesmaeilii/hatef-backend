export declare class InvalidEitaaIdError extends Error {
    readonly rawInput: string;
    constructor(rawInput: string);
}
/**
 * Normalizes an Eitaa channel identifier supplied as a bare handle, an
 * "@handle" mention, or a full eitaa.com URL, into a canonical lowercase
 * handle with no prefix. Throws InvalidEitaaIdError if the result does not
 * look like a valid Eitaa identifier.
 */
export declare function normalizeEitaaId(rawInput: string): string;
export declare function isValidEitaaId(rawInput: string): boolean;
export declare function toEitaaUrl(normalizedId: string): string;
//# sourceMappingURL=eitaa.d.ts.map