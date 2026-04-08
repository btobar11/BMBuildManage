import { InvoicesModule } from './invoices.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

describe('InvoicesModule', () => {
  it('should be defined', () => {
    expect(InvoicesModule).toBeDefined();
  });

  it('should have InvoicesService defined', () => {
    expect(InvoicesService).toBeDefined();
  });

  it('should have InvoicesController defined', () => {
    expect(InvoicesController).toBeDefined();
  });
});
