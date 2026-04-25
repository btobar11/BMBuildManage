import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlgMetricsSnapshot } from './entities/plg-metrics.entity';
import { ActivationStatus } from './entities/activation-status.entity';
import { RetentionSignal } from './entities/retention-signal.entity';

@Injectable()
export class PlgAnalyticsService {
  private readonly logger = new Logger(PlgAnalyticsService.name);

  constructor(
    @InjectRepository(PlgMetricsSnapshot)
    private readonly snapshotRepo: Repository<PlgMetricsSnapshot>,
    @InjectRepository(ActivationStatus)
    private readonly activationRepo: Repository<ActivationStatus>,
    @InjectRepository(RetentionSignal)
    private readonly retentionRepo: Repository<RetentionSignal>,
  ) {}

  /**
   * Get overall PLG metrics aggregated across all companies.
   */
  async getMetrics() {
    const totalCompanies = await this.activationRepo.count();
    const activatedCompanies = await this.activationRepo.count({
      where: { is_activated: true },
    });

    const highRiskCompanies = await this.retentionRepo.count({
      where: { risk_level: 'HIGH' },
    });

    const activationRate =
      totalCompanies > 0 ? (activatedCompanies / totalCompanies) * 100 : 0;
    const churnRiskRate =
      totalCompanies > 0 ? (highRiskCompanies / totalCompanies) * 100 : 0;

    // A real implementation of DAU/WAU would query a distinct user activity log
    // For now we mock it based on retention signals
    const activeWithinDay = await this.retentionRepo
      .createQueryBuilder('retention')
      .where("retention.last_activity > NOW() - INTERVAL '1 day'")
      .getCount();

    const activeWithinWeek = await this.retentionRepo
      .createQueryBuilder('retention')
      .where("retention.last_activity > NOW() - INTERVAL '7 days'")
      .getCount();

    return {
      activation_rate: activationRate,
      churn_risk_rate: churnRiskRate,
      dau: activeWithinDay,
      wau: activeWithinWeek,
    };
  }

  /**
   * Take a daily snapshot of the metrics.
   */
  async takeSnapshot(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      const snapshot = this.snapshotRepo.create({
        date: new Date(),
        activation_rate: metrics.activation_rate,
        churn_rate: metrics.churn_risk_rate,
        dau: metrics.dau,
        wau: metrics.wau,
      });
      await this.snapshotRepo.save(snapshot);
      this.logger.log('PLG Metrics snapshot taken');
    } catch (error) {
      this.logger.error('Error taking PLG metrics snapshot', error.stack);
    }
  }
}
