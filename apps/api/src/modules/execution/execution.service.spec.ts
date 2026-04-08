import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { BudgetExecutionLog } from './budget-execution-log.entity';
import { Item } from '../items/item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

const createMockItem = (overrides?: Partial<Item>): Item =>
  ({
    id: 'item-1',
    name: 'Concrete pouring',
    quantity: 100,
    quantity_executed: 50,
    real_cost: 1000,
    unit: 'm3',
    ...overrides,
  }) as unknown as Item;

const createMockLog = (
  overrides?: Partial<BudgetExecutionLog>,
): BudgetExecutionLog =>
  ({
    id: 'log-1',
    budget_item_id: 'item-1',
    quantity_executed: 10,
    real_cost: 200,
    note: 'Test log',
    date: new Date(),
    ...overrides,
  }) as unknown as BudgetExecutionLog;

const mockLogRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

const mockItemRepository = () => ({
  findOne: jest.fn(),
  update: jest.fn(),
});

const mockAuditLogsService = () => ({
  logEvent: jest.fn().mockResolvedValue({}),
});

describe('ExecutionService', () => {
  let service: ExecutionService;
  let logRepository: jest.Mocked<Repository<BudgetExecutionLog>>;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: getRepositoryToken(BudgetExecutionLog),
          useFactory: mockLogRepository,
        },
        { provide: getRepositoryToken(Item), useFactory: mockItemRepository },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    logRepository = module.get(getRepositoryToken(BudgetExecutionLog));
    itemRepository = module.get(getRepositoryToken(Item));
    auditLogsService = module.get(AuditLogsService);
  });

  describe('create', () => {
    it('should create an execution log and update item', async () => {
      const createDto = {
        budget_item_id: 'item-1',
        quantity_executed: 10,
        real_cost: 200,
        note: 'Test execution',
      };
      const item = createMockItem();
      const log = createMockLog();

      itemRepository.findOne.mockResolvedValue(item);
      logRepository.create.mockReturnValue(log);
      logRepository.save.mockResolvedValue(log);

      const result = await service.create(createDto, 'user-1');

      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(logRepository.create).toHaveBeenCalledWith(createDto);
      expect(logRepository.save).toHaveBeenCalledWith(log);
      expect(itemRepository.update).toHaveBeenCalledWith('item-1', {
        quantity_executed: 60,
        real_cost: 1200,
      });
      expect(auditLogsService.logEvent).toHaveBeenCalled();
      expect(result).toEqual(log);
    });

    it('should throw NotFoundException when item not found', async () => {
      itemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          budget_item_id: 'nonexistent',
          quantity_executed: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when exceeding threshold', async () => {
      const item = createMockItem({ quantity: 100, quantity_executed: 100 });
      itemRepository.findOne.mockResolvedValue(item);

      await expect(
        service.create({ budget_item_id: 'item-1', quantity_executed: 20 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow execution within threshold', async () => {
      const item = createMockItem({ quantity: 100, quantity_executed: 50 });
      const log = createMockLog();
      itemRepository.findOne.mockResolvedValue(item);
      logRepository.create.mockReturnValue(log);
      logRepository.save.mockResolvedValue(log);

      const result = await service.create({
        budget_item_id: 'item-1',
        quantity_executed: 10,
      });

      expect(result).toEqual(log);
    });
  });

  describe('findByItem', () => {
    it('should return logs for a budget item', async () => {
      const logs = [createMockLog(), createMockLog({ id: 'log-2' })];
      logRepository.find.mockResolvedValue(logs);

      const result = await service.findByItem('item-1');

      expect(logRepository.find).toHaveBeenCalledWith({
        where: { budget_item_id: 'item-1' },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });

  describe('findByBudget', () => {
    it('should return logs for a budget', async () => {
      const logs = [createMockLog()];
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(logs),
      };
      logRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findByBudget('budget-1');

      expect(logRepository.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(qb.innerJoin).toHaveBeenCalledWith('log.budget_item', 'item');
      expect(qb.innerJoin).toHaveBeenCalledWith('item.stage', 'stage');
      expect(qb.where).toHaveBeenCalledWith('stage.budget_id = :budgetId', {
        budgetId: 'budget-1',
      });
      expect(result).toEqual(logs);
    });
  });

  describe('remove', () => {
    it('should remove an execution log', async () => {
      const log = createMockLog();
      logRepository.findOne.mockResolvedValue(log);
      logRepository.remove.mockResolvedValue(log);

      const result = await service.remove('log-1');

      expect(logRepository.remove).toHaveBeenCalledWith(log);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when log not found', async () => {
      logRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
