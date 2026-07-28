"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentActor = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentActor = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.actor) {
        throw new Error("CurrentActor used outside a SessionAuthGuard-protected route");
    }
    return req.actor;
});
