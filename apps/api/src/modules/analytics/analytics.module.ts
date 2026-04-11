import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsExportService],
  exports: [AnalyticsService, AnalyticsExportService],
})
export class AnalyticsModule {}
