import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createCapacityResourceSchema, type CreateCapacityResource } from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CalendarService } from "./calendar.service";

@Controller("capacity-resources")
@UseGuards(SessionAuthGuard, PermissionGuard)
@RequirePermission(PERMISSIONS.CAPACITY_MANAGE)
export class CapacityResourcesController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  async list() {
    return this.calendar.listCapacityResources();
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createCapacityResourceSchema)) body: CreateCapacityResource) {
    return this.calendar.createCapacityResource(body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.calendar.deleteCapacityResource(id);
    return { ok: true };
  }
}
