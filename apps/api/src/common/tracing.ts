import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const serviceName = process.env.SERVICE_NAME || 'bm-build-manage-api';

export const tracingSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  }),
  spanProcessor: new BatchSpanProcessor(
    new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    }),
  ),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
  ],
});

export function startTracing() {
  try {
    tracingSDK.start();
    console.log('OpenTelemetry started');
  } catch (error) {
    console.error('Failed to start OpenTelemetry:', error);
  }
}

export function stopTracing() {
  tracingSDK.shutdown().catch(console.error);
}

export function addSpanAttribute(key: string, value: string): void {
  // Placeholder for span context manipulation
  // In practice, use @opentelemetry/api's active span
}

export function recordException(error: Error): void {
  console.error('[Span] Exception recorded:', error.message);
}