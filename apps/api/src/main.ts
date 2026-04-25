import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';
import { appCorsConfig, validationPipeConfig } from './config';
import express from 'express';
import helmet from 'helmet';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
  integrations: [Sentry.httpIntegration()],
});

const server = express();

server.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'https://sfzkrnfyfwonxyceugya.supabase.co',
          'https://api.groq.com',
        ],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

let cachedServer: any;

export const createApp = async (expressInstance: any) => {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressInstance),
    );

    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    app.enableCors(appCorsConfig);
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.setGlobalPrefix('api/v1');

    const config = new DocumentBuilder()
      .setTitle('BMBuildManage API')
      .setDescription(
        'SaaS B2B para gestión integral de construcción — Presupuestos, BIM, Logística, Compliance',
      )
      .setVersion('2.0')
      .addBearerAuth()
      .addTag('analytics', 'KPIs financieros, avance físico y flujo de caja')
      .addTag('projects', 'CRUD de proyectos de construcción')
      .addTag('budgets', 'Presupuestos y análisis de precios unitarios')
      .addTag('invoices', 'Facturación electrónica y DTE')
      .addTag('purchase-orders', 'Órdenes de compra y 3-way match')
      .addTag('subcontractors', 'Gestión de subcontratistas y compliance F30-1')
      .addTag('workers', 'Nómina de trabajadores y asignaciones')
      .addTag('rfis', 'Solicitudes de información (SDI)')
      .addTag('submittals', 'Entregables técnicos')
      .addTag('punch-list', 'Lista de reparos')
      .addTag('bim-models', 'Modelos BIM e interferencias')
      .addTag('execution', 'Avance de ejecución y cubicaciones')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    cachedServer = app;
  }
  return cachedServer;
};

export default async (req: any, res: any) => {
  await createApp(server);
  server(req, res);
};

if (process.env.NODE_ENV !== 'production') {
  const bootstrap = async () => {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    app.enableCors(appCorsConfig);
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.setGlobalPrefix('api/v1');

    const config = new DocumentBuilder()
      .setTitle('BMBuildManage API')
      .setDescription('SaaS B2B para gestión de construcción')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.debug(`Local API running on http://localhost:${port}/api/v1`);
    logger.debug(`Swagger UI available at http://localhost:${port}/api`);
  };
  bootstrap();
}
