import type { Response } from "express";
import type { MeResponse, SessionListItem } from "@hatef/contracts";
import { SessionService } from "../session/session.service";
import type { RequestActor } from "../session/actor.types";
import { WorkspaceService } from "./workspace.service";
import { PrismaService } from "../prisma/prisma.service";
export declare class SessionController {
    private readonly sessions;
    private readonly workspace;
    private readonly prisma;
    constructor(sessions: SessionService, workspace: WorkspaceService, prisma: PrismaService);
    meContexts(actor: RequestActor): Promise<MeResponse>;
    listSessions(actor: RequestActor): Promise<SessionListItem[]>;
    revokeSession(actor: RequestActor, id: string): Promise<{
        ok: true;
    }>;
    logout(actor: RequestActor, res: Response): Promise<{
        ok: true;
    }>;
    logoutAll(actor: RequestActor, res: Response): Promise<{
        ok: true;
    }>;
}
//# sourceMappingURL=session.controller.d.ts.map