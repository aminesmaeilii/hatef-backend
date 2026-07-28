import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";
import { type SmsProvider } from "../sms/sms-provider.interface";
export declare class OtpService {
    private readonly prisma;
    private readonly redis;
    private readonly config;
    private readonly auditLog;
    private readonly sms;
    constructor(prisma: PrismaService, redis: RedisService, config: AppConfigService, auditLog: AuditLogService, sms: SmsProvider);
    requestOtp(rawMobile: string, ip?: string): Promise<{
        resendAvailableInSeconds: number;
        devCode?: string;
    }>;
    verifyOtp(rawMobile: string, code: string, ip?: string): Promise<{
        userId: string;
    }>;
    private assertRateLimit;
}
//# sourceMappingURL=otp.service.d.ts.map