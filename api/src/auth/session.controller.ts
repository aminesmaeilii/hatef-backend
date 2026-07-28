import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { MeResponse, SessionListItem } from "@hatef/contracts";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { SessionService } from "../session/session.service";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { WorkspaceService } from "./workspace.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("auth")
@UseGuards(SessionAuthGuard)
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    private readonly workspace: WorkspaceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("me/contexts")
  async meContexts(@CurrentActor() actor: RequestActor): Promise<MeResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
    const contexts = await this.workspace.getContexts(actor.userId);
    return { user: { id: user.id, displayName: user.displayName, email: user.email }, contexts };
  }

  @Get("sessions")
  async listSessions(@CurrentActor() actor: RequestActor): Promise<SessionListItem[]> {
    const sessions = await this.sessions.listSessions(actor.userId);
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      current: session.id === actor.sessionId,
    }));
  }

  @Delete("sessions/:id")
  async revokeSession(@CurrentActor() actor: RequestActor, @Param("id") id: string): Promise<{ ok: true }> {
    await this.sessions.revokeSession(id, actor.userId);
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentActor() actor: RequestActor, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    await this.sessions.revokeSession(actor.sessionId, actor.userId);
    this.sessions.clearSessionCookie(res);
    return { ok: true };
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentActor() actor: RequestActor,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.sessions.revokeAllSessions(actor.userId);
    this.sessions.clearSessionCookie(res);
    return { ok: true };
  }
}
