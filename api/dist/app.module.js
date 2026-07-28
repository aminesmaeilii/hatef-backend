"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_config_module_1 = require("./config/app-config.module");
const app_config_service_1 = require("./config/app-config.service");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const health_module_1 = require("./health/health.module");
const session_module_1 = require("./session/session.module");
const rbac_module_1 = require("./rbac/rbac.module");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const channels_module_1 = require("./channels/channels.module");
const files_module_1 = require("./files/files.module");
const evaluation_module_1 = require("./evaluation/evaluation.module");
const forms_module_1 = require("./forms/forms.module");
const promotions_module_1 = require("./promotions/promotions.module");
const tasks_module_1 = require("./tasks/tasks.module");
const calendar_module_1 = require("./calendar/calendar.module");
const ledger_module_1 = require("./ledger/ledger.module");
const barter_module_1 = require("./barter/barter.module");
const settlements_module_1 = require("./settlements/settlements.module");
const notifications_module_1 = require("./notifications/notifications.module");
const tickets_module_1 = require("./tickets/tickets.module");
const surveys_module_1 = require("./surveys/surveys.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            app_config_module_1.AppConfigModule,
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [app_config_service_1.AppConfigService],
                useFactory: (config) => [
                    { name: "default", ttl: config.env.RATE_LIMIT_WINDOW_MS, limit: config.env.RATE_LIMIT_MAX },
                ],
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            health_module_1.HealthModule,
            session_module_1.SessionModule,
            rbac_module_1.RbacModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            channels_module_1.ChannelsModule,
            files_module_1.FilesModule,
            evaluation_module_1.EvaluationModule,
            forms_module_1.FormsModule,
            promotions_module_1.PromotionsModule,
            tasks_module_1.TasksModule,
            calendar_module_1.CalendarModule,
            ledger_module_1.LedgerModule,
            barter_module_1.BarterModule,
            settlements_module_1.SettlementsModule,
            notifications_module_1.NotificationsModule,
            tickets_module_1.TicketsModule,
            surveys_module_1.SurveysModule,
            reports_module_1.ReportsModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
