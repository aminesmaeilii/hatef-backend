import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { RootHealthController } from "./root-health.controller";

@Module({
  controllers: [HealthController, RootHealthController],
  providers: [HealthService],
})
export class HealthModule {}
