import { SubcontractorsModule } from './subcontractors.module';
import { SubcontractorsService } from './subcontractors.service';
import { SubcontractorsController } from './subcontractors.controller';

describe('SubcontractorsModule', () => {
  it('should be defined', () => {
    expect(SubcontractorsModule).toBeDefined();
  });

  it('should have SubcontractorsService defined', () => {
    expect(SubcontractorsService).toBeDefined();
  });

  it('should have SubcontractorsController defined', () => {
    expect(SubcontractorsController).toBeDefined();
  });
});
