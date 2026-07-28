import "reflect-metadata";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { CORRELATION_ID_HEADER, correlationIdMiddleware } from "./common/correlation-id.middleware";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);
  const env = config.env;

  // Behind a TLS-terminating reverse proxy/load balancer in every real
  // deployment (see docs/DEPLOYMENT.md) — without this, req.ip/req.secure
  // read the proxy's own connection instead of the real client's, which
  // breaks IP-based rate limiting, audit-log IPs, and secure-cookie checks.
  app.set("trust proxy", 1);

  app.use(
    helmet({
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
    }),
  );
  app.use(cookieParser());
  // JSON report/reference-data responses in this API can run into the
  // hundreds of KB (report result tables, form definitions) — gzip on the
  // wire costs one CPU-bound middleware call and meaningfully cuts payload
  // size for both web apps and any future mobile client on a slow network.
  app.use(compression());
  app.use(correlationIdMiddleware());
  app.enableCors({
    origin: [env.ADMIN_WEB_URL, env.PARTNER_WEB_URL],
    credentials: true,
    exposedHeaders: [CORRELATION_ID_HEADER],
  });
  app.setGlobalPrefix("api/v1", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
    ],
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(env.API_PORT);
  console.log(`[api] listening on http://localhost:${env.API_PORT}`);
}

void bootstrap();
