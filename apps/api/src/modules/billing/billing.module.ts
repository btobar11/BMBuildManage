import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../subscriptions/entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { CompanyAddon } from '../subscriptions/entities/company-addon.entity';
import { Addon } from '../subscriptions/entities/addon.entity';
import { PricingMetrics } from './entities/pricing-metrics.entity';
import { BillingOrchestratorService } from './billing-orchestrator.service';
import { UpsellService } from './upsell.service';
import { PricingAIService } from './pricing-ai.service';
import { BillingController } from './billing.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AIModule } from '../ai/ai.module';
import { PlgModule } from '../plg/plg.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Subscription,
      CompanyAddon,
      Addon,
      PricingMetrics,
    ]),
    forwardRef(() => SubscriptionsModule),
    AIModule,
    PlgModule,
  ],
  controllers: [BillingController],
  providers: [BillingOrchestratorService, UpsellService, PricingAIService],
  exports: [BillingOrchestratorService, UpsellService, PricingAIService],
})
export class BillingModule {}
