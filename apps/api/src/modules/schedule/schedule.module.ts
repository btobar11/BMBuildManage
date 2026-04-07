import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import {
  ScheduleTask,
  ScheduleMilestone,
  ScheduleResource,
} from './schedule.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleTask,
      ScheduleMilestone,
      ScheduleResource,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
