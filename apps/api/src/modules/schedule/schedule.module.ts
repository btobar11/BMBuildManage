import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleTask, ScheduleMilestone, ScheduleResource } from './schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleTask, ScheduleMilestone, ScheduleResource]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}