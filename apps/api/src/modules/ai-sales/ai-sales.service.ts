import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInteraction } from './entities/sales-interaction.entity';
import { SalesContextService } from './sales-context.service';
import { SalesDecisionEngine } from './sales-decision.engine';
import {
  SalesConversationEngine,
  SalesMessage,
} from './sales-conversation.engine';
import { SalesTrackingService } from './sales-tracking.service';

export interface SalesOpportunityResponse {
  interaction_id: string;
  message: string;
  cta: string;
  urgency: string;
  opportunity_type: string;
  target?: string;
}

@Injectable()
export class AiSalesService {
  private readonly logger = new Logger(AiSalesService.name);

  constructor(
    @InjectRepository(SalesInteraction)
    private readonly interactionRepo: Repository<SalesInteraction>,
    private readonly contextService: SalesContextService,
    private readonly decisionEngine: SalesDecisionEngine,
    private readonly conversationEngine: SalesConversationEngine,
    private readonly trackingService: SalesTrackingService,
  ) {}

  /**
   * Main entry point: process a sales opportunity for a user.
   * Returns null if no opportunity or user has been shown too many prompts.
   */
  async processSalesOpportunity(
    companyId: string,
    userId: string,
  ): Promise<SalesOpportunityResponse | null> {
    // Anti-spam: check cooldown
    const canShow = await this.trackingService.canShowPrompt(userId);
    if (!canShow) {
      return null;
    }

    // 1. Build context
    const context = await this.contextService.buildContext(companyId);

    // 2. Detect opportunity
    const opportunity = this.decisionEngine.getSalesOpportunity(context);
    if (!opportunity) {
      return null;
    }

    // 3. Generate AI message
    let salesMessage: SalesMessage;
    try {
      salesMessage = await this.conversationEngine.generateSalesMessage(
        context,
        opportunity,
      );
    } catch (error) {
      this.logger.warn('Failed to generate sales message');
      return null;
    }

    // 4. Save interaction to DB
    const interaction = this.interactionRepo.create({
      company_id: companyId,
      user_id: userId,
      opportunity_type: opportunity.type,
      message: salesMessage.message,
      cta: salesMessage.cta,
      urgency: salesMessage.urgency,
      target_plan: opportunity.target,
      target_addon: opportunity.addon_code,
    });
    const saved = await this.interactionRepo.save(interaction);

    // 5. Return to frontend
    return {
      interaction_id: saved.id,
      message: salesMessage.message,
      cta: salesMessage.cta,
      urgency: salesMessage.urgency,
      opportunity_type: opportunity.type,
      target: opportunity.target || opportunity.addon_code,
    };
  }
}
