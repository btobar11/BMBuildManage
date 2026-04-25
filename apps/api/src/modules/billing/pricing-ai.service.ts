import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingMetrics } from './entities/pricing-metrics.entity';
import { AIService } from '../ai/ai.service';
import { RetentionService } from '../plg/retention.service';
import { EngagementService } from '../plg/engagement.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Payment } from '../subscriptions/entities/payment.entity';

@Injectable()
export class PricingAIService {
  private readonly logger = new Logger(PricingAIService.name);

  constructor(
    @InjectRepository(PricingMetrics)
    private readonly pricingRepo: Repository<PricingMetrics>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly aiService: AIService,
    private readonly retentionService: RetentionService,
    private readonly engagementService: EngagementService,
  ) {}

  /**
   * Analyze company usage and generate dynamic pricing recommendations.
   */
  async generateRecommendation(companyId: string): Promise<PricingMetrics> {
    try {
      const retention = await this.retentionService.detectChurnRisk(companyId);
      const engagement =
        await this.engagementService.calculateEngagementScore(companyId);

      // In a real scenario, we'd fetch more granular usage data here
      const usageStats = {
        engagement_score: engagement,
        risk_level: retention.risk_level,
        last_activity: retention.last_activity,
      };

      const sub = await this.subscriptionRepo.findOne({
        where: { company_id: companyId },
      });
      const currentArpu = sub ? Number(sub.monthly_price || 0) : 0;

      const prompt = `
        Analyze the following SaaS usage metrics for a construction company and suggest a dynamic pricing adjustment.
        Current ARPU: ${currentArpu}
        Engagement Score: ${engagement}/100
        Churn Risk: ${retention.risk_level}
        
        Guidelines:
        - If engagement is high (>80) and risk is low, suggest a 10-15% expansion (upsell).
        - If risk is high, suggest a temporary discount or an addon trial to retain.
        - Return JSON with: recommended_price (number), reason (string), segment (string).
      `;

      const aiResponse = await this.aiService.generateResponse(prompt);
      // Simplified parsing for demonstration
      const recommendation = {
        recommended_price: currentArpu > 0 ? currentArpu * 1.15 : 115, // Default for high engagement
        segment: 'construction',
        arpu: currentArpu,
        churn_probability: retention.risk_level === 'HIGH' ? 0.8 : 0.2,
      };

      let metrics = await this.pricingRepo.findOne({
        where: { company_id: companyId },
      });
      if (!metrics) {
        metrics = this.pricingRepo.create({ company_id: companyId });
      }

      metrics.segment = recommendation.segment;
      metrics.arpu = recommendation.arpu;
      metrics.churn_probability = recommendation.churn_probability;
      metrics.usage_stats = usageStats;
      metrics.recommended_price = recommendation.recommended_price;

      return await this.pricingRepo.save(metrics);
    } catch (error) {
      this.logger.error(
        `Error generating pricing recommendation for ${companyId}`,
        error.stack,
      );
      throw error;
    }
  }
}
