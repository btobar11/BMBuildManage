import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { BIMAnalyticsService } from './bim-analytics.service';
import { BIMReportsService } from './bim-reports.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Worker } from '../workers/worker.entity';
import { FinancialService } from '../budgets/financial.service';
import { Expense } from '../expenses/expense.entity';
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Budget,
      Stage,
      Item,
      Worker,
      Expense,
      WorkerAssignment,
      ProjectContingency,
    ]),
  ],
  controllers: [AIController],
  providers: [
    AIService,
    BIMAnalyticsService,
    BIMReportsService,
    FinancialService,
  ],
  exports: [AIService, BIMAnalyticsService, BIMReportsService],
})
export class AIModule {}
