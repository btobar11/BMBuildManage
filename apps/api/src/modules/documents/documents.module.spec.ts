import { DocumentsModule } from './documents.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

describe('DocumentsModule', () => {
  it('should be defined', () => {
    expect(DocumentsModule).toBeDefined();
  });

  it('should have DocumentsService defined', () => {
    expect(DocumentsService).toBeDefined();
  });

  it('should have DocumentsController defined', () => {
    expect(DocumentsController).toBeDefined();
  });
});
