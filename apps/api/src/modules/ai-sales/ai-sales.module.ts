import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SalesInteraction } from './entities/sales-interaction.entity';
import { AiSalesService } from './ai-sales.service';
import { AiSalesController } from './ai-sales.controller';
import { SalesContextService } from './sales-context.service';
import { SalesDecisionEngine } from './sales-decision.engine';
import { SalesConversationEngine } from './sales-conversation.engine';
import { SalesTrackingService } from './sales-tracking.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesInteraction]),
    ConfigModule,
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => BillingModule),
  ],
  controllers: [AiSalesController],
  providers: [
    AiSalesService,
    SalesContextService,
    SalesDecisionEngine,
    SalesConversationEngine,
    SalesTrackingService,
  ],
  exports: [AiSalesService, SalesTrackingService],
})
export class AiSalesModule {}
