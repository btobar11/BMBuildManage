import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetExecutionLog } from './budget-execution-log.entity';
import { ResourceConsumption } from './resource-consumption.entity';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { Item } from '../items/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetExecutionLog, ResourceConsumption, Item])],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
