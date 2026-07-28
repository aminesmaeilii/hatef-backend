import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { AppConfigService } from "../config/app-config.service";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client!: Redis;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    this.client = new Redis(this.config.env.REDIS_URL, { lazyConnect: true });
    this.client.on("error", (error) => this.logger.error("Redis connection error", error));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<void> {
    if (this.client.status === "wait" || this.client.status === "end") {
      await this.client.connect();
    }
    await this.client.ping();
  }
}
