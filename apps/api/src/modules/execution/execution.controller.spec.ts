import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ExecutionController', () => {
  let controller: ExecutionController;
  let service: ExecutionService;

  const mockExecutionService = {
    create: jest.fn(),
    findByItem: jest.fn(),
    findByBudget: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };
  const mockRolesGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionController],
      providers: [
        {
          provide: ExecutionService,
          useValue: mockExecutionService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ExecutionController>(ExecutionController);
    service = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create an execution log', async () => {
      const createDto: any = {
        item_id: 'item-1',
        description: 'Test Log',
        quantity: 10,
      };
      const expected = { id: 'log-1', ...createDto };
      const req = { user: { id: 'user-1' } };
      mockExecutionService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto, req);

      expect(mockExecutionService.create).toHaveBeenCalledWith(
        createDto,
        'user-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /by-item/:itemId', () => {
    it('should return execution logs by item', async () => {
      const expected = [{ id: 'log-1', item_id: 'item-1' }];
      mockExecutionService.findByItem.mockResolvedValue(expected);

      const result = await controller.findByItem('item-1');

      expect(mockExecutionService.findByItem).toHaveBeenCalledWith('item-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /by-budget/:budgetId', () => {
    it('should return execution logs by budget', async () => {
      const expected = [{ id: 'log-1', budget_id: 'budget-1' }];
      mockExecutionService.findByBudget.mockResolvedValue(expected);

      const result = await controller.findByBudget('budget-1');

      expect(mockExecutionService.findByBudget).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an execution log', async () => {
      mockExecutionService.remove.mockResolvedValue({ id: 'log-1' });

      const result = await controller.remove('log-1');

      expect(mockExecutionService.remove).toHaveBeenCalledWith('log-1');
      expect(result).toEqual({ id: 'log-1' });
    });
  });
});
