import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { rubricCriterionSchema } from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { RubricsService } from "./rubrics.service";

const createRubricSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  criteria: z.array(rubricCriterionSchema).min(1),
});

@Controller("rubrics")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class RubricsController {
  constructor(private readonly rubrics: RubricsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EVALUATION_READ)
  async list() {
    return this.rubrics.listPublished();
  }

  @Post()
  @RequirePermission(PERMISSIONS.EVALUATION_DECIDE)
  async create(@Body(new ZodValidationPipe(createRubricSchema)) body: z.infer<typeof createRubricSchema>) {
    return this.rubrics.create(body);
  }

  @Post(":rubricId/publish")
  @RequirePermission(PERMISSIONS.EVALUATION_DECIDE)
  async publish(@Param("rubricId") rubricId: string) {
    return this.rubrics.publish(rubricId);
  }
}
