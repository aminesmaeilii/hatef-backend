import { Injectable } from "@nestjs/common";
import type { ReadinessCheck } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkReadiness(): Promise<ReadinessCheck[]> {
    return Promise.all([this.checkDatabase(), this.checkRedis()]);
  }

  private async checkDatabase(): Promise<ReadinessCheck> {
    const start = Date.now();
    try {
      await this.prisma.ping();
      return { name: "postgres", status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      return { name: "postgres", status: "down", error: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<ReadinessCheck> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return { name: "redis", status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      return { name: "redis", status: "down", error: (error as Error).message };
    }
  }
}
