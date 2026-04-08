import { WorkerPaymentsModule } from './worker-payments.module';
import { WorkerPaymentsService } from './worker-payments.service';
import { WorkerPaymentsController } from './worker-payments.controller';

describe('WorkerPaymentsModule', () => {
  it('should be defined', () => {
    expect(WorkerPaymentsModule).toBeDefined();
  });

  it('should have WorkerPaymentsService defined', () => {
    expect(WorkerPaymentsService).toBeDefined();
  });

  it('should have WorkerPaymentsController defined', () => {
    expect(WorkerPaymentsController).toBeDefined();
  });
});
