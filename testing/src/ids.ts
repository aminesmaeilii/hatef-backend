import { randomUUID } from "node:crypto";

/** Deterministic-looking but unique fixture id, for readable test assertions. */
export function fixtureId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
