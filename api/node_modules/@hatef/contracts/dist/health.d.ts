import { z } from "zod";
export declare const healthResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
    service: z.ZodString;
    timestamp: z.ZodISODateTime;
}, z.core.$strip>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export declare const readinessCheckSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodEnum<{
        up: "up";
        down: "down";
    }>;
    latencyMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ReadinessCheck = z.infer<typeof readinessCheckSchema>;
export declare const readinessResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        ok: "ok";
        degraded: "degraded";
    }>;
    service: z.ZodString;
    timestamp: z.ZodISODateTime;
    checks: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            up: "up";
            down: "down";
        }>;
        latencyMs: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
//# sourceMappingURL=health.d.ts.map