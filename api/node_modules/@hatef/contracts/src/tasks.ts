import { z } from "zod";

export const taskStatusSchema = z.enum(["BACKLOG", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"]);
export type TaskStatusKey = z.infer<typeof taskStatusSchema>;

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriorityKey = z.infer<typeof taskPrioritySchema>;

export const taskChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
  doneAt: z.iso.datetime().nullable(),
});
export type TaskChecklistItem = z.infer<typeof taskChecklistItemSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: taskPrioritySchema.default("MEDIUM"),
  assigneeId: z.string().optional(),
  watcherIds: z.array(z.string()).default([]),
  channelId: z.string().optional(),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  dueDate: z.iso.datetime().optional(),
  estimateMinutes: z.number().int().positive().optional(),
  reminderAt: z.iso.datetime().optional(),
});
export type CreateTask = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().nullable().optional(),
  watcherIds: z.array(z.string()).optional(),
  estimateMinutes: z.number().int().positive().nullable().optional(),
  reminderAt: z.iso.datetime().nullable().optional(),
});
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export const rescheduleTaskSchema = z.object({
  startDate: z.iso.datetime().nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
});
export type RescheduleTask = z.infer<typeof rescheduleTaskSchema>;

export const transitionTaskSchema = z.object({
  toStatus: taskStatusSchema,
  note: z.string().optional(),
});
export type TransitionTask = z.infer<typeof transitionTaskSchema>;

export const addTaskDependencySchema = z.object({ dependsOnTaskId: z.string() });
export type AddTaskDependency = z.infer<typeof addTaskDependencySchema>;

export const addTaskCommentSchema = z.object({ body: z.string().min(1) });
export type AddTaskComment = z.infer<typeof addTaskCommentSchema>;

export const addChecklistItemSchema = z.object({ label: z.string().min(1) });
export type AddChecklistItem = z.infer<typeof addChecklistItemSchema>;

export const toggleChecklistItemSchema = z.object({ itemId: z.string(), done: z.boolean() });
export type ToggleChecklistItem = z.infer<typeof toggleChecklistItemSchema>;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string().nullable(),
  assigneeName: z.string().nullable(),
  createdById: z.string(),
  watcherIds: z.array(z.string()),
  channelId: z.string().nullable(),
  channelTitle: z.string().nullable(),
  linkedEntityType: z.string().nullable(),
  linkedEntityId: z.string().nullable(),
  startDate: z.iso.datetime().nullable(),
  dueDate: z.iso.datetime().nullable(),
  estimateMinutes: z.number().int().nullable(),
  reminderAt: z.iso.datetime().nullable(),
  checklistItems: z.array(taskChecklistItemSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const taskCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type TaskCommentDto = z.infer<typeof taskCommentSchema>;

export const taskDependencySchema = z.object({
  id: z.string(),
  dependsOnTaskId: z.string(),
  dependsOnTaskTitle: z.string(),
  dependsOnTaskStatus: taskStatusSchema,
  dependsOnTaskDueDate: z.iso.datetime().nullable(),
});
export type TaskDependencyDto = z.infer<typeof taskDependencySchema>;

export const taskStatusEventSchema = z.object({
  id: z.string(),
  fromStatus: taskStatusSchema.nullable(),
  toStatus: taskStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type TaskStatusEventDto = z.infer<typeof taskStatusEventSchema>;

export const taskDetailSchema = taskSchema.extend({
  comments: z.array(taskCommentSchema),
  dependencies: z.array(taskDependencySchema),
  statusEvents: z.array(taskStatusEventSchema),
});
export type TaskDetail = z.infer<typeof taskDetailSchema>;
