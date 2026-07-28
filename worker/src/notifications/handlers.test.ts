import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { loadEnv } from "@hatef/config";
import { createLogger } from "@hatef/observability";
import { PrismaClient } from "@hatef/database";
import { createNotificationDeliverHandler } from "./handlers";

const prisma = new PrismaClient();
const env = loadEnv(process.env);
const logger = createLogger({ serviceName: "worker-test", pretty: false });
const handler = createNotificationDeliverHandler(env);

const createdUserIds: string[] = [];

afterAll(async () => {
  for (const id of createdUserIds) {
    await prisma.smsDeliveryLog.deleteMany({ where: { notificationDelivery: { notification: { userId: id } } } });
    await prisma.notificationDelivery.deleteMany({ where: { notification: { userId: id } } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.user.deleteMany({ where: { id } });
  }
  await prisma.$disconnect();
});

async function createUser(withMobile: boolean) {
  const user = await prisma.user.create({ data: { displayName: `Worker Test User ${randomUUID().slice(0, 8)}` } });
  createdUserIds.push(user.id);
  if (withMobile) {
    await prisma.userContact.create({ data: { userId: user.id, type: "MOBILE", value: `+98912${Math.floor(1000000 + Math.random() * 8999999)}` } });
  }
  return user;
}

describe("createNotificationDeliverHandler (real DB, dev SMS provider)", () => {
  it("delivers an IN_APP notification by marking it SENT — no external call needed", async () => {
    const user = await createUser(false);
    const notification = await prisma.notification.create({
      data: { userId: user.id, eventType: "test.event", title: "t", body: "b" },
    });
    const delivery = await prisma.notificationDelivery.create({
      data: { notificationId: notification.id, channel: "IN_APP", status: "PENDING", dedupeKey: `test:${notification.id}:IN_APP` },
    });

    await handler({ eventType: "notification.deliver", payload: { notificationDeliveryId: delivery.id }, correlationId: null }, { logger, prisma });

    const after = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: delivery.id } });
    expect(after.status).toBe("SENT");
    expect(after.sentAt).not.toBeNull();
    expect(after.attempts).toBe(1);
  });

  it("delivers an SMS notification via the dev provider and writes a real SmsDeliveryLog row", async () => {
    const user = await createUser(true);
    const notification = await prisma.notification.create({
      data: { userId: user.id, eventType: "test.event", title: "t", body: "b" },
    });
    const delivery = await prisma.notificationDelivery.create({
      data: { notificationId: notification.id, channel: "SMS", status: "PENDING", dedupeKey: `test:${notification.id}:SMS` },
    });

    await handler({ eventType: "notification.deliver", payload: { notificationDeliveryId: delivery.id }, correlationId: null }, { logger, prisma });

    const after = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: delivery.id } });
    expect(after.status).toBe("SENT");
    expect(after.providerMessageId).toMatch(/^dev_/);

    const smsLog = await prisma.smsDeliveryLog.findUnique({ where: { notificationDeliveryId: delivery.id } });
    expect(smsLog?.status).toBe("SENT");
  });

  it("fails gracefully (no throw) when the user has no mobile contact on file", async () => {
    const user = await createUser(false);
    const notification = await prisma.notification.create({
      data: { userId: user.id, eventType: "test.event", title: "t", body: "b" },
    });
    const delivery = await prisma.notificationDelivery.create({
      data: { notificationId: notification.id, channel: "SMS", status: "PENDING", dedupeKey: `test:${notification.id}:SMS` },
    });

    await handler({ eventType: "notification.deliver", payload: { notificationDeliveryId: delivery.id }, correlationId: null }, { logger, prisma });

    const after = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: delivery.id } });
    expect(after.status).toBe("FAILED");
    expect(after.lastError).toContain("mobile");
  });

  it("is a no-op on redelivery of an already-SENT delivery — safe under BullMQ's at-least-once semantics", async () => {
    const user = await createUser(false);
    const notification = await prisma.notification.create({
      data: { userId: user.id, eventType: "test.event", title: "t", body: "b" },
    });
    const delivery = await prisma.notificationDelivery.create({
      data: { notificationId: notification.id, channel: "IN_APP", status: "PENDING", dedupeKey: `test:${notification.id}:IN_APP` },
    });

    const event = { eventType: "notification.deliver", payload: { notificationDeliveryId: delivery.id }, correlationId: null };
    await handler(event, { logger, prisma });
    await handler(event, { logger, prisma }); // redelivery

    const after = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: delivery.id } });
    expect(after.attempts).toBe(1); // the second call short-circuited on status === "SENT", never incremented again
  });
});
