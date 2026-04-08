import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockExpensesService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    getSummaryByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };
  const mockRolesGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create an expense', async () => {
      const createDto: any = {
        description: 'Test Expense',
        project_id: 'proj-1',
        amount: 100,
        date: '2024-01-01',
      };
      const expected = { id: 'expense-1', ...createDto };
      const req = { user: { company_id: 'company-1' } };
      mockExpensesService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto, req);

      expect(createDto.company_id).toBe('company-1');
      expect(mockExpensesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all expenses by project', async () => {
      const expected = [{ id: 'expense-1', description: 'Expense 1' }];
      const req = { user: { company_id: 'company-1' } };
      mockExpensesService.findAllByProject.mockResolvedValue(expected);

      const result = await controller.findAll(req, 'proj-1');

      expect(mockExpensesService.findAllByProject).toHaveBeenCalledWith(
        'proj-1',
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /summary/:projectId', () => {
    it('should return summary by project', async () => {
      const expected = { total: 1000, count: 5 };
      mockExpensesService.getSummaryByProject.mockResolvedValue(expected);

      const result = await controller.getSummary('proj-1');

      expect(mockExpensesService.getSummaryByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single expense', async () => {
      const expected = { id: 'expense-1', description: 'Expense 1' };
      mockExpensesService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('expense-1');

      expect(mockExpensesService.findOne).toHaveBeenCalledWith('expense-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update an expense', async () => {
      const updateDto = { description: 'Updated Expense' };
      const expected = { id: 'expense-1', ...updateDto };
      mockExpensesService.update.mockResolvedValue(expected);

      const result = await controller.update('expense-1', updateDto);

      expect(mockExpensesService.update).toHaveBeenCalledWith(
        'expense-1',
        updateDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an expense', async () => {
      mockExpensesService.remove.mockResolvedValue({ id: 'expense-1' });

      const result = await controller.remove('expense-1');

      expect(mockExpensesService.remove).toHaveBeenCalledWith('expense-1');
      expect(result).toEqual({ id: 'expense-1' });
    });
  });
});
