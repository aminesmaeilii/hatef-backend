import { randomUUID, createHash } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import type { FileAsset } from "@hatef/contracts";
import type { FileAsset as PrismaFileAsset } from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { StorageService } from "./storage.service";
import { sniffMimeType } from "./magic-byte";
import { ANTIVIRUS_SCANNER, type AntivirusScanner } from "./antivirus-scanner.interface";

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  size: number;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: AppConfigService,
    private readonly auditLog: AuditLogService,
    @Inject(ANTIVIRUS_SCANNER) private readonly antivirus: AntivirusScanner,
  ) {}

  async upload(channelId: string, file: UploadedFile, actor: RequestActor, ip?: string): Promise<FileAsset> {
    const maxBytes = this.config.env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new PayloadTooLargeException(`حجم فایل نباید بیشتر از ${this.config.env.MAX_UPLOAD_SIZE_MB} مگابایت باشد.`);
    }

    const existingCount = await this.prisma.fileAsset.count({ where: { channelId } });
    if (existingCount >= this.config.env.MAX_FILES_PER_CHANNEL) {
      throw new BadRequestException(`تعداد فایل‌های این کانال به حداکثر مجاز (${this.config.env.MAX_FILES_PER_CHANNEL}) رسیده است.`);
    }

    const sniffed = sniffMimeType(file.buffer);
    if (!sniffed) {
      throw new BadRequestException("نوع فایل مجاز نیست.");
    }

    const scan = await this.antivirus.scan(file.buffer);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Infected uploads are written under a separate `quarantine/` prefix —
    // never the same key namespace `getSignedDownloadUrl` serves from — so a
    // future bug there can't accidentally hand out a link to malware.
    const scanStatus: PrismaFileAsset["scanStatus"] = scan.clean ? "CLEAN" : "INFECTED";
    const storageKey = `${scanStatus === "CLEAN" ? "uploads" : "quarantine"}/${channelId}/${randomUUID()}-${safeName}`;

    try {
      await this.storage.putObject(storageKey, file.buffer, sniffed);
    } catch (error) {
      throw new BadRequestException({
        code: "STORAGE_UPLOAD_FAILED",
        message:
          "بارگذاری فایل در فضای ابری ناموفق بود. لطفاً تنظیمات Object Storage لیارا را بررسی کنید.",
        cause: error instanceof Error ? error.message : String(error),
      });
    }

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

  async list(channelId: string): Promise<FileAsset[]> {
    const assets = await this.prisma.fileAsset.findMany({ where: { channelId }, orderBy: { createdAt: "desc" } });
    return assets.map((asset) => toFileDto(asset));
  }

  async getWithDownloadUrl(channelId: string, fileId: string, actor: RequestActor, ip?: string): Promise<FileAsset> {
    // Scoped by channelId, not just fileId, so a valid channel-scoped grant
    // on channel A can never resolve a file that actually belongs to channel B.
    const asset = await this.prisma.fileAsset.findFirst({ where: { id: fileId, channelId } });
    if (!asset) {
      throw new NotFoundException("فایل یافت نشد.");
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
      throw new ForbiddenException("این فایل به دلیل شناسایی تهدید امنیتی قرنطینه شده و قابل دانلود نیست.");
    }

    await this.prisma.fileAccessEvent.create({
      data: { fileId: asset.id, actorId: actor.userId, action: "DOWNLOAD", ipAddress: ip },
    });

    const downloadUrl = await this.storage.getSignedDownloadUrl(asset.storageKey);
    return toFileDto(asset, downloadUrl);
  }

  async getCleanDownloadUrl(channelId: string, fileId: string): Promise<string | null> {
    const asset = await this.prisma.fileAsset.findFirst({ where: { id: fileId, channelId, scanStatus: "CLEAN" } });
    if (!asset) return null;
    return this.storage.getSignedDownloadUrl(asset.storageKey);
  }
}

function toFileDto(asset: PrismaFileAsset, downloadUrl?: string): FileAsset {
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
