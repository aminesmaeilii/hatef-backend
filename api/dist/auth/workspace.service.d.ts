import type { WorkspaceContext } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
/**
 * Purely a UI convenience list — every subsequent API call is authorized
 * from the session's own role assignments, never from a "selected
 * workspace", so this never doubles as an authorization decision.
 */
export declare class WorkspaceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getContexts(userId: string): Promise<WorkspaceContext[]>;
}
//# sourceMappingURL=workspace.service.d.ts.map