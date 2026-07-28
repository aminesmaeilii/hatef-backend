"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const GENERIC_MESSAGE = "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.";
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const body = {
            code: explicitCodeFor(exception, status) ?? errorCodeForStatus(status),
            message: safeMessageFor(exception, status),
            correlationId: request.correlationId,
            fieldErrors: fieldErrorsFor(exception, status),
        };
        if (status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
        }
        response.status(status).json(body);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
function safeMessageFor(exception, status) {
    if (exception instanceof common_1.HttpException && status < common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
        const payload = exception.getResponse();
        if (typeof payload === "string")
            return payload;
        if (typeof payload === "object" && payload !== null && "message" in payload) {
            const message = payload.message;
            if (typeof message === "string")
                return message;
            if (Array.isArray(message))
                return message.join("، ");
        }
    }
    return GENERIC_MESSAGE;
}
/** Lets a guard/service opt into a specific machine-readable code (e.g. STEP_UP_REQUIRED) instead of the generic per-status one, by throwing `new ForbiddenException({ code, message })`. */
function explicitCodeFor(exception, status) {
    if (!(exception instanceof common_1.HttpException) || status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR)
        return undefined;
    const payload = exception.getResponse();
    if (typeof payload !== "object" || payload === null || !("code" in payload))
        return undefined;
    const code = payload.code;
    return typeof code === "string" ? code : undefined;
}
function fieldErrorsFor(exception, status) {
    if (!(exception instanceof common_1.HttpException) || status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR)
        return undefined;
    const payload = exception.getResponse();
    if (typeof payload !== "object" || payload === null || !("fieldErrors" in payload))
        return undefined;
    const fieldErrors = payload.fieldErrors;
    return Array.isArray(fieldErrors) ? fieldErrors : undefined;
}
function errorCodeForStatus(status) {
    switch (status) {
        case common_1.HttpStatus.BAD_REQUEST:
            return "BAD_REQUEST";
        case common_1.HttpStatus.UNAUTHORIZED:
            return "UNAUTHORIZED";
        case common_1.HttpStatus.FORBIDDEN:
            return "FORBIDDEN";
        case common_1.HttpStatus.NOT_FOUND:
            return "NOT_FOUND";
        case common_1.HttpStatus.CONFLICT:
            return "CONFLICT";
        case common_1.HttpStatus.TOO_MANY_REQUESTS:
            return "TOO_MANY_REQUESTS";
        default:
            return "INTERNAL_ERROR";
    }
}
