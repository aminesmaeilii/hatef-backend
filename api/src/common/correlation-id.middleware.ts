import type { NextFunction, Request, RequestHandler, Response } from "express";
import { newCorrelationId, runWithCorrelationId } from "@hatef/observability";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function correlationIdMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header(CORRELATION_ID_HEADER);
    const correlationId = incoming && incoming.length > 0 ? incoming : newCorrelationId();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    req.correlationId = correlationId;

    runWithCorrelationId(correlationId, next);
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}
