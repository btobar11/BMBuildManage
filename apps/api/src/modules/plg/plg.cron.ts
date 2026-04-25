import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivationService } from './activation.service';
import { RetentionService } from './retention.service';
import { PlgAnalyticsService } from './plg-analytics.service';
import { Company } from '../companies/company.entity';

@Injectable()
export class PlgCronService {
  private readonly logger = new Logger(PlgCronService.name);

  constructor(
    private readonly activationService: ActivationService,
    private readonly retentionService: RetentionService,
    private readonly analyticsService: PlgAnalyticsService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  /**
   * Daily cron: Detect churn risk for all companies and take daily metrics snapshot.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyJobs() {
    this.logger.log('Starting daily PLG jobs...');
    try {
      const companies = await this.companyRepo.find({ select: ['id'] });
      for (const company of companies) {
        await this.retentionService.detectChurnRisk(company.id);
      }
      await this.analyticsService.takeSnapshot();
      this.logger.log('Daily PLG jobs completed successfully');
    } catch (error) {
      this.logger.error('Failed to run daily PLG jobs', error.stack);
    }
  }

  /**
   * Weekly cron: Recalculate activation score for all companies.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyJobs() {
    this.logger.log('Starting weekly PLG jobs...');
    try {
      const companies = await this.companyRepo.find({ select: ['id'] });
      for (const company of companies) {
        await this.activationService.calculateActivation(company.id);
      }
      this.logger.log('Weekly PLG jobs completed successfully');
    } catch (error) {
      this.logger.error('Failed to run weekly PLG jobs', error.stack);
    }
  }
}
