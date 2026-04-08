import { MachineryModule } from './machinery.module';
import { MachineryService } from './machinery.service';
import { MachineryController } from './machinery.controller';

describe('MachineryModule', () => {
  it('should be defined', () => {
    expect(MachineryModule).toBeDefined();
  });

  it('should have MachineryService defined', () => {
    expect(MachineryService).toBeDefined();
  });

  it('should have MachineryController defined', () => {
    expect(MachineryController).toBeDefined();
  });
});
