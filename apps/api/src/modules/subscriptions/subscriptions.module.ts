import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { UsageLimits } from './entities/usage-limits.entity';
import { SubscriptionAddon } from './entities/subscription-addon.entity';
import { AddonFeature } from './entities/addon-feature.entity';
import { UsageTracking } from './entities/usage-tracking.entity';
import { UpgradeAttempt } from './entities/upgrade-attempt.entity';
import { Addon } from './entities/addon.entity';
import { CompanyAddon } from './entities/company-addon.entity';
import { Payment } from './entities/payment.entity';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { MercadoPagoService } from './mercadopago.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      FeatureFlag,
      PlanFeature,
      UsageLimits,
      SubscriptionAddon,
      AddonFeature,
      UsageTracking,
      UpgradeAttempt,
      Addon,
      CompanyAddon,
      Payment,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, BillingService, MercadoPagoService],
  exports: [SubscriptionsService, BillingService, MercadoPagoService],
})
export class SubscriptionsModule {}
