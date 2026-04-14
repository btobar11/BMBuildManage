import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// ─── Typed error response contract ────────────────────────────────────────
// This is the canonical error envelope returned to all clients.
// Frontend should match on `code`, not on `message` strings.
interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  code: string;
  message: string;
  details?: string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const rawResponse = exception.getResponse();

    // Extract structured payload from service (code + message) or fallback
    let code = 'HTTP_EXCEPTION';
    let message = exception.message;
    let details: string[] | undefined;

    if (typeof rawResponse === 'object' && rawResponse !== null) {
      const r = rawResponse as Record<string, unknown>;
      if (typeof r['code'] === 'string') code = r['code'];
      if (typeof r['message'] === 'string') message = r['message'];
      // class-validator validation errors come as array in 'message'
      if (Array.isArray(r['message'])) {
        details = r['message'] as string[];
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
      }
    }

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      code,
      message,
      ...(details ? { details } : {}),
    };

    // Only log server errors (5xx) — 4xx are client errors, not server faults
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} ${code}`,
        exception.stack,
      );
    }

    response.status(status).json(errorResponse);
  }
}
