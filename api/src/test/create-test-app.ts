import cookieParser from "cookie-parser";
import { RequestMethod, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { HttpExceptionFilter } from "../common/http-exception.filter";
import { correlationIdMiddleware } from "../common/correlation-id.middleware";

/** Boots a real Nest application (same bootstrap shape as main.ts) against the live local Postgres/Redis for integration tests. */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();

  app.use(cookieParser());
  app.use(correlationIdMiddleware());
  app.setGlobalPrefix("api/v1", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
    ],
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}
