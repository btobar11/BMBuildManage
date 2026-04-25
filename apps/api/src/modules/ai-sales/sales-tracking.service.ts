import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SalesInteraction } from './entities/sales-interaction.entity';

export interface ConversionMetrics {
  total_shown: number;
  total_clicked: number;
  total_converted: number;
  click_rate: number;
  conversion_rate: number;
  total_revenue: number;
}

@Injectable()
export class SalesTrackingService {
  private readonly logger = new Logger(SalesTrackingService.name);

  constructor(
    @InjectRepository(SalesInteraction)
    private readonly interactionRepo: Repository<SalesInteraction>,
  ) {}

  /**
   * Check if a user has been shown too many prompts recently (anti-spam).
   * Max 3 prompts per 24 hours per user.
   */
  async canShowPrompt(userId: string): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.interactionRepo.count({
      where: {
        user_id: userId,
        shown_at: MoreThan(since),
        dismissed: false,
      },
    });
    return recentCount < 3;
  }

  /**
   * Record a click on a sales CTA.
   */
  async trackClick(interactionId: string): Promise<void> {
    await this.interactionRepo.update(interactionId, {
      clicked_at: new Date(),
    });
  }

  /**
   * Record a successful conversion (payment completed).
   */
  async trackConversion(interactionId: string, value: number): Promise<void> {
    await this.interactionRepo.update(interactionId, {
      converted: true,
      conversion_value: value,
    });
  }

  /**
   * Mark an interaction as dismissed by the user.
   */
  async trackDismissal(interactionId: string): Promise<void> {
    await this.interactionRepo.update(interactionId, {
      dismissed: true,
    });
  }

  /**
   * Get conversion metrics for a company over the last 30 days.
   */
  async getMetrics(companyId: string): Promise<ConversionMetrics> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const interactions = await this.interactionRepo.find({
      where: {
        company_id: companyId,
        shown_at: MoreThan(since),
      },
    });

    const totalShown = interactions.length;
    const totalClicked = interactions.filter((i) => i.clicked_at).length;
    const totalConverted = interactions.filter((i) => i.converted).length;
    const totalRevenue = interactions
      .filter((i) => i.converted && i.conversion_value)
      .reduce((sum, i) => sum + Number(i.conversion_value), 0);

    return {
      total_shown: totalShown,
      total_clicked: totalClicked,
      total_converted: totalConverted,
      click_rate: totalShown > 0 ? (totalClicked / totalShown) * 100 : 0,
      conversion_rate:
        totalClicked > 0 ? (totalConverted / totalClicked) * 100 : 0,
      total_revenue: totalRevenue,
    };
  }
}
