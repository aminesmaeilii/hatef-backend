"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const ledger_module_1 = require("../ledger/ledger.module");
const notifications_module_1 = require("../notifications/notifications.module");
const auth_module_1 = require("../auth/auth.module");
const settlements_service_1 = require("./settlements.service");
const settlements_controller_1 = require("./settlements.controller");
let SettlementsModule = class SettlementsModule {
};
exports.SettlementsModule = SettlementsModule;
exports.SettlementsModule = SettlementsModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule, ledger_module_1.LedgerModule, notifications_module_1.NotificationsModule, auth_module_1.AuthModule],
        controllers: [settlements_controller_1.SettlementsController, settlements_controller_1.ChannelSettlementsController],
        providers: [settlements_service_1.SettlementsService],
        exports: [settlements_service_1.SettlementsService],
    })
], SettlementsModule);
