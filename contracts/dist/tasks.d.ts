import { z } from "zod";
export declare const taskStatusSchema: z.ZodEnum<{
    IN_PROGRESS: "IN_PROGRESS";
    CANCELLED: "CANCELLED";
    BACKLOG: "BACKLOG";
    READY: "READY";
    BLOCKED: "BLOCKED";
    REVIEW: "REVIEW";
    DONE: "DONE";
}>;
export type TaskStatusKey = z.infer<typeof taskStatusSchema>;
export declare const taskPrioritySchema: z.ZodEnum<{
    LOW: "LOW";
    MEDIUM: "MEDIUM";
    HIGH: "HIGH";
    URGENT: "URGENT";
}>;
export type TaskPriorityKey = z.infer<typeof taskPrioritySchema>;
export declare const taskChecklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    done: z.ZodBoolean;
    doneAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type TaskChecklistItem = z.infer<typeof taskChecklistItemSchema>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    assigneeId: z.ZodOptional<z.ZodString>;
    watcherIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    channelId: z.ZodOptional<z.ZodString>;
    linkedEntityType: z.ZodOptional<z.ZodString>;
    linkedEntityId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodISODateTime>;
    dueDate: z.ZodOptional<z.ZodISODateTime>;
    estimateMinutes: z.ZodOptional<z.ZodNumber>;
    reminderAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    watcherIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    estimateMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reminderAt: z.ZodOptional<z.ZodNullable<z.ZodISODateTime>>;
}, z.core.$strip>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export declare const rescheduleTaskSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodNullable<z.ZodISODateTime>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodISODateTime>>;
}, z.core.$strip>;
export type RescheduleTask = z.infer<typeof rescheduleTaskSchema>;
export declare const transitionTaskSchema: z.ZodObject<{
    toStatus: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TransitionTask = z.infer<typeof transitionTaskSchema>;
export declare const addTaskDependencySchema: z.ZodObject<{
    dependsOnTaskId: z.ZodString;
}, z.core.$strip>;
export type AddTaskDependency = z.infer<typeof addTaskDependencySchema>;
export declare const addTaskCommentSchema: z.ZodObject<{
    body: z.ZodString;
}, z.core.$strip>;
export type AddTaskComment = z.infer<typeof addTaskCommentSchema>;
export declare const addChecklistItemSchema: z.ZodObject<{
    label: z.ZodString;
}, z.core.$strip>;
export type AddChecklistItem = z.infer<typeof addChecklistItemSchema>;
export declare const toggleChecklistItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    done: z.ZodBoolean;
}, z.core.$strip>;
export type ToggleChecklistItem = z.infer<typeof toggleChecklistItemSchema>;
export declare const taskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    assigneeId: z.ZodNullable<z.ZodString>;
    assigneeName: z.ZodNullable<z.ZodString>;
    createdById: z.ZodString;
    watcherIds: z.ZodArray<z.ZodString>;
    channelId: z.ZodNullable<z.ZodString>;
    channelTitle: z.ZodNullable<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    startDate: z.ZodNullable<z.ZodISODateTime>;
    dueDate: z.ZodNullable<z.ZodISODateTime>;
    estimateMinutes: z.ZodNullable<z.ZodNumber>;
    reminderAt: z.ZodNullable<z.ZodISODateTime>;
    checklistItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        done: z.ZodBoolean;
        doneAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Task = z.infer<typeof taskSchema>;
export declare const taskCommentSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    authorName: z.ZodString;
    body: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TaskCommentDto = z.infer<typeof taskCommentSchema>;
export declare const taskDependencySchema: z.ZodObject<{
    id: z.ZodString;
    dependsOnTaskId: z.ZodString;
    dependsOnTaskTitle: z.ZodString;
    dependsOnTaskStatus: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>;
    dependsOnTaskDueDate: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type TaskDependencyDto = z.infer<typeof taskDependencySchema>;
export declare const taskStatusEventSchema: z.ZodObject<{
    id: z.ZodString;
    fromStatus: z.ZodNullable<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>>;
    toStatus: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TaskStatusEventDto = z.infer<typeof taskStatusEventSchema>;
export declare const taskDetailSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
        BACKLOG: "BACKLOG";
        READY: "READY";
        BLOCKED: "BLOCKED";
        REVIEW: "REVIEW";
        DONE: "DONE";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    assigneeId: z.ZodNullable<z.ZodString>;
    assigneeName: z.ZodNullable<z.ZodString>;
    createdById: z.ZodString;
    watcherIds: z.ZodArray<z.ZodString>;
    channelId: z.ZodNullable<z.ZodString>;
    channelTitle: z.ZodNullable<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    startDate: z.ZodNullable<z.ZodISODateTime>;
    dueDate: z.ZodNullable<z.ZodISODateTime>;
    estimateMinutes: z.ZodNullable<z.ZodNumber>;
    reminderAt: z.ZodNullable<z.ZodISODateTime>;
    checklistItems: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        done: z.ZodBoolean;
        doneAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    comments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        authorId: z.ZodString;
        authorName: z.ZodString;
        body: z.ZodString;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    dependencies: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        dependsOnTaskId: z.ZodString;
        dependsOnTaskTitle: z.ZodString;
        dependsOnTaskStatus: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            CANCELLED: "CANCELLED";
            BACKLOG: "BACKLOG";
            READY: "READY";
            BLOCKED: "BLOCKED";
            REVIEW: "REVIEW";
            DONE: "DONE";
        }>;
        dependsOnTaskDueDate: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
    statusEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromStatus: z.ZodNullable<z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            CANCELLED: "CANCELLED";
            BACKLOG: "BACKLOG";
            READY: "READY";
            BLOCKED: "BLOCKED";
            REVIEW: "REVIEW";
            DONE: "DONE";
        }>>;
        toStatus: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            CANCELLED: "CANCELLED";
            BACKLOG: "BACKLOG";
            READY: "READY";
            BLOCKED: "BLOCKED";
            REVIEW: "REVIEW";
            DONE: "DONE";
        }>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TaskDetail = z.infer<typeof taskDetailSchema>;
//# sourceMappingURL=tasks.d.ts.map