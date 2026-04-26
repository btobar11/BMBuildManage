import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { ActivationStatus } from './entities/activation-status.entity';
import { EngagementEvent } from './entities/engagement-event.entity';
import { RetentionSignal } from './entities/retention-signal.entity';
import { PlgMetricsSnapshot } from './entities/plg-metrics.entity';
import { Lead } from './leads/entities/lead.entity';
import { Company } from '../companies/company.entity';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Item } from '../items/item.entity';
import { Expense } from '../expenses/expense.entity';
import { OnboardingService } from './onboarding.service';
import { ActivationService } from './activation.service';
import { EngagementService } from './engagement.service';
import { RetentionService } from './retention.service';
import { PlgAiService } from './plg-ai.service';
import { PlgAnalyticsService } from './plg-analytics.service';
import { PlgCronService } from './plg.cron';
import { LeadsService } from './leads/leads.service';
import { PlgController } from './plg.controller';
import { LeadsController } from './leads/leads.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnboardingProgress,
      ActivationStatus,
      EngagementEvent,
      RetentionSignal,
      PlgMetricsSnapshot,
      Company,
      Project,
      Budget,
      Item,
      Expense,
      Lead,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PlgController, LeadsController],
  providers: [
    OnboardingService,
    ActivationService,
    EngagementService,
    RetentionService,
    PlgAiService,
    PlgAnalyticsService,
    PlgCronService,
    LeadsService,
  ],
  exports: [
    OnboardingService,
    EngagementService,
    ActivationService,
    RetentionService,
    PlgAnalyticsService,
    LeadsService,
  ],
})
export class PlgModule {}
