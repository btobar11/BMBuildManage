import { PunchListModule } from './punch-list.module';
import { PunchListService } from './punch-list.service';
import { PunchListController } from './punch-list.controller';

describe('PunchListModule', () => {
  it('should be defined', () => {
    expect(PunchListModule).toBeDefined();
  });

  it('should have PunchListService defined', () => {
    expect(PunchListService).toBeDefined();
  });

  it('should have PunchListController defined', () => {
    expect(PunchListController).toBeDefined();
  });
});
