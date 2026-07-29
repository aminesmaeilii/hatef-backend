import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { HealthResponse } from "@hatef/contracts";

@Controller()
@SkipThrottle()
export class RootHealthController {
  @Get()
  liveness(): HealthResponse {
    return {
      status: "ok",
      service: "api",
      timestamp: new Date().toISOString(),
    };
  }
}
