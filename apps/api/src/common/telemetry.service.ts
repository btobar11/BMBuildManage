import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor() {}

  logInfo(message: string, context?: Record<string, unknown>) {
    const logEntry = {
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    this.logger.log(message, JSON.stringify(context));
    this.persistLog(logEntry);
  }

  logWarning(message: string, context?: Record<string, unknown>) {
    const logEntry = {
      level: 'warning',
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    this.logger.warn(message, JSON.stringify(context));
    this.persistLog(logEntry);
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

    const logEntry = {
      level: 'error',
      message,
      context: { ...context, ...errorDetails },
      timestamp: new Date().toISOString(),
    };
    this.logger.error(message, JSON.stringify({ ...context, ...errorDetails }));
    this.persistLog(logEntry);
  }

  logConstraintViolation(
    tableName: string,
    constraintName: string,
    attemptedValue: Record<string, unknown>,
    userId?: string,
  ) {
    const logEntry = {
      level: 'error',
      message: `Constraint violation: ${constraintName} on ${tableName}`,
      context: {
        constraintName,
        tableName,
        attemptedValue,
        userId,
        errorCode: '23514',
        suggestion:
          'Verificar que los valores sean válidos antes de enviar a la API',
      },
      timestamp: new Date().toISOString(),
    };
    this.logger.error(
      `CONSTRAINT_VIOLATION: ${constraintName} on ${tableName}`,
      JSON.stringify(logEntry.context),
    );
    this.persistLog(logEntry);
  }

  private persistLog(entry: Record<string, unknown>) {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      // Keep last 100 logs in localStorage
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch {
      // Silent fail - localStorage might not be available
    }
  }

  getLogs(): Record<string, unknown>[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearLogs() {
    localStorage.removeItem('app_logs');
  }
}
