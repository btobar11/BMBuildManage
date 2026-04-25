import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { EngagementEvent } from './entities/engagement-event.entity';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    @InjectRepository(EngagementEvent)
    private readonly engagementRepo: Repository<EngagementEvent>,
  ) {}

  /**
   * Track an arbitrary engagement event.
   */
  async trackEvent(
    companyId: string,
    userId: string,
    eventType: string,
    metadata?: any,
  ): Promise<void> {
    try {
      const event = this.engagementRepo.create({
        company_id: companyId,
        user_id: userId,
        event_type: eventType,
        metadata,
      });
      await this.engagementRepo.save(event);
    } catch (error) {
      this.logger.error(
        `Failed to track event ${eventType} for ${companyId}`,
        error.stack,
      );
    }
  }

  /**
   * Calculate a dynamic engagement score based on recent activity.
   */
  async calculateEngagementScore(companyId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEvents = await this.engagementRepo.find({
      where: {
        company_id: companyId,
        created_at: MoreThan(sevenDaysAgo),
      },
    });

    const eventCount = recentEvents.length;
    const uniqueTypes = new Set(recentEvents.map((e) => e.event_type)).size;

    // Engagement score heuristic
    const score = Math.round(eventCount * 0.5 + uniqueTypes * 10);
    return Math.min(score, 100); // Cap at 100 for normalization
  }
}
