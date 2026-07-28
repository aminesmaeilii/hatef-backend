import type { MfaEnrollResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";
export type InternalLoginResult = {
    status: "mfa_required";
    mfaToken: string;
} | {
    status: "ok";
    userId: string;
};
export declare class InternalAuthService {
    private readonly prisma;
    private readonly redis;
    private readonly config;
    private readonly auditLog;
    constructor(prisma: PrismaService, redis: RedisService, config: AppConfigService, auditLog: AuditLogService);
    login(rawMobile: string, password: string, ip?: string): Promise<InternalLoginResult>;
    verifyMfa(mfaToken: string, code: string, ip?: string): Promise<{
        userId: string;
    }>;
    enrollMfa(userId: string): Promise<MfaEnrollResponse>;
    confirmMfaEnrollment(userId: string, code: string): Promise<string[]>;
    private mfaEncryptionKey;
}
//# sourceMappingURL=internal-auth.service.d.ts.map