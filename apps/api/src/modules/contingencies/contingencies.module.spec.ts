import { ContingenciesModule } from './contingencies.module';
import { ContingenciesService } from './contingencies.service';
import { ContingenciesController } from './contingencies.controller';

describe('ContingenciesModule', () => {
  it('should be defined', () => {
    expect(ContingenciesModule).toBeDefined();
  });

  it('should have ContingenciesService defined', () => {
    expect(ContingenciesService).toBeDefined();
  });

  it('should have ContingenciesController defined', () => {
    expect(ContingenciesController).toBeDefined();
  });
});
