import type { ReadinessCheck } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    checkReadiness(): Promise<ReadinessCheck[]>;
    private checkDatabase;
    private checkRedis;
}
//# sourceMappingURL=health.service.d.ts.map