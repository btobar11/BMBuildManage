import { ResourcesModule } from './resources.module';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';

describe('ResourcesModule', () => {
  it('should be defined', () => {
    expect(ResourcesModule).toBeDefined();
  });

  it('should have ResourcesService defined', () => {
    expect(ResourcesService).toBeDefined();
  });

  it('should have ResourcesController defined', () => {
    expect(ResourcesController).toBeDefined();
  });
});
