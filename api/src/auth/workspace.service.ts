import { Injectable } from "@nestjs/common";
import type { WorkspaceContext } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Purely a UI convenience list — every subsequent API call is authorized
 * from the session's own role assignments, never from a "selected
 * workspace", so this never doubles as an authorization decision.
 */
@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getContexts(userId: string): Promise<WorkspaceContext[]> {
    const [assignments, memberships] = await Promise.all([
      this.prisma.roleAssignment.findMany({ where: { userId }, include: { role: true } }),
      this.prisma.channelMembership.findMany({
        where: { userId, status: "ACTIVE" },
        include: { channel: true },
      }),
    ]);

    const contexts: WorkspaceContext[] = [];
    if (assignments.some((assignment) => assignment.role.scope === "INTERNAL")) {
      contexts.push({ type: "internal", label: "مدیریت هاتف" });
    }
    for (const membership of memberships) {
      contexts.push({
        type: "channel",
        label: membership.channel.title,
        channelId: membership.channelId,
        role: membership.role,
      });
    }
    return contexts;
  }
}
