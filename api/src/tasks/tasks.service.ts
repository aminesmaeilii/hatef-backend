import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { findTaskDateConflicts, IllegalStateTransitionError } from "@hatef/domain";
import type {
  AddTaskComment,
  CreateTask,
  RescheduleTask,
  Task,
  TaskChecklistItem,
  TaskCommentDto,
  TaskDependencyDto,
  TaskDetail,
  TaskStatusEventDto,
  TaskStatusKey,
  UpdateTask,
} from "@hatef/contracts";
import type { Task as PrismaTask } from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { taskStateMachine } from "./task-state-machine";

type TaskWithJoins = PrismaTask & {
  assignee: { displayName: string } | null;
  channel: { title: string } | null;
};

export interface TaskListFilters {
  assigneeId?: string;
  channelId?: string;
  status?: TaskStatusKey;
  overdue?: boolean;
  linkedEntityType?: string;
  linkedEntityId?: string;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(input: CreateTask, actor: RequestActor): Promise<Task> {
    if (input.assigneeId) {
      await this.prisma.user.findUniqueOrThrow({ where: { id: input.assigneeId } });
    }

    const created = await this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        createdById: actor.userId,
        watcherIds: input.watcherIds,
        channelId: input.channelId,
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: input.linkedEntityId,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        estimateMinutes: input.estimateMinutes,
        reminderAt: input.reminderAt ? new Date(input.reminderAt) : undefined,
      },
      include: { assignee: { select: { displayName: true } }, channel: { select: { title: true } } },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "task.created",
      entityType: "task",
      entityId: created.id,
    });

    return toTaskDto(created);
  }

  async list(filters: TaskListFilters): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: filters.assigneeId,
        channelId: filters.channelId,
        status: filters.status,
        linkedEntityType: filters.linkedEntityType,
        linkedEntityId: filters.linkedEntityId,
        ...(filters.overdue
          ? { dueDate: { lt: new Date() }, status: { notIn: ["DONE", "CANCELLED"] } }
          : {}),
      },
      include: { assignee: { select: { displayName: true } }, channel: { select: { title: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
    return tasks.map(toTaskDto);
  }

  /** Grouped counts for the "workload by assignee" view (spec 14.1) — always computed live, never a static number. */
  async workloadByAssignee(): Promise<{ assigneeId: string; assigneeName: string; openTaskCount: number }[]> {
    const openTasks = await this.prisma.task.findMany({
      where: { status: { notIn: ["DONE", "CANCELLED"] }, assigneeId: { not: null } },
      include: { assignee: { select: { displayName: true } } },
    });

    const byAssignee = new Map<string, { assigneeName: string; count: number }>();
    for (const task of openTasks) {
      if (!task.assigneeId) continue;
      const entry = byAssignee.get(task.assigneeId) ?? { assigneeName: task.assignee?.displayName ?? "", count: 0 };
      entry.count += 1;
      byAssignee.set(task.assigneeId, entry);
    }

    return [...byAssignee.entries()]
      .map(([assigneeId, { assigneeName, count }]) => ({ assigneeId, assigneeName, openTaskCount: count }))
      .sort((a, b) => b.openTaskCount - a.openTaskCount);
  }

  async getDetail(taskId: string): Promise<TaskDetail> {
    const task = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        assignee: { select: { displayName: true } },
        channel: { select: { title: true } },
        comments: { include: { author: { select: { displayName: true } } }, orderBy: { createdAt: "asc" } },
        dependsOn: { include: { dependsOnTask: { select: { id: true, title: true, status: true, dueDate: true } } } },
        statusEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    return {
      ...toTaskDto(task),
      comments: task.comments.map(
        (c): TaskCommentDto => ({
          id: c.id,
          authorId: c.authorId,
          authorName: c.author.displayName,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
        }),
      ),
      dependencies: task.dependsOn.map(
        (d): TaskDependencyDto => ({
          id: d.id,
          dependsOnTaskId: d.dependsOnTask.id,
          dependsOnTaskTitle: d.dependsOnTask.title,
          dependsOnTaskStatus: d.dependsOnTask.status,
          dependsOnTaskDueDate: d.dependsOnTask.dueDate?.toISOString() ?? null,
        }),
      ),
      statusEvents: task.statusEvents.map(
        (e): TaskStatusEventDto => ({
          id: e.id,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        }),
      ),
    };
  }

  async update(taskId: string, input: UpdateTask): Promise<Task> {
    if (input.assigneeId) {
      await this.prisma.user.findUniqueOrThrow({ where: { id: input.assigneeId } });
    }
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        watcherIds: input.watcherIds,
        estimateMinutes: input.estimateMinutes,
        reminderAt: input.reminderAt === null ? null : input.reminderAt ? new Date(input.reminderAt) : undefined,
      },
      include: { assignee: { select: { displayName: true } }, channel: { select: { title: true } } },
    });
    return toTaskDto(updated);
  }

  async transition(taskId: string, toStatus: TaskStatusKey, note: string | undefined, actor: RequestActor): Promise<void> {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });

    try {
      taskStateMachine.assertTransition(task.status, toStatus);
    } catch (error) {
      if (error instanceof IllegalStateTransitionError) {
        throw new BadRequestException(`تغییر وضعیت از «${task.status}» به «${toStatus}» مجاز نیست.`);
      }
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id: taskId }, data: { status: toStatus } }),
      this.prisma.taskStatusEvent.create({
        data: { taskId, fromStatus: task.status, toStatus, note, createdBy: actor.userId },
      }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "task.transitioned",
      entityType: "task",
      entityId: taskId,
      metadata: { from: task.status, to: toStatus },
    });
  }

  /** The validated backend behind the Gantt/calendar's drag-to-reschedule (spec 14.3/15). */
  async reschedule(taskId: string, input: RescheduleTask, actor: RequestActor): Promise<Task> {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { dependsOnTask: { select: { id: true, dueDate: true } } },
    });

    const nextStartDate = input.startDate === undefined ? task.startDate : input.startDate ? new Date(input.startDate) : null;
    const nextDueDate = input.dueDate === undefined ? task.dueDate : input.dueDate ? new Date(input.dueDate) : null;

    const conflicts = findTaskDateConflicts(
      { startDate: nextStartDate, dueDate: nextDueDate },
      dependencies.map((d) => ({ taskId: d.dependsOnTask.id, dueDate: d.dependsOnTask.dueDate })),
    );
    if (conflicts.length > 0) {
      const messages = conflicts.map((c) =>
        c.reason === "DUE_BEFORE_START"
          ? "تاریخ سررسید نمی‌تواند قبل از تاریخ شروع باشد."
          : "تاریخ شروع نمی‌تواند قبل از سررسید وظیفه‌ی پیش‌نیاز باشد.",
      );
      throw new BadRequestException(messages.join(" "));
    }

    const before = { startDate: task.startDate, dueDate: task.dueDate };
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { startDate: nextStartDate, dueDate: nextDueDate },
      include: { assignee: { select: { displayName: true } }, channel: { select: { title: true } } },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "task.rescheduled",
      entityType: "task",
      entityId: taskId,
      before: { startDate: before.startDate?.toISOString() ?? null, dueDate: before.dueDate?.toISOString() ?? null },
      after: { startDate: nextStartDate?.toISOString() ?? null, dueDate: nextDueDate?.toISOString() ?? null },
    });

    return toTaskDto(updated);
  }

  async addDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException("یک وظیفه نمی‌تواند به خودش وابسته باشد.");
    }
    await this.prisma.task.findUniqueOrThrow({ where: { id: dependsOnTaskId } });
    await this.prisma.taskDependency.create({ data: { taskId, dependsOnTaskId } }).catch(() => {
      throw new BadRequestException("این وابستگی قبلاً ثبت شده است.");
    });
  }

  async removeDependency(dependencyId: string): Promise<void> {
    await this.prisma.taskDependency.delete({ where: { id: dependencyId } });
  }

  async addComment(taskId: string, input: AddTaskComment, actor: RequestActor): Promise<TaskCommentDto> {
    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorId: actor.userId, body: input.body },
      include: { author: { select: { displayName: true } } },
    });
    return { id: comment.id, authorId: comment.authorId, authorName: comment.author.displayName, body: comment.body, createdAt: comment.createdAt.toISOString() };
  }

  async addChecklistItem(taskId: string, label: string): Promise<TaskChecklistItem[]> {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    const items = (task.checklistItems as TaskChecklistItem[]) ?? [];
    const next = [...items, { id: randomUUID(), label, done: false, doneAt: null }];
    await this.prisma.task.update({ where: { id: taskId }, data: { checklistItems: next as never } });
    return next;
  }

  async toggleChecklistItem(taskId: string, itemId: string, done: boolean): Promise<TaskChecklistItem[]> {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    const items = (task.checklistItems as TaskChecklistItem[]) ?? [];
    const itemExists = items.some((i) => i.id === itemId);
    if (!itemExists) {
      throw new NotFoundException("مورد چک‌لیست یافت نشد.");
    }
    const next = items.map((i) => (i.id === itemId ? { ...i, done, doneAt: done ? new Date().toISOString() : null } : i));
    await this.prisma.task.update({ where: { id: taskId }, data: { checklistItems: next as never } });
    return next;
  }
}

function toTaskDto(task: TaskWithJoins): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.displayName ?? null,
    createdById: task.createdById,
    watcherIds: task.watcherIds,
    channelId: task.channelId,
    channelTitle: task.channel?.title ?? null,
    linkedEntityType: task.linkedEntityType,
    linkedEntityId: task.linkedEntityId,
    startDate: task.startDate?.toISOString() ?? null,
    dueDate: task.dueDate?.toISOString() ?? null,
    estimateMinutes: task.estimateMinutes,
    reminderAt: task.reminderAt?.toISOString() ?? null,
    checklistItems: (task.checklistItems as TaskChecklistItem[]) ?? [],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
