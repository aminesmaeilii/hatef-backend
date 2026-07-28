"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const channels_service_1 = require("./channels.service");
const channels_controller_1 = require("./channels.controller");
let ChannelsModule = class ChannelsModule {
};
exports.ChannelsModule = ChannelsModule;
exports.ChannelsModule = ChannelsModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule],
        controllers: [channels_controller_1.ChannelsController],
        providers: [channels_service_1.ChannelsService],
        exports: [channels_service_1.ChannelsService],
    })
], ChannelsModule);
