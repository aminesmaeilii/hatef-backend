"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskDetailSchema = exports.taskStatusEventSchema = exports.taskDependencySchema = exports.taskCommentSchema = exports.taskSchema = exports.toggleChecklistItemSchema = exports.addChecklistItemSchema = exports.addTaskCommentSchema = exports.addTaskDependencySchema = exports.transitionTaskSchema = exports.rescheduleTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.taskChecklistItemSchema = exports.taskPrioritySchema = exports.taskStatusSchema = void 0;
const zod_1 = require("zod");
exports.taskStatusSchema = zod_1.z.enum(["BACKLOG", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"]);
exports.taskPrioritySchema = zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
exports.taskChecklistItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    done: zod_1.z.boolean(),
    doneAt: zod_1.z.iso.datetime().nullable(),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    priority: exports.taskPrioritySchema.default("MEDIUM"),
    assigneeId: zod_1.z.string().optional(),
    watcherIds: zod_1.z.array(zod_1.z.string()).default([]),
    channelId: zod_1.z.string().optional(),
    linkedEntityType: zod_1.z.string().optional(),
    linkedEntityId: zod_1.z.string().optional(),
    startDate: zod_1.z.iso.datetime().optional(),
    dueDate: zod_1.z.iso.datetime().optional(),
    estimateMinutes: zod_1.z.number().int().positive().optional(),
    reminderAt: zod_1.z.iso.datetime().optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    priority: exports.taskPrioritySchema.optional(),
    assigneeId: zod_1.z.string().nullable().optional(),
    watcherIds: zod_1.z.array(zod_1.z.string()).optional(),
    estimateMinutes: zod_1.z.number().int().positive().nullable().optional(),
    reminderAt: zod_1.z.iso.datetime().nullable().optional(),
});
exports.rescheduleTaskSchema = zod_1.z.object({
    startDate: zod_1.z.iso.datetime().nullable().optional(),
    dueDate: zod_1.z.iso.datetime().nullable().optional(),
});
exports.transitionTaskSchema = zod_1.z.object({
    toStatus: exports.taskStatusSchema,
    note: zod_1.z.string().optional(),
});
exports.addTaskDependencySchema = zod_1.z.object({ dependsOnTaskId: zod_1.z.string() });
exports.addTaskCommentSchema = zod_1.z.object({ body: zod_1.z.string().min(1) });
exports.addChecklistItemSchema = zod_1.z.object({ label: zod_1.z.string().min(1) });
exports.toggleChecklistItemSchema = zod_1.z.object({ itemId: zod_1.z.string(), done: zod_1.z.boolean() });
exports.taskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: exports.taskStatusSchema,
    priority: exports.taskPrioritySchema,
    assigneeId: zod_1.z.string().nullable(),
    assigneeName: zod_1.z.string().nullable(),
    createdById: zod_1.z.string(),
    watcherIds: zod_1.z.array(zod_1.z.string()),
    channelId: zod_1.z.string().nullable(),
    channelTitle: zod_1.z.string().nullable(),
    linkedEntityType: zod_1.z.string().nullable(),
    linkedEntityId: zod_1.z.string().nullable(),
    startDate: zod_1.z.iso.datetime().nullable(),
    dueDate: zod_1.z.iso.datetime().nullable(),
    estimateMinutes: zod_1.z.number().int().nullable(),
    reminderAt: zod_1.z.iso.datetime().nullable(),
    checklistItems: zod_1.z.array(exports.taskChecklistItemSchema),
    createdAt: zod_1.z.iso.datetime(),
    updatedAt: zod_1.z.iso.datetime(),
});
exports.taskCommentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    authorName: zod_1.z.string(),
    body: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.taskDependencySchema = zod_1.z.object({
    id: zod_1.z.string(),
    dependsOnTaskId: zod_1.z.string(),
    dependsOnTaskTitle: zod_1.z.string(),
    dependsOnTaskStatus: exports.taskStatusSchema,
    dependsOnTaskDueDate: zod_1.z.iso.datetime().nullable(),
});
exports.taskStatusEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fromStatus: exports.taskStatusSchema.nullable(),
    toStatus: exports.taskStatusSchema,
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.taskDetailSchema = exports.taskSchema.extend({
    comments: zod_1.z.array(exports.taskCommentSchema),
    dependencies: zod_1.z.array(exports.taskDependencySchema),
    statusEvents: zod_1.z.array(exports.taskStatusEventSchema),
});
