import type { OutboxEventHandler } from "../outbox/handlers";
/**
 * Executes one ReportRun against its approved dataset (spec 20
 * "asynchronous execution" — this is the real async execution path; the
 * API only ever creates the PENDING row and enqueues this event, never
 * runs the query itself). `REPORT_DATASETS` from `@hatef/database` is the
 * single, shared "approved semantic dataset" registry both this worker and
 * backend/api's definition/dataset-listing endpoints read from.
 */
export declare const reportRunRequestedHandler: OutboxEventHandler;
//# sourceMappingURL=handlers.d.ts.map