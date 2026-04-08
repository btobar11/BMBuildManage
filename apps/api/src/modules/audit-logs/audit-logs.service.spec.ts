import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog, AuditAction } from './audit-log.entity';

const createMockAuditLog = (overrides?: Partial<AuditLog>): AuditLog =>
  ({
    id: 'log-1',
    company_id: 'company-1',
    user_id: 'user-1',
    entity_name: 'Item',
    entity_id: 'item-1',
    action: AuditAction.UPDATE,
    old_value: {},
    new_value: {},
    description: 'Test log',
    created_at: new Date(),
    ...overrides,
  }) as unknown as AuditLog;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let repository: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  describe('logEvent', () => {
    it('should log an event', async () => {
      const data = {
        company_id: 'company-1',
        user_id: 'user-1',
        entity_name: 'Item',
        entity_id: 'item-1',
        action: AuditAction.UPDATE,
        description: 'Test update',
      };
      const log = createMockAuditLog(data);
      repository.create.mockReturnValue(log);
      repository.save.mockResolvedValue(log);

      const result = await service.logEvent(data);
      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(log);
      expect(result).toEqual(log);
    });
  });

  describe('getLogsForEntity', () => {
    it('should return logs for an entity', async () => {
      const logs = [
        createMockAuditLog({ id: '1' }),
        createMockAuditLog({ id: '2' }),
      ];
      repository.find.mockResolvedValue(logs);

      const result = await service.getLogsForEntity('Item', 'item-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { entity_name: 'Item', entity_id: 'item-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });
});
