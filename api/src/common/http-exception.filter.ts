import type { Request, Response } from "express";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiError } from "@hatef/contracts";

const GENERIC_MESSAGE = "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiError = {
      code: explicitCodeFor(exception, status) ?? errorCodeForStatus(status),
      message: safeMessageFor(exception, status),
      correlationId: request.correlationId,
      fieldErrors: fieldErrorsFor(exception, status),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}

function safeMessageFor(exception: unknown, status: number): string {
  if (exception instanceof HttpException && status < HttpStatus.INTERNAL_SERVER_ERROR) {
    const payload = exception.getResponse();
    if (typeof payload === "string") return payload;
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join("، ");
    }
  }
  return GENERIC_MESSAGE;
}

/** Lets a guard/service opt into a specific machine-readable code (e.g. STEP_UP_REQUIRED) instead of the generic per-status one, by throwing `new ForbiddenException({ code, message })`. */
function explicitCodeFor(exception: unknown, status: number): string | undefined {
  if (!(exception instanceof HttpException) || status >= HttpStatus.INTERNAL_SERVER_ERROR) return undefined;
  const payload = exception.getResponse();
  if (typeof payload !== "object" || payload === null || !("code" in payload)) return undefined;
  const code = (payload as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function fieldErrorsFor(exception: unknown, status: number): ApiError["fieldErrors"] {
  if (!(exception instanceof HttpException) || status >= HttpStatus.INTERNAL_SERVER_ERROR) return undefined;

  const payload = exception.getResponse();
  if (typeof payload !== "object" || payload === null || !("fieldErrors" in payload)) return undefined;

  const fieldErrors = (payload as { fieldErrors: unknown }).fieldErrors;
  return Array.isArray(fieldErrors) ? (fieldErrors as ApiError["fieldErrors"]) : undefined;
}

function errorCodeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "BAD_REQUEST";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_ERROR";
  }
}
