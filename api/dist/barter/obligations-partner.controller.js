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
exports.RateCardOpsController = exports.RateCardPartnerController = exports.ObligationsPartnerController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const obligations_service_1 = require("./obligations.service");
const rate_cards_service_1 = require("./rate-cards.service");
const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" };
/** Partner-facing — same channel-nested ABAC shape as SupportRequestsController. */
let ObligationsPartnerController = class ObligationsPartnerController {
    obligations;
    constructor(obligations) {
        this.obligations = obligations;
    }
    async list(channelId) {
        return this.obligations.list({ channelId });
    }
    async getOne(obligationId) {
        return this.obligations.getDetail(obligationId);
    }
    async respond(obligationId, body, actor) {
        return this.obligations.respondToProposal(obligationId, body, actor);
    }
    async submitDeliverable(obligationId, body, actor) {
        return this.obligations.submitDeliverable(obligationId, body, actor);
    }
    async listDeliverables(obligationId) {
        return this.obligations.listDeliverables(obligationId);
    }
};
exports.ObligationsPartnerController = ObligationsPartnerController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ObligationsPartnerController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":obligationId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("obligationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ObligationsPartnerController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":obligationId/respond"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_NEGOTIATE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("obligationId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.respondToObligationProposalSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsPartnerController.prototype, "respond", null);
__decorate([
    (0, common_1.Post)(":obligationId/deliverables"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.DELIVERABLE_SUBMIT, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("obligationId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.submitDeliverableSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsPartnerController.prototype, "submitDeliverable", null);
__decorate([
    (0, common_1.Get)(":obligationId/deliverables"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("obligationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ObligationsPartnerController.prototype, "listDeliverables", null);
exports.ObligationsPartnerController = ObligationsPartnerController = __decorate([
    (0, common_1.Controller)("channels/:channelId/obligations"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [obligations_service_1.ObligationsService])
], ObligationsPartnerController);
let RateCardPartnerController = class RateCardPartnerController {
    rateCards;
    constructor(rateCards) {
        this.rateCards = rateCards;
    }
    async getCurrent(channelId) {
        return this.rateCards.getCurrent(channelId);
    }
    async addItem(channelId, body, actor) {
        return this.rateCards.addItem(channelId, body, actor);
    }
    async submit(channelId, actor) {
        return this.rateCards.submit(channelId, actor);
    }
};
exports.RateCardPartnerController = RateCardPartnerController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.RATE_CARD_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RateCardPartnerController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Post)("items"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.RATE_CARD_MANAGE_OWN, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createRateCardItemSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RateCardPartnerController.prototype, "addItem", null);
__decorate([
    (0, common_1.Post)("submit"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.RATE_CARD_MANAGE_OWN, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RateCardPartnerController.prototype, "submit", null);
exports.RateCardPartnerController = RateCardPartnerController = __decorate([
    (0, common_1.Controller)("channels/:channelId/rate-card"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [rate_cards_service_1.RateCardsService])
], RateCardPartnerController);
let RateCardOpsController = class RateCardOpsController {
    rateCards;
    constructor(rateCards) {
        this.rateCards = rateCards;
    }
    async listSubmitted() {
        return this.rateCards.listSubmitted();
    }
    async reviewItem(itemId, body, actor) {
        await this.rateCards.reviewItem(itemId, body, actor);
        return { ok: true };
    }
};
exports.RateCardOpsController = RateCardOpsController;
__decorate([
    (0, common_1.Get)("submitted"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.RATE_CARD_REVIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RateCardOpsController.prototype, "listSubmitted", null);
__decorate([
    (0, common_1.Post)("items/:itemId/review"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.RATE_CARD_REVIEW),
    __param(0, (0, common_1.Param)("itemId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reviewRateCardItemSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RateCardOpsController.prototype, "reviewItem", null);
exports.RateCardOpsController = RateCardOpsController = __decorate([
    (0, common_1.Controller)("rate-cards"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [rate_cards_service_1.RateCardsService])
], RateCardOpsController);
