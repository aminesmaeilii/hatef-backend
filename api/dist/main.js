"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/http-exception.filter");
const correlation_id_middleware_1 = require("./common/correlation-id.middleware");
const app_config_service_1 = require("./config/app-config.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const config = app.get(app_config_service_1.AppConfigService);
    const env = config.env;
    // Behind a TLS-terminating reverse proxy/load balancer in every real
    // deployment (see docs/DEPLOYMENT.md) — without this, req.ip/req.secure
    // read the proxy's own connection instead of the real client's, which
    // breaks IP-based rate limiting, audit-log IPs, and secure-cookie checks.
    app.set("trust proxy", 1);
    app.use((0, helmet_1.default)({
        // This API is a pure JSON service — it never renders HTML except
        // Nest's default error page — so a strict, near-empty CSP is safe in
        // every environment (no inline scripts/styles to allow for).
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'none'"],
            },
        },
        hsts: env.NODE_ENV === "production" ? { maxAge: 63_072_000, includeSubDomains: true, preload: true } : false,
    }));
    app.use((0, cookie_parser_1.default)());
    // JSON report/reference-data responses in this API can run into the
    // hundreds of KB (report result tables, form definitions) — gzip on the
    // wire costs one CPU-bound middleware call and meaningfully cuts payload
    // size for both web apps and any future mobile client on a slow network.
    app.use((0, compression_1.default)());
    app.use((0, correlation_id_middleware_1.correlationIdMiddleware)());
    app.enableCors({
        origin: [env.ADMIN_WEB_URL, env.PARTNER_WEB_URL],
        credentials: true,
        exposedHeaders: [correlation_id_middleware_1.CORRELATION_ID_HEADER],
    });
    app.setGlobalPrefix("api/v1", {
        exclude: [
            { path: "health", method: common_1.RequestMethod.GET },
            { path: "health/ready", method: common_1.RequestMethod.GET },
        ],
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    await app.listen(env.API_PORT);
    console.log(`[api] listening on http://localhost:${env.API_PORT}`);
}
void bootstrap();
