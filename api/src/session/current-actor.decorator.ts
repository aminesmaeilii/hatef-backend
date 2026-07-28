import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { RequestActor } from "./actor.types";

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestActor => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.actor) {
    throw new Error("CurrentActor used outside a SessionAuthGuard-protected route");
  }
  return req.actor;
});
