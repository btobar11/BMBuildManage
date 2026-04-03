import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from './budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { AuthModule } from '../auth/auth.module';
import { ExportService } from './export.service';
import { FinancialService } from './financial.service';
import { Expense } from '../expenses/expense.entity';
import { WorkerAssignment } from '../worker-assignments/worker-assignment.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';
import { Project } from '../projects/project.entity';
import { BusinessRulesService } from './business-rules.service';
import { PDFExportService } from './pdf-export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget, 
      Stage, 
      Item, 
      Expense, 
      WorkerAssignment, 
      ProjectContingency,
      Project
    ]), 
    AuthModule
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, ExportService, FinancialService, BusinessRulesService, PDFExportService],
  exports: [BudgetsService, FinancialService, BusinessRulesService, PDFExportService],
})
export class BudgetsModule {}


