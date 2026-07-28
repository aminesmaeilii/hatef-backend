import type { RoleAssignment } from "@hatef/auth";

export interface RequestActor {
  userId: string;
  sessionId: string;
  csrfToken: string;
  roleAssignments: RoleAssignment[];
  stepUpVerifiedAt: Date | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: RequestActor;
    }
  }
}
