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
exports.ChannelLedgerController = exports.LedgerController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const ledger_service_1 = require("./ledger.service");
const financial_approval_service_1 = require("./financial-approval.service");
/** Admin/internal ledger read + manual adjustment/reversal. Partner-facing statement lives on the channel-scoped controller below. */
let LedgerController = class LedgerController {
    ledger;
    financialApprovals;
    constructor(ledger, financialApprovals) {
        this.ledger = ledger;
        this.financialApprovals = financialApprovals;
    }
    async adjust(body, actor) {
        return this.financialApprovals.requestAdjustment(body, actor);
    }
    async reverse(transactionId, body, actor) {
        return this.ledger.reverse(transactionId, body.reason, actor.userId);
    }
    async listApprovals(status) {
        return this.financialApprovals.listApprovals(status);
    }
    async decideApproval(requestId, body, actor) {
        return this.financialApprovals.decide(requestId, body, actor);
    }
};
exports.LedgerController = LedgerController;
__decorate([
    (0, common_1.Post)("adjustments"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.LEDGER_ADJUST),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.postAdjustmentSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "adjust", null);
__decorate([
    (0, common_1.Post)("transactions/:transactionId/reverse"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.LEDGER_ADJUST),
    __param(0, (0, common_1.Param)("transactionId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reverseTransactionSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "reverse", null);
__decorate([
    (0, common_1.Get)("approvals"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FINANCIAL_APPROVAL_DECIDE),
    __param(0, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "listApprovals", null);
__decorate([
    (0, common_1.Post)("approvals/:requestId/decide"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FINANCIAL_APPROVAL_DECIDE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.decideFinancialApprovalSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "decideApproval", null);
exports.LedgerController = LedgerController = __decorate([
    (0, common_1.Controller)("ledger"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService,
        financial_approval_service_1.FinancialApprovalService])
], LedgerController);
/** Partner- and admin-shared read of one channel's statement (spec 16.5 "understandable statement"). */
let ChannelLedgerController = class ChannelLedgerController {
    ledger;
    constructor(ledger) {
        this.ledger = ledger;
    }
    async statement(channelId) {
        return this.ledger.getChannelStatement(channelId);
    }
};
exports.ChannelLedgerController = ChannelLedgerController;
__decorate([
    (0, common_1.Get)("statement"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.LEDGER_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelLedgerController.prototype, "statement", null);
exports.ChannelLedgerController = ChannelLedgerController = __decorate([
    (0, common_1.Controller)("channels/:channelId/ledger"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService])
], ChannelLedgerController);
