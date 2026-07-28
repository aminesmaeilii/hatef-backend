import { z } from "zod";

/**
 * Stable, machine-readable error shape returned by every API endpoint.
 * `message` is always a safe, already-localized Persian string suitable for
 * direct display; never a raw exception message.
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  correlationId: z.string().optional(),
  fieldErrors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export function cursorPaginatedResponseSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}
