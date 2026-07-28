import type { RoleAssignment } from "@hatef/auth";
export interface RequestActor {
    userId: string;
    sessionId: string;
    csrfToken: string;
    roleAssignments: RoleAssignment[];
    stepUpVerifiedAt: Date | null;
}
declare global {
    namespace Express {
        interface Request {
            actor?: RequestActor;
        }
    }
}
//# sourceMappingURL=actor.types.d.ts.map