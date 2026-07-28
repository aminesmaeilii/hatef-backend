import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  addChecklistItemSchema,
  addTaskCommentSchema,
  addTaskDependencySchema,
  createTaskSchema,
  rescheduleTaskSchema,
  taskStatusSchema,
  toggleChecklistItemSchema,
  transitionTaskSchema,
  updateTaskSchema,
  type AddChecklistItem,
  type AddTaskComment,
  type AddTaskDependency,
  type CreateTask,
  type RescheduleTask,
  type TaskStatusKey,
  type ToggleChecklistItem,
  type TransitionTask,
  type UpdateTask,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async create(@Body(new ZodValidationPipe(createTaskSchema)) body: CreateTask, @CurrentActor() actor: RequestActor) {
    return this.tasks.create(body, actor);
  }

  @Get("workload")
  @RequirePermission(PERMISSIONS.TASK_READ)
  async workload() {
    return this.tasks.workloadByAssignee();
  }

  @Get()
  @RequirePermission(PERMISSIONS.TASK_READ)
  async list(
    @Query("assigneeId") assigneeId?: string,
    @Query("channelId") channelId?: string,
    @Query("status") status?: string,
    @Query("overdue") overdue?: string,
    @Query("linkedEntityType") linkedEntityType?: string,
    @Query("linkedEntityId") linkedEntityId?: string,
  ) {
    const parsedStatus = status ? taskStatusSchema.parse(status) : undefined;
    return this.tasks.list({
      assigneeId,
      channelId,
      status: parsedStatus as TaskStatusKey | undefined,
      overdue: overdue === "true",
      linkedEntityType,
      linkedEntityId,
    });
  }

  @Get(":taskId")
  @RequirePermission(PERMISSIONS.TASK_READ)
  async getOne(@Param("taskId") taskId: string) {
    return this.tasks.getDetail(taskId);
  }

  @Patch(":taskId")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async update(@Param("taskId") taskId: string, @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTask) {
    return this.tasks.update(taskId, body);
  }

  @Post(":taskId/transition")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async transition(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(transitionTaskSchema)) body: TransitionTask,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.tasks.transition(taskId, body.toStatus, body.note, actor);
    return { ok: true };
  }

  @Post(":taskId/reschedule")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async reschedule(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(rescheduleTaskSchema)) body: RescheduleTask,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tasks.reschedule(taskId, body, actor);
  }

  @Post(":taskId/dependencies")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async addDependency(@Param("taskId") taskId: string, @Body(new ZodValidationPipe(addTaskDependencySchema)) body: AddTaskDependency) {
    await this.tasks.addDependency(taskId, body.dependsOnTaskId);
    return { ok: true };
  }

  @Delete("dependencies/:dependencyId")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async removeDependency(@Param("dependencyId") dependencyId: string) {
    await this.tasks.removeDependency(dependencyId);
    return { ok: true };
  }

  @Post(":taskId/comments")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async addComment(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(addTaskCommentSchema)) body: AddTaskComment,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.tasks.addComment(taskId, body, actor);
  }

  @Post(":taskId/checklist")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async addChecklistItem(@Param("taskId") taskId: string, @Body(new ZodValidationPipe(addChecklistItemSchema)) body: AddChecklistItem) {
    return this.tasks.addChecklistItem(taskId, body.label);
  }

  @Patch(":taskId/checklist/:itemId")
  @RequirePermission(PERMISSIONS.TASK_MANAGE)
  async toggleChecklistItem(
    @Param("taskId") taskId: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(toggleChecklistItemSchema)) body: ToggleChecklistItem,
  ) {
    return this.tasks.toggleChecklistItem(taskId, itemId, body.done);
  }
}
