import { ExpensesModule } from './expenses.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

describe('ExpensesModule', () => {
  it('should be defined', () => {
    expect(ExpensesModule).toBeDefined();
  });

  it('should have ExpensesService defined', () => {
    expect(ExpensesService).toBeDefined();
  });

  it('should have ExpensesController defined', () => {
    expect(ExpensesController).toBeDefined();
  });
});
