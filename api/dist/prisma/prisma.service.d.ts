import { OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@hatef/database";
export declare class PrismaService extends PrismaClient implements OnModuleDestroy {
    onModuleDestroy(): Promise<void>;
    ping(): Promise<void>;
}
//# sourceMappingURL=prisma.service.d.ts.map