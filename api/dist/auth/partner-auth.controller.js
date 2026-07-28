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
exports.PartnerAuthController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const otp_service_1 = require("./otp.service");
const session_service_1 = require("../session/session.service");
let PartnerAuthController = class PartnerAuthController {
    otp;
    sessions;
    constructor(otp, sessions) {
        this.otp = otp;
        this.sessions = sessions;
    }
    async requestOtp(body, req) {
        return this.otp.requestOtp(body.mobile, req.ip);
    }
    async verifyOtp(body, req, res) {
        const { userId } = await this.otp.verifyOtp(body.mobile, body.code, req.ip);
        return this.sessions.issueSession(userId, req, res);
    }
};
exports.PartnerAuthController = PartnerAuthController;
__decorate([
    (0, common_1.Post)("otp/request"),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.otpRequestSchema))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PartnerAuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)("otp/verify"),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.otpVerifySchema))),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PartnerAuthController.prototype, "verifyOtp", null);
exports.PartnerAuthController = PartnerAuthController = __decorate([
    (0, common_1.Controller)("auth/partner"),
    __metadata("design:paramtypes", [otp_service_1.OtpService,
        session_service_1.SessionService])
], PartnerAuthController);
