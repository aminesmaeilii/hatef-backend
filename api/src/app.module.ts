import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppConfigModule } from "./config/app-config.module";
import { AppConfigService } from "./config/app-config.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { SessionModule } from "./session/session.module";
import { RbacModule } from "./rbac/rbac.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ChannelsModule } from "./channels/channels.module";
import { FilesModule } from "./files/files.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { FormsModule } from "./forms/forms.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { TasksModule } from "./tasks/tasks.module";
import { CalendarModule } from "./calendar/calendar.module";
import { LedgerModule } from "./ledger/ledger.module";
import { BarterModule } from "./barter/barter.module";
import { SettlementsModule } from "./settlements/settlements.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { TicketsModule } from "./tickets/tickets.module";
import { SurveysModule } from "./surveys/surveys.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        { name: "default", ttl: config.env.RATE_LIMIT_WINDOW_MS, limit: config.env.RATE_LIMIT_MAX },
      ],
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    SessionModule,
    RbacModule,
    AuditModule,
    AuthModule,
    ChannelsModule,
    FilesModule,
    EvaluationModule,
    FormsModule,
    PromotionsModule,
    TasksModule,
    CalendarModule,
    LedgerModule,
    BarterModule,
    SettlementsModule,
    NotificationsModule,
    TicketsModule,
    SurveysModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
