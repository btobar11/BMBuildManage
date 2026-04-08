import { TemplatesModule } from './templates.module';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';

describe('TemplatesModule', () => {
  it('should be defined', () => {
    expect(TemplatesModule).toBeDefined();
  });

  it('should have TemplatesService defined', () => {
    expect(TemplatesService).toBeDefined();
  });

  it('should have TemplatesController defined', () => {
    expect(TemplatesController).toBeDefined();
  });
});
