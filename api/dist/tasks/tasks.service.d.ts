import type { AddTaskComment, CreateTask, RescheduleTask, Task, TaskChecklistItem, TaskCommentDto, TaskDetail, TaskStatusKey, UpdateTask } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
export interface TaskListFilters {
    assigneeId?: string;
    channelId?: string;
    status?: TaskStatusKey;
    overdue?: boolean;
    linkedEntityType?: string;
    linkedEntityId?: string;
}
export declare class TasksService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    create(input: CreateTask, actor: RequestActor): Promise<Task>;
    list(filters: TaskListFilters): Promise<Task[]>;
    /** Grouped counts for the "workload by assignee" view (spec 14.1) — always computed live, never a static number. */
    workloadByAssignee(): Promise<{
        assigneeId: string;
        assigneeName: string;
        openTaskCount: number;
    }[]>;
    getDetail(taskId: string): Promise<TaskDetail>;
    update(taskId: string, input: UpdateTask): Promise<Task>;
    transition(taskId: string, toStatus: TaskStatusKey, note: string | undefined, actor: RequestActor): Promise<void>;
    /** The validated backend behind the Gantt/calendar's drag-to-reschedule (spec 14.3/15). */
    reschedule(taskId: string, input: RescheduleTask, actor: RequestActor): Promise<Task>;
    addDependency(taskId: string, dependsOnTaskId: string): Promise<void>;
    removeDependency(dependencyId: string): Promise<void>;
    addComment(taskId: string, input: AddTaskComment, actor: RequestActor): Promise<TaskCommentDto>;
    addChecklistItem(taskId: string, label: string): Promise<TaskChecklistItem[]>;
    toggleChecklistItem(taskId: string, itemId: string, done: boolean): Promise<TaskChecklistItem[]>;
}
//# sourceMappingURL=tasks.service.d.ts.map