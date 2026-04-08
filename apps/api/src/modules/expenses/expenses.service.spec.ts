import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from './expense.entity';

const createMockExpense = (overrides?: Partial<Expense>): Expense =>
  ({
    id: 'test-id',
    company_id: 'company-1',
    project_id: 'project-1',
    category: 'materials',
    description: 'Test expense',
    amount: 1000,
    date: new Date(),
    vendor: 'Vendor 1',
    receipt_url: 'http://example.com',
    notes: 'Test notes',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as unknown as Expense;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
  })),
});

describe('ExpensesService', () => {
  let service: ExpensesService;
  let repository: jest.Mocked<Repository<Expense>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getRepositoryToken(Expense), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    repository = module.get(getRepositoryToken(Expense));
  });

  describe('create', () => {
    it('should create an expense', async () => {
      const createDto = {
        company_id: 'company-1',
        project_id: 'project-1',
        category: 'materials',
        description: 'Test expense',
        amount: 1000,
        date: '2024-01-15',
      };
      const expense = createMockExpense();
      repository.create.mockReturnValue(expense);
      repository.save.mockResolvedValue(expense);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(expense);
      expect(result).toEqual(expense);
    });
  });

  describe('findAllByProject', () => {
    it('should return expenses for a project', async () => {
      const expenses = [
        createMockExpense({ id: '1' }),
        createMockExpense({ id: '2' }),
      ];
      repository.find.mockResolvedValue(expenses);

      const result = await service.findAllByProject('project-1', 'company-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          project_id: 'project-1',
          company_id: 'company-1',
        },
      });
      expect(result).toEqual(expenses);
    });
  });

  describe('findOne', () => {
    it('should return an expense by id', async () => {
      const expense = createMockExpense();
      repository.findOne.mockResolvedValue(expense);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(expense);
    });

    it('should throw NotFoundException if expense not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      const expense = createMockExpense();
      const updatedExpense = createMockExpense({ ...expense, amount: 2000 });
      repository.findOne.mockResolvedValue(expense);
      repository.merge.mockReturnValue(updatedExpense);
      repository.save.mockResolvedValue(updatedExpense);

      const result = await service.update('test-id', { amount: 2000 });
      expect(result.amount).toBe(2000);
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      const expense = createMockExpense();
      repository.findOne.mockResolvedValue(expense);
      repository.remove.mockResolvedValue(expense);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(expense);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getSummaryByProject', () => {
    it('should return total expenses for a project', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '50000' }),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getSummaryByProject('project-1');
      expect(qb.select).toHaveBeenCalledWith('SUM(expense.amount)', 'total');
      expect(result).toEqual({ total: 50000 });
    });

    it('should return 0 when no expenses exist', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getSummaryByProject('project-1');
      expect(result).toEqual({ total: 0 });
    });
  });
});
