/**
 * OpenTelemetry Configuration
 * 
 * Tracing configuración para la API.
 * Requiere Jaeger o compatible endpoint.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const serviceName = process.env.SERVICE_NAME || 'bm-build-manage-api';
const jaegerEndpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';

let tracingSDK: NodeSDK | null = null;

export function startTracing() {
  if (tracingSDK) return;

  try {
    const exporter = new JaegerExporter({ endpoint: jaegerEndpoint });
    
    tracingSDK = new NodeSDK({
      serviceName,
      traceExporter: exporter,
      spanProcessor: new BatchSpanProcessor(exporter),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new NestInstrumentation(),
        new PgInstrumentation(),
      ],
    });

    tracingSDK.start();
    console.log('OpenTelemetry started');
  } catch (error) {
    console.error('Failed to start OpenTelemetry:', error);
  }
}

export function stopTracing() {
  tracingSDK?.shutdown().catch(console.error);
  tracingSDK = null;
}

export function addSpanAttribute(_key: string, _value: string): void {
  // Placeholder for span context manipulation
}

export function recordException(error: Error): void {
  console.error('[Span] Exception recorded:', error.message);
}