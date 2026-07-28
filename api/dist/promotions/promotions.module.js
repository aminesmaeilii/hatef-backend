"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const ledger_module_1 = require("../ledger/ledger.module");
const notifications_module_1 = require("../notifications/notifications.module");
const auth_module_1 = require("../auth/auth.module");
const promotion_types_service_1 = require("./promotion-types.service");
const promotion_types_controller_1 = require("./promotion-types.controller");
const published_promotion_types_controller_1 = require("./published-promotion-types.controller");
const support_requests_service_1 = require("./support-requests.service");
const support_requests_controller_1 = require("./support-requests.controller");
const support_request_ops_controller_1 = require("./support-request-ops.controller");
let PromotionsModule = class PromotionsModule {
};
exports.PromotionsModule = PromotionsModule;
exports.PromotionsModule = PromotionsModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule, ledger_module_1.LedgerModule, notifications_module_1.NotificationsModule, auth_module_1.AuthModule],
        controllers: [
            promotion_types_controller_1.PromotionTypesController,
            published_promotion_types_controller_1.PublishedPromotionTypesController,
            support_requests_controller_1.SupportRequestsController,
            support_request_ops_controller_1.SupportRequestOpsController,
        ],
        providers: [promotion_types_service_1.PromotionTypesService, support_requests_service_1.SupportRequestsService],
        exports: [support_requests_service_1.SupportRequestsService],
    })
], PromotionsModule);
