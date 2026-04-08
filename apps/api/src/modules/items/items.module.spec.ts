import { ItemsModule } from './items.module';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';

describe('ItemsModule', () => {
  it('should be defined', () => {
    expect(ItemsModule).toBeDefined();
  });

  it('should have ItemsService defined', () => {
    expect(ItemsService).toBeDefined();
  });

  it('should have ItemsController defined', () => {
    expect(ItemsController).toBeDefined();
  });
});
