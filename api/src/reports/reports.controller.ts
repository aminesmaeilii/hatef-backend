import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createReportDefinitionSchema,
  exportReportRunSchema,
  runReportSchema,
  type CreateReportDefinition,
  type ExportReportRun,
  type RunReport,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("datasets")
  @RequirePermission(PERMISSIONS.REPORT_READ)
  async listDatasets() {
    return this.reports.listDatasets();
  }

  @Post("definitions")
  @RequirePermission(PERMISSIONS.REPORT_MANAGE)
  async createDefinition(@Body(new ZodValidationPipe(createReportDefinitionSchema)) body: CreateReportDefinition, @CurrentActor() actor: RequestActor) {
    return this.reports.createDefinition(body, actor);
  }

  @Get("definitions")
  @RequirePermission(PERMISSIONS.REPORT_READ)
  async listDefinitions(@CurrentActor() actor: RequestActor) {
    return this.reports.listDefinitions(actor);
  }

  @Post("runs")
  @RequirePermission(PERMISSIONS.REPORT_READ)
  async run(@Body(new ZodValidationPipe(runReportSchema)) body: RunReport, @CurrentActor() actor: RequestActor) {
    return this.reports.runReport(body, actor);
  }

  @Get("runs")
  @RequirePermission(PERMISSIONS.REPORT_READ)
  async listRuns(@CurrentActor() actor: RequestActor) {
    return this.reports.listRuns(actor);
  }

  @Get("runs/:runId")
  @RequirePermission(PERMISSIONS.REPORT_READ)
  async getRun(@Param("runId") runId: string) {
    return this.reports.getRun(runId);
  }

  @Post("runs/:runId/export")
  @RequirePermission(PERMISSIONS.REPORT_EXPORT)
  async exportRun(
    @Param("runId") runId: string,
    @Body(new ZodValidationPipe(exportReportRunSchema)) body: ExportReportRun,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.reports.exportRun(runId, body, actor);
  }

  @Get("snapshots/:snapshotId")
  @RequirePermission(PERMISSIONS.REPORT_EXPORT)
  async getSnapshot(@Param("snapshotId") snapshotId: string) {
    return this.reports.getSnapshot(snapshotId);
  }
}
