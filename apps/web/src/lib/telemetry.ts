import * as Sentry from '@sentry/react';

export function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (!import.meta.env.PROD) return;
  Sentry.captureException(error, { extra });
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  extra?: Record<string, unknown>,
) {
  if (!import.meta.env.PROD) return;
  Sentry.captureMessage(message, { level, extra });
}

