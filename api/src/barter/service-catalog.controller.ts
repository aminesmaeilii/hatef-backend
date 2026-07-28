import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createServiceCatalogItemSchema,
  createServiceCatalogVersionSchema,
  type CreateServiceCatalogItem,
  type CreateServiceCatalogVersion,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { ServiceCatalogService } from "./service-catalog.service";

@Controller("service-catalog")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ServiceCatalogController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SERVICE_CATALOG_MANAGE)
  async create(@Body(new ZodValidationPipe(createServiceCatalogItemSchema)) body: CreateServiceCatalogItem, @CurrentActor() actor: RequestActor) {
    return this.catalog.create(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.OBLIGATION_READ)
  async list() {
    return this.catalog.list();
  }

  @Get(":itemId")
  @RequirePermission(PERMISSIONS.OBLIGATION_READ)
  async getOne(@Param("itemId") itemId: string) {
    return this.catalog.getOne(itemId);
  }

  @Post(":itemId/versions")
  @RequirePermission(PERMISSIONS.SERVICE_CATALOG_MANAGE)
  async addVersion(@Param("itemId") itemId: string, @Body(new ZodValidationPipe(createServiceCatalogVersionSchema)) body: CreateServiceCatalogVersion) {
    return this.catalog.addVersion(itemId, body);
  }
}
