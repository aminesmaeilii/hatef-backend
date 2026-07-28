"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarterModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const ledger_module_1 = require("../ledger/ledger.module");
const notifications_module_1 = require("../notifications/notifications.module");
const service_catalog_service_1 = require("./service-catalog.service");
const service_catalog_controller_1 = require("./service-catalog.controller");
const obligations_service_1 = require("./obligations.service");
const obligations_ops_controller_1 = require("./obligations-ops.controller");
const obligations_partner_controller_1 = require("./obligations-partner.controller");
const rate_cards_service_1 = require("./rate-cards.service");
let BarterModule = class BarterModule {
};
exports.BarterModule = BarterModule;
exports.BarterModule = BarterModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule, ledger_module_1.LedgerModule, notifications_module_1.NotificationsModule],
        controllers: [
            service_catalog_controller_1.ServiceCatalogController,
            obligations_ops_controller_1.ObligationsOpsController,
            obligations_partner_controller_1.ObligationsPartnerController,
            obligations_partner_controller_1.RateCardPartnerController,
            obligations_partner_controller_1.RateCardOpsController,
        ],
        providers: [service_catalog_service_1.ServiceCatalogService, obligations_service_1.ObligationsService, rate_cards_service_1.RateCardsService],
        exports: [service_catalog_service_1.ServiceCatalogService, obligations_service_1.ObligationsService, rate_cards_service_1.RateCardsService],
    })
], BarterModule);
