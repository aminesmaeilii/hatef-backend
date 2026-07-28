"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const app_config_service_1 = require("../config/app-config.service");
const antivirus_scanner_interface_1 = require("./antivirus-scanner.interface");
const dev_antivirus_provider_1 = require("./dev-antivirus.provider");
const live_antivirus_provider_1 = require("./live-antivirus.provider");
const storage_service_1 = require("./storage.service");
const files_service_1 = require("./files.service");
const files_controller_1 = require("./files.controller");
let FilesModule = class FilesModule {
};
exports.FilesModule = FilesModule;
exports.FilesModule = FilesModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule],
        controllers: [files_controller_1.FilesController],
        providers: [
            storage_service_1.StorageService,
            dev_antivirus_provider_1.DevAntivirusProvider,
            live_antivirus_provider_1.LiveAntivirusProvider,
            {
                provide: antivirus_scanner_interface_1.ANTIVIRUS_SCANNER,
                useFactory: (config, dev, live) => config.env.ANTIVIRUS_PROVIDER === "live" ? live : dev,
                inject: [app_config_service_1.AppConfigService, dev_antivirus_provider_1.DevAntivirusProvider, live_antivirus_provider_1.LiveAntivirusProvider],
            },
            files_service_1.FilesService,
        ],
        exports: [files_service_1.FilesService],
    })
], FilesModule);
