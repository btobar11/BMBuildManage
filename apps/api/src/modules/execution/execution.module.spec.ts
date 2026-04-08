import { ExecutionModule } from './execution.module';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';

describe('ExecutionModule', () => {
  it('should be defined', () => {
    expect(ExecutionModule).toBeDefined();
  });

  it('should have ExecutionService defined', () => {
    expect(ExecutionService).toBeDefined();
  });

  it('should have ExecutionController defined', () => {
    expect(ExecutionController).toBeDefined();
  });
});
