import { CompaniesModule } from './companies.module';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

describe('CompaniesModule', () => {
  it('should be defined', () => {
    expect(CompaniesModule).toBeDefined();
  });

  it('should have CompaniesService defined', () => {
    expect(CompaniesService).toBeDefined();
  });

  it('should have CompaniesController defined', () => {
    expect(CompaniesController).toBeDefined();
  });
});
