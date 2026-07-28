import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { AppConfigService } from "../config/app-config.service";
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    client: Redis;
    constructor(config: AppConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    ping(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map