import { StagesModule } from './stages.module';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';

describe('StagesModule', () => {
  it('should be defined', () => {
    expect(StagesModule).toBeDefined();
  });

  it('should have StagesService defined', () => {
    expect(StagesService).toBeDefined();
  });

  it('should have StagesController defined', () => {
    expect(StagesController).toBeDefined();
  });
});
