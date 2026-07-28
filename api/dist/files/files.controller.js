"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const auth_1 = require("@hatef/auth");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const files_service_1 = require("./files.service");
// Hard backstop above the configurable MAX_UPLOAD_SIZE_MB (default 25MB) —
// FilesService enforces the real, configured limit with a proper error;
// this just bounds how much multer will ever buffer into memory.
const MULTER_HARD_LIMIT_BYTES = 50 * 1024 * 1024;
let FilesController = class FilesController {
    files;
    constructor(files) {
        this.files = files;
    }
    async upload(channelId, file, actor, req) {
        if (!file) {
            throw new common_1.BadRequestException("فایلی ارسال نشده است.");
        }
        return this.files.upload(channelId, file, actor, req.ip);
    }
    async list(channelId) {
        return this.files.list(channelId);
    }
    async getOne(channelId, fileId, actor, req) {
        return this.files.getWithDownloadUrl(channelId, fileId, actor, req.ip);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FILE_UPLOAD, { resourceType: "channel", resourceIdParam: "channelId" }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: MULTER_HARD_LIMIT_BYTES } })),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FILE_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":fileId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FILE_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("fileId")),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getOne", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)("channels/:channelId/files"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
