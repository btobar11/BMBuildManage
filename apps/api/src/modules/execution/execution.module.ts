import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetExecutionLog } from './budget-execution-log.entity';
import { ResourceConsumption } from './resource-consumption.entity';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { Item } from '../items/item.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetExecutionLog, ResourceConsumption, Item]), AuthModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
