import type { Response } from "express";
import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { HealthResponse, ReadinessResponse } from "@hatef/contracts";
import { HealthService } from "./health.service";

@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  liveness(): HealthResponse {
    return {
      status: "ok",
      service: "api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async readiness(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponse> {
    const checks = await this.healthService.checkReadiness();
    const allUp = checks.every((check) => check.status === "up");

    res.status(allUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: allUp ? "ok" : "degraded",
      service: "api",
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
