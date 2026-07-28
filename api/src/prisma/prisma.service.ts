import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@hatef/database";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
