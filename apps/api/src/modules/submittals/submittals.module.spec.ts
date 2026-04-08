import { SubmittalsModule } from './submittals.module';
import { SubmittalsService } from './submittals.service';
import { SubmittalsController } from './submittals.controller';

describe('SubmittalsModule', () => {
  it('should be defined', () => {
    expect(SubmittalsModule).toBeDefined();
  });

  it('should have SubmittalsService defined', () => {
    expect(SubmittalsService).toBeDefined();
  });

  it('should have SubmittalsController defined', () => {
    expect(SubmittalsController).toBeDefined();
  });
});
