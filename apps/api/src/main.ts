import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';
import { appCorsConfig, validationPipeConfig } from './config';
import express from 'express';

const server = express();

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
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    app.enableCors(appCorsConfig);
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.setGlobalPrefix('api/v1');
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Local API running on http://localhost:${port}/api/v1`);
  };
  bootstrap();
}
