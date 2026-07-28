"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../app.module");
const http_exception_filter_1 = require("../common/http-exception.filter");
const correlation_id_middleware_1 = require("../common/correlation-id.middleware");
/** Boots a real Nest application (same bootstrap shape as main.ts) against the live local Postgres/Redis for integration tests. */
async function createTestApp() {
    const moduleRef = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.use((0, cookie_parser_1.default)());
    app.use((0, correlation_id_middleware_1.correlationIdMiddleware)());
    app.setGlobalPrefix("api/v1", {
        exclude: [
            { path: "health", method: common_1.RequestMethod.GET },
            { path: "health/ready", method: common_1.RequestMethod.GET },
        ],
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    await app.init();
    return app;
}
