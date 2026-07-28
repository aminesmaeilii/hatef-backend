import { z } from "zod";
/**
 * Stable, machine-readable error shape returned by every API endpoint.
 * `message` is always a safe, already-localized Persian string suitable for
 * direct display; never a raw exception message.
 */
export declare const apiErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    fieldErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export declare const cursorPaginationQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
export declare function cursorPaginatedResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem): z.ZodObject<{
    items: z.ZodArray<TItem>;
    nextCursor: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=common.d.ts.map