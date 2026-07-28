import type { Env } from "@hatef/config";
import type { OutboxEventHandler } from "../outbox/handlers";
/**
 * Delivers one NotificationDelivery row (spec 19). Retries are entirely the
 * Phase 0 outbox/BullMQ pipeline's own job — this handler just does one
 * attempt and throws on failure so BullMQ's configured backoff/attempts
 * (see backend/worker/src/outbox/relay.ts) retries it; once BullMQ exhausts
 * its attempts, the OutboxEvent itself lands at DEAD_LETTER (the phase's
 * own "failed-delivery queue" — queryable by eventType + status, joined
 * back to this delivery via `correlationId === dedupeKey`, both real
 * columns, no extra table needed).
 */
export declare function createNotificationDeliverHandler(env: Env): OutboxEventHandler;
//# sourceMappingURL=handlers.d.ts.map