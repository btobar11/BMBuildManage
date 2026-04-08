import { BudgetsModule } from './budgets.module';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { ExportService } from './export.service';
import { FinancialService } from './financial.service';
import { BusinessRulesService } from './business-rules.service';
import { PDFExportService } from './pdf-export.service';

describe('BudgetsModule', () => {
  it('should be defined', () => {
    expect(BudgetsModule).toBeDefined();
  });

  it('should have BudgetsService defined', () => {
    expect(BudgetsService).toBeDefined();
  });

  it('should have BudgetsController defined', () => {
    expect(BudgetsController).toBeDefined();
  });

  it('should have ExportService defined', () => {
    expect(ExportService).toBeDefined();
  });

  it('should have FinancialService defined', () => {
    expect(FinancialService).toBeDefined();
  });

  it('should have BusinessRulesService defined', () => {
    expect(BusinessRulesService).toBeDefined();
  });

  it('should have PDFExportService defined', () => {
    expect(PDFExportService).toBeDefined();
  });
});
