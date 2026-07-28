import { describe, expect, it, vi } from "vitest";
import { HealthController } from "./health.controller";
import type { HealthService } from "./health.service";

function fakeResponse() {
  const res: { statusCode?: number; status: (code: number) => typeof res } = {
    status(code: number) {
      res.statusCode = code;
      return res;
    },
  };
  return res as unknown as import("express").Response;
}

describe("HealthController", () => {
  it("liveness always reports ok without checking dependencies", () => {
    const controller = new HealthController({} as HealthService);
    const result = controller.liveness();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("api");
  });

  it("readiness reports ok and 200 when all checks are up", async () => {
    const healthService = {
      checkReadiness: vi.fn().mockResolvedValue([
        { name: "postgres", status: "up", latencyMs: 1 },
        { name: "redis", status: "up", latencyMs: 1 },
      ]),
    } as unknown as HealthService;

    const controller = new HealthController(healthService);
    const res = fakeResponse();
    const result = await controller.readiness(res);

    expect(result.status).toBe("ok");
    expect((res as unknown as { statusCode: number }).statusCode).toBe(200);
  });

  it("readiness reports degraded and 503 when a dependency is down", async () => {
    const healthService = {
      checkReadiness: vi.fn().mockResolvedValue([
        { name: "postgres", status: "up", latencyMs: 1 },
        { name: "redis", status: "down", error: "connection refused" },
      ]),
    } as unknown as HealthService;

    const controller = new HealthController(healthService);
    const res = fakeResponse();
    const result = await controller.readiness(res);

    expect(result.status).toBe("degraded");
    expect((res as unknown as { statusCode: number }).statusCode).toBe(503);
  });
});
