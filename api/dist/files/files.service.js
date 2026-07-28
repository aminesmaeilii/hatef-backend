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
exports.FilesService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const storage_service_1 = require("./storage.service");
const magic_byte_1 = require("./magic-byte");
const antivirus_scanner_interface_1 = require("./antivirus-scanner.interface");
let FilesService = class FilesService {
    prisma;
    storage;
    config;
    auditLog;
    antivirus;
    constructor(prisma, storage, config, auditLog, antivirus) {
        this.prisma = prisma;
        this.storage = storage;
        this.config = config;
        this.auditLog = auditLog;
        this.antivirus = antivirus;
    }
    async upload(channelId, file, actor, ip) {
        const maxBytes = this.config.env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
        if (file.size > maxBytes) {
            throw new common_1.PayloadTooLargeException(`حجم فایل نباید بیشتر از ${this.config.env.MAX_UPLOAD_SIZE_MB} مگابایت باشد.`);
        }
        const existingCount = await this.prisma.fileAsset.count({ where: { channelId } });
        if (existingCount >= this.config.env.MAX_FILES_PER_CHANNEL) {
            throw new common_1.BadRequestException(`تعداد فایل‌های این کانال به حداکثر مجاز (${this.config.env.MAX_FILES_PER_CHANNEL}) رسیده است.`);
        }
        const sniffed = (0, magic_byte_1.sniffMimeType)(file.buffer);
        if (!sniffed) {
            throw new common_1.BadRequestException("نوع فایل مجاز نیست.");
        }
        const scan = await this.antivirus.scan(file.buffer);
        const checksum = (0, node_crypto_1.createHash)("sha256").update(file.buffer).digest("hex");
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Infected uploads are written under a separate `quarantine/` prefix —
        // never the same key namespace `getSignedDownloadUrl` serves from — so a
        // future bug there can't accidentally hand out a link to malware.
        const scanStatus = scan.clean ? "CLEAN" : "INFECTED";
        const storageKey = `${scanStatus === "CLEAN" ? "uploads" : "quarantine"}/${channelId}/${(0, node_crypto_1.randomUUID)()}-${safeName}`;
        await this.storage.putObject(storageKey, file.buffer, sniffed);
        const asset = await this.prisma.fileAsset.create({
            data: {
                uploaderId: actor.userId,
                channelId,
                storageKey,
                originalName: file.originalname,
                mimeType: sniffed,
                sizeBytes: file.size,
                checksumSha256: checksum,
                scanStatus,
            },
        });
        await this.prisma.fileAccessEvent.create({
            data: { fileId: asset.id, actorId: actor.userId, action: "UPLOAD", ipAddress: ip },
        });
        await this.auditLog.record({
            actorId: actor.userId,
            actorType: "user",
            action: scanStatus === "CLEAN" ? "file.uploaded" : "file.quarantined",
            entityType: "file",
            entityId: asset.id,
            metadata: { channelId, mimeType: sniffed, sizeBytes: file.size, scanStatus: asset.scanStatus },
            ipAddress: ip,
        });
        return toFileDto(asset);
    }
    async list(channelId) {
        const assets = await this.prisma.fileAsset.findMany({ where: { channelId }, orderBy: { createdAt: "desc" } });
        return assets.map((asset) => toFileDto(asset));
    }
    async getWithDownloadUrl(channelId, fileId, actor, ip) {
        // Scoped by channelId, not just fileId, so a valid channel-scoped grant
        // on channel A can never resolve a file that actually belongs to channel B.
        const asset = await this.prisma.fileAsset.findFirst({ where: { id: fileId, channelId } });
        if (!asset) {
            throw new common_1.NotFoundException("فایل یافت نشد.");
        }
        if (asset.scanStatus !== "CLEAN") {
            await this.prisma.fileAccessEvent.create({
                data: { fileId: asset.id, actorId: actor.userId, action: "DOWNLOAD_BLOCKED", ipAddress: ip },
            });
            await this.auditLog.record({
                actorId: actor.userId,
                actorType: "user",
                action: "file.quarantine_download_blocked",
                entityType: "file",
                entityId: asset.id,
                metadata: { channelId, scanStatus: asset.scanStatus },
                ipAddress: ip,
            });
            throw new common_1.ForbiddenException("این فایل به دلیل شناسایی تهدید امنیتی قرنطینه شده و قابل دانلود نیست.");
        }
        await this.prisma.fileAccessEvent.create({
            data: { fileId: asset.id, actorId: actor.userId, action: "DOWNLOAD", ipAddress: ip },
        });
        const downloadUrl = await this.storage.getSignedDownloadUrl(asset.storageKey);
        return toFileDto(asset, downloadUrl);
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(antivirus_scanner_interface_1.ANTIVIRUS_SCANNER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        app_config_service_1.AppConfigService,
        audit_log_service_1.AuditLogService, Object])
], FilesService);
function toFileDto(asset, downloadUrl) {
    return {
        id: asset.id,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        scanStatus: asset.scanStatus,
        channelId: asset.channelId,
        createdAt: asset.createdAt.toISOString(),
        downloadUrl,
    };
}
