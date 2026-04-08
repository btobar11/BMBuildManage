import { WorkerAssignmentsModule } from './worker-assignments.module';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { WorkerAssignmentsController } from './worker-assignments.controller';

describe('WorkerAssignmentsModule', () => {
  it('should be defined', () => {
    expect(WorkerAssignmentsModule).toBeDefined();
  });

  it('should have WorkerAssignmentsService defined', () => {
    expect(WorkerAssignmentsService).toBeDefined();
  });

  it('should have WorkerAssignmentsController defined', () => {
    expect(WorkerAssignmentsController).toBeDefined();
  });
});
