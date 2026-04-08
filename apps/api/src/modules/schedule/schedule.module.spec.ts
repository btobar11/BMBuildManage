import { ScheduleModule } from './schedule.module';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

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
});
