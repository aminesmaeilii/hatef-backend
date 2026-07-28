import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readinessCheckSchema = z.object({
  name: z.string(),
  status: z.enum(["up", "down"]),
  latencyMs: z.number().nonnegative().optional(),
  error: z.string().optional(),
});
export type ReadinessCheck = z.infer<typeof readinessCheckSchema>;

export const readinessResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.string(),
  timestamp: z.iso.datetime(),
  checks: z.array(readinessCheckSchema),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
