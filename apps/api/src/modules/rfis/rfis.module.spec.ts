import { RfisModule } from './rfis.module';
import { RfisService } from './rfis.service';
import { RfisController } from './rfis.controller';

describe('RfisModule', () => {
  it('should be defined', () => {
    expect(RfisModule).toBeDefined();
  });

  it('should have RfisService defined', () => {
    expect(RfisService).toBeDefined();
  });

  it('should have RfisController defined', () => {
    expect(RfisController).toBeDefined();
  });
});
