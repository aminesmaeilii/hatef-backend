import type { FileAsset } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { StorageService } from "./storage.service";
import { type AntivirusScanner } from "./antivirus-scanner.interface";
export interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    size: number;
}
export declare class FilesService {
    private readonly prisma;
    private readonly storage;
    private readonly config;
    private readonly auditLog;
    private readonly antivirus;
    constructor(prisma: PrismaService, storage: StorageService, config: AppConfigService, auditLog: AuditLogService, antivirus: AntivirusScanner);
    upload(channelId: string, file: UploadedFile, actor: RequestActor, ip?: string): Promise<FileAsset>;
    list(channelId: string): Promise<FileAsset[]>;
    getWithDownloadUrl(channelId: string, fileId: string, actor: RequestActor, ip?: string): Promise<FileAsset>;
}
//# sourceMappingURL=files.service.d.ts.map