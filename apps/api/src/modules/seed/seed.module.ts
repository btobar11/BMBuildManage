import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Resource } from '../resources/resource.entity';
import { ApuTemplate } from '../apu/apu-template.entity';
import { Worker } from '../workers/worker.entity';
import { Unit } from '../units/unit.entity';
import { Project } from '../projects/project.entity';
import { Budget } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item } from '../items/item.entity';
import { Expense } from '../expenses/expense.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Resource,
      ApuTemplate,
      Worker,
      Unit,
      Project,
      Budget,
      Stage,
      Item,
      Expense,
      ProjectContingency,
    ]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
  exports: [SeedService],
})
export class SeedModule {}
