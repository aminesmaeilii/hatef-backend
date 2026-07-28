import type { Response } from "express";
import type { HealthResponse, ReadinessResponse } from "@hatef/contracts";
import { HealthService } from "./health.service";
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    liveness(): HealthResponse;
    readiness(res: Response): Promise<ReadinessResponse>;
}
//# sourceMappingURL=health.controller.d.ts.map