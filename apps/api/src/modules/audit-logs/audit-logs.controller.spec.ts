import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let service: AuditLogsService;
  let auditRepo: any;

  const mockAuditLogsService = {
    getLogsForEntity: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    manager: {
      query: jest.fn().mockResolvedValue([]),
    },
  };

  const mockAuthGuard = { canActivate: () => true };
  const mockRolesGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    service = module.get<AuditLogsService>(AuditLogsService);
    auditRepo = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return audit logs with filters', async () => {
      const expected = [{ id: 'log-1', entity_name: 'Budget' }];
      const req = { user: { company_id: 'company-1' } };

      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expected),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getAuditLogs(
        'Budget',
        'entity-1',
        '50',
        req,
      );

      expect(result).toEqual(expected);
    });

    it('should use default limit', async () => {
      const req = { user: { company_id: 'company-1' } };
      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getAuditLogs(
        undefined as any,
        undefined as any,
        undefined as any,
        req,
      );

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });
  });

  describe('GET /by-entity', () => {
    it('should return entity history', async () => {
      const expected = [{ id: 'log-1' }];
      mockAuditLogsService.getLogsForEntity.mockResolvedValue(expected);

      const result = await controller.getEntityHistory('Budget', 'entity-1');

      expect(mockAuditLogsService.getLogsForEntity).toHaveBeenCalledWith(
        'Budget',
        'entity-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /project/:projectId', () => {
    it('should return project logs', async () => {
      const expected = [{ id: 'log-1', project_id: 'proj-1' }];
      const req = { user: { company_id: 'company-1' } };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expected),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getProjectLogs('proj-1', '100', req);

      expect(result).toEqual(expected);
    });

    it('should handle query errors gracefully', async () => {
      const req = { user: { company_id: 'company-1' } };
      mockRepository.manager.query.mockRejectedValue(new Error('DB Error'));

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getProjectLogs('proj-1', '100', req);

      expect(result).toEqual([]);
    });

    it('should fetch budgets, stages and items for related ids', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query
        .mockResolvedValueOnce([{ id: 'budget-1' }, { id: 'budget-2' }])
        .mockResolvedValueOnce([{ id: 'stage-1' }, { id: 'stage-2' }])
        .mockResolvedValueOnce([{ id: 'item-1' }])
        .mockResolvedValueOnce([{ id: 'expense-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getProjectLogs('proj-1', '100', req);

      expect(mockRepository.manager.query).toHaveBeenCalledTimes(4);
      expect(result).toEqual([{ id: 'log-1' }]);
    });

    it('should handle empty budgets array', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'expense-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', '100', req);

      expect(mockRepository.manager.query).toHaveBeenCalledTimes(2);
    });

    it('should handle empty stages array', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query
        .mockResolvedValueOnce([{ id: 'budget-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'expense-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', '100', req);

      expect(mockRepository.manager.query).toHaveBeenCalledTimes(3);
    });

    it('should use default limit when not provided', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', undefined as any, req);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should cap limit at 500', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', '1000', req);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(500);
    });

    it('should include related ids in query when available', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query
        .mockResolvedValueOnce([{ id: 'budget-1' }])
        .mockResolvedValueOnce([{ id: 'expense-1' }]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', '50', req);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(log.project_id = :projectId OR log.entity_id IN (:...relatedIds))',
        {
          projectId: 'proj-1',
          relatedIds: expect.arrayContaining(['budget-1', 'expense-1']),
        },
      );
    });

    it('should fallback to project_id filter when no related ids', async () => {
      const req = { user: { company_id: 'company-1' } };

      mockRepository.manager.query.mockResolvedValue([]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await controller.getProjectLogs('proj-1', '50', req);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.project_id = :projectId',
        { projectId: 'proj-1' },
      );
    });
  });
});
