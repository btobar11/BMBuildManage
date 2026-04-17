import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from './schedule.module';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleTask, ScheduleMilestone, ScheduleResource } from './schedule.entity';

describe('ScheduleModule', () => {
  it('should be defined', () => {
    expect(ScheduleModule).toBeDefined();
  });

  it('should have ScheduleService defined', () => {
    expect(ScheduleService).toBeDefined();
  });

  it('should have ScheduleController defined', () => {
    expect(ScheduleController).toBeDefined();
  });

  it('should have entity classes defined', () => {
    expect(ScheduleTask).toBeDefined();
    expect(ScheduleMilestone).toBeDefined();
    expect(ScheduleResource).toBeDefined();
  });

  it('should verify forwardRef is callable', () => {
    const result = forwardRef(() => ({}));
    expect(result).toBeDefined();
  });

  it('should verify Module decorator', () => {
    const metadata = Module({});
    expect(metadata).toBeDefined();
  });
});
