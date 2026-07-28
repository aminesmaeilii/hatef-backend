"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const tasks_service_1 = require("./tasks.service");
let TasksController = class TasksController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    async create(body, actor) {
        return this.tasks.create(body, actor);
    }
    async workload() {
        return this.tasks.workloadByAssignee();
    }
    async list(assigneeId, channelId, status, overdue, linkedEntityType, linkedEntityId) {
        const parsedStatus = status ? contracts_1.taskStatusSchema.parse(status) : undefined;
        return this.tasks.list({
            assigneeId,
            channelId,
            status: parsedStatus,
            overdue: overdue === "true",
            linkedEntityType,
            linkedEntityId,
        });
    }
    async getOne(taskId) {
        return this.tasks.getDetail(taskId);
    }
    async update(taskId, body) {
        return this.tasks.update(taskId, body);
    }
    async transition(taskId, body, actor) {
        await this.tasks.transition(taskId, body.toStatus, body.note, actor);
        return { ok: true };
    }
    async reschedule(taskId, body, actor) {
        return this.tasks.reschedule(taskId, body, actor);
    }
    async addDependency(taskId, body) {
        await this.tasks.addDependency(taskId, body.dependsOnTaskId);
        return { ok: true };
    }
    async removeDependency(dependencyId) {
        await this.tasks.removeDependency(dependencyId);
        return { ok: true };
    }
    async addComment(taskId, body, actor) {
        return this.tasks.addComment(taskId, body, actor);
    }
    async addChecklistItem(taskId, body) {
        return this.tasks.addChecklistItem(taskId, body.label);
    }
    async toggleChecklistItem(taskId, itemId, body) {
        return this.tasks.toggleChecklistItem(taskId, itemId, body.done);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createTaskSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("workload"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "workload", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_READ),
    __param(0, (0, common_1.Query)("assigneeId")),
    __param(1, (0, common_1.Query)("channelId")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("overdue")),
    __param(4, (0, common_1.Query)("linkedEntityType")),
    __param(5, (0, common_1.Query)("linkedEntityId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":taskId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_READ),
    __param(0, (0, common_1.Param)("taskId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":taskId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updateTaskSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":taskId/transition"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.transitionTaskSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "transition", null);
__decorate([
    (0, common_1.Post)(":taskId/reschedule"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.rescheduleTaskSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Post)(":taskId/dependencies"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addTaskDependencySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addDependency", null);
__decorate([
    (0, common_1.Delete)("dependencies/:dependencyId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("dependencyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "removeDependency", null);
__decorate([
    (0, common_1.Post)(":taskId/comments"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addTaskCommentSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(":taskId/checklist"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addChecklistItemSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addChecklistItem", null);
__decorate([
    (0, common_1.Patch)(":taskId/checklist/:itemId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TASK_MANAGE),
    __param(0, (0, common_1.Param)("taskId")),
    __param(1, (0, common_1.Param)("itemId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.toggleChecklistItemSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleChecklistItem", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)("tasks"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
