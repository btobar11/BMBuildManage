import { WorkersModule } from './workers.module';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';

describe('WorkersModule', () => {
  it('should be defined', () => {
    expect(WorkersModule).toBeDefined();
  });

  it('should have WorkersService defined', () => {
    expect(WorkersService).toBeDefined();
  });

  it('should have WorkersController defined', () => {
    expect(WorkersController).toBeDefined();
  });
});
