import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  logInfo(message: string, context?: Record<string, unknown>) {
    this.logger.log(message, JSON.stringify(context));
  }

  logWarning(message: string, context?: Record<string, unknown>) {
    this.logger.warn(message, JSON.stringify(context));
  }

  logError(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
  ) {
    const errorDetails =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { error: String(error) };

    this.logger.error(message, JSON.stringify({ ...context, ...errorDetails }));
  }

  logConstraintViolation(
    tableName: string,
    constraintName: string,
    attemptedValue: Record<string, unknown>,
    userId?: string,
  ) {
    this.logger.error(
      `CONSTRAINT_VIOLATION: ${constraintName} on ${tableName}`,
      JSON.stringify({
        constraintName,
        tableName,
        attemptedValue,
        userId,
        errorCode: '23514',
        suggestion:
          'Verificar que los valores sean válidos antes de enviar a la API',
      }),
    );
  }
}
