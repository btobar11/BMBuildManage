import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetentionSignal } from './entities/retention-signal.entity';
import { EngagementEvent } from './entities/engagement-event.entity';
import { EngagementService } from './engagement.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(RetentionSignal)
    private readonly retentionRepo: Repository<RetentionSignal>,
    @InjectRepository(EngagementEvent)
    private readonly engagementRepo: Repository<EngagementEvent>,
    private readonly engagementService: EngagementService,
  ) {}

  /**
   * Detect churn risk for a company based on activity recency and engagement.
   */
  async detectChurnRisk(companyId: string): Promise<RetentionSignal> {
    try {
      const lastEvent = await this.engagementRepo.findOne({
        where: { company_id: companyId },
        order: { created_at: 'DESC' },
      });

      const lastActivity = lastEvent ? lastEvent.created_at : null;
      let riskLevel = 'HIGH';

      if (lastActivity) {
        const daysSinceLastActivity =
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastActivity > 14) {
          riskLevel = 'HIGH';
        } else if (daysSinceLastActivity > 7) {
          riskLevel = 'MEDIUM';
        } else {
          riskLevel = 'LOW';
        }
      }

      const engagementScore =
        await this.engagementService.calculateEngagementScore(companyId);

      let signal = await this.retentionRepo.findOne({
        where: { company_id: companyId },
      });

      if (!signal) {
        signal = this.retentionRepo.create({ company_id: companyId });
      }

      signal.risk_level = riskLevel;
      if (lastActivity) {
        signal.last_activity = lastActivity;
      }
      signal.engagement_score = engagementScore;
      signal.updated_at = new Date();

      return await this.retentionRepo.save(signal);
    } catch (error) {
      this.logger.error(
        `Failed to detect churn risk for ${companyId}`,
        error.stack,
      );
      throw error;
    }
  }

  async getSignal(companyId: string): Promise<RetentionSignal | null> {
    return this.retentionRepo.findOne({ where: { company_id: companyId } });
  }
}
