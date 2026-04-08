import { MaterialsModule } from './materials.module';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';

describe('MaterialsModule', () => {
  it('should be defined', () => {
    expect(MaterialsModule).toBeDefined();
  });

  it('should have MaterialsService defined', () => {
    expect(MaterialsService).toBeDefined();
  });

  it('should have MaterialsController defined', () => {
    expect(MaterialsController).toBeDefined();
  });
});
