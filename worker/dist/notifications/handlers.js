"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationDeliverHandler = createNotificationDeliverHandler;
const sms_sender_1 = require("./sms-sender");
function isNotificationDeliverPayload(value) {
    return typeof value === "object" && value !== null && typeof value.notificationDeliveryId === "string";
}
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
function createNotificationDeliverHandler(env) {
    return async (event, { logger, prisma }) => {
        if (!isNotificationDeliverPayload(event.payload)) {
            logger.warn({ payload: event.payload }, "malformed notification.deliver payload, dropping");
            return;
        }
        const delivery = await prisma.notificationDelivery.findUnique({
            where: { id: event.payload.notificationDeliveryId },
            include: { notification: { include: { user: { include: { contacts: true } } } } },
        });
        if (!delivery) {
            logger.warn({ deliveryId: event.payload.notificationDeliveryId }, "notification delivery row not found, dropping");
            return;
        }
        // Already handled by an earlier at-least-once redelivery of this same job — no-op.
        if (delivery.status === "SENT")
            return;
        try {
            if (delivery.channel === "IN_APP") {
                // The Notification row itself is the in-app inbox entry — nothing more to do to "deliver" it.
                await prisma.notificationDelivery.update({
                    where: { id: delivery.id },
                    data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 } },
                });
                return;
            }
            if (delivery.channel === "SMS") {
                const mobile = delivery.notification.user.contacts.find((c) => c.type === "MOBILE")?.value;
                if (!mobile) {
                    await prisma.notificationDelivery.update({
                        where: { id: delivery.id },
                        data: { status: "FAILED", lastError: "no mobile contact on file", attempts: { increment: 1 } },
                    });
                    return;
                }
                const result = await (0, sms_sender_1.sendSms)(env, {
                    mobile,
                    templateId: delivery.notification.eventType,
                    params: { title: delivery.notification.title, body: delivery.notification.body },
                });
                await prisma.$transaction([
                    prisma.notificationDelivery.update({
                        where: { id: delivery.id },
                        data: { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId, attempts: { increment: 1 } },
                    }),
                    prisma.smsDeliveryLog.create({
                        data: {
                            notificationDeliveryId: delivery.id,
                            mobile,
                            templateId: delivery.notification.eventType,
                            providerMessageId: result.providerMessageId,
                            status: "SENT",
                        },
                    }),
                ]);
                return;
            }
            // PUSH/EMAIL: schema-ready, no working provider yet (spec 19 "future push and email adapters").
            await prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: { status: "FAILED", lastError: `no provider configured for channel ${delivery.channel}`, attempts: { increment: 1 } },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: { status: "FAILED", lastError: message, attempts: { increment: 1 } },
            });
            if (delivery.channel === "SMS") {
                await prisma.smsDeliveryLog.create({
                    data: {
                        notificationDeliveryId: delivery.id,
                        mobile: delivery.notification.user.contacts.find((c) => c.type === "MOBILE")?.value ?? "",
                        templateId: delivery.notification.eventType,
                        status: "FAILED",
                        errorMessage: message,
                    },
                });
            }
            throw error; // let BullMQ retry
        }
    };
}
