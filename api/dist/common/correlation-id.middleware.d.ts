import type { RequestHandler } from "express";
export declare const CORRELATION_ID_HEADER = "x-correlation-id";
export declare function correlationIdMiddleware(): RequestHandler;
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}
//# sourceMappingURL=correlation-id.middleware.d.ts.map