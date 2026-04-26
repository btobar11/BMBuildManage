import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const start = Date.now();
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
