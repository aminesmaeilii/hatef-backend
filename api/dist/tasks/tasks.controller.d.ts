import { type AddChecklistItem, type AddTaskComment, type AddTaskDependency, type CreateTask, type RescheduleTask, type ToggleChecklistItem, type TransitionTask, type UpdateTask } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { TasksService } from "./tasks.service";
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    create(body: CreateTask, actor: RequestActor): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assigneeId: string | null;
        assigneeName: string | null;
        createdById: string;
        watcherIds: string[];
        channelId: string | null;
        channelTitle: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        startDate: string | null;
        dueDate: string | null;
        estimateMinutes: number | null;
        reminderAt: string | null;
        checklistItems: {
            id: string;
            label: string;
            done: boolean;
            doneAt: string | null;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    workload(): Promise<{
        assigneeId: string;
        assigneeName: string;
        openTaskCount: number;
    }[]>;
    list(assigneeId?: string, channelId?: string, status?: string, overdue?: string, linkedEntityType?: string, linkedEntityId?: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assigneeId: string | null;
        assigneeName: string | null;
        createdById: string;
        watcherIds: string[];
        channelId: string | null;
        channelTitle: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        startDate: string | null;
        dueDate: string | null;
        estimateMinutes: number | null;
        reminderAt: string | null;
        checklistItems: {
            id: string;
            label: string;
            done: boolean;
            doneAt: string | null;
        }[];
        createdAt: string;
        updatedAt: string;
    }[]>;
    getOne(taskId: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assigneeId: string | null;
        assigneeName: string | null;
        createdById: string;
        watcherIds: string[];
        channelId: string | null;
        channelTitle: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        startDate: string | null;
        dueDate: string | null;
        estimateMinutes: number | null;
        reminderAt: string | null;
        checklistItems: {
            id: string;
            label: string;
            done: boolean;
            doneAt: string | null;
        }[];
        createdAt: string;
        updatedAt: string;
        comments: {
            id: string;
            authorId: string;
            authorName: string;
            body: string;
            createdAt: string;
        }[];
        dependencies: {
            id: string;
            dependsOnTaskId: string;
            dependsOnTaskTitle: string;
            dependsOnTaskStatus: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
            dependsOnTaskDueDate: string | null;
        }[];
        statusEvents: {
            id: string;
            fromStatus: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE" | null;
            toStatus: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
            note: string | null;
            createdAt: string;
        }[];
    }>;
    update(taskId: string, body: UpdateTask): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assigneeId: string | null;
        assigneeName: string | null;
        createdById: string;
        watcherIds: string[];
        channelId: string | null;
        channelTitle: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        startDate: string | null;
        dueDate: string | null;
        estimateMinutes: number | null;
        reminderAt: string | null;
        checklistItems: {
            id: string;
            label: string;
            done: boolean;
            doneAt: string | null;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    transition(taskId: string, body: TransitionTask, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    reschedule(taskId: string, body: RescheduleTask, actor: RequestActor): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        assigneeId: string | null;
        assigneeName: string | null;
        createdById: string;
        watcherIds: string[];
        channelId: string | null;
        channelTitle: string | null;
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        startDate: string | null;
        dueDate: string | null;
        estimateMinutes: number | null;
        reminderAt: string | null;
        checklistItems: {
            id: string;
            label: string;
            done: boolean;
            doneAt: string | null;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    addDependency(taskId: string, body: AddTaskDependency): Promise<{
        ok: boolean;
    }>;
    removeDependency(dependencyId: string): Promise<{
        ok: boolean;
    }>;
    addComment(taskId: string, body: AddTaskComment, actor: RequestActor): Promise<{
        id: string;
        authorId: string;
        authorName: string;
        body: string;
        createdAt: string;
    }>;
    addChecklistItem(taskId: string, body: AddChecklistItem): Promise<{
        id: string;
        label: string;
        done: boolean;
        doneAt: string | null;
    }[]>;
    toggleChecklistItem(taskId: string, itemId: string, body: ToggleChecklistItem): Promise<{
        id: string;
        label: string;
        done: boolean;
        doneAt: string | null;
    }[]>;
}
//# sourceMappingURL=tasks.controller.d.ts.map