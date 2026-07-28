import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

interface CorrelationContext {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelationId<T>(correlationId: string | undefined, fn: () => T): T {
  return storage.run({ correlationId: correlationId ?? randomUUID() }, fn);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function newCorrelationId(): string {
  return randomUUID();
}
