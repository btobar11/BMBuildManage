import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditSubscriber } from './audit.subscriber';
import { AuditLog, AuditAction } from './audit-log.entity';

const createMockAuditLog = (overrides?: Partial<AuditLog>): AuditLog =>
  ({
    id: 'log-1',
    company_id: 'company-1',
    user_id: 'user-1',
    entity_name: 'Item',
    entity_id: 'item-1',
    action: AuditAction.CREATE,
    created_at: new Date(),
    ...overrides,
  }) as AuditLog;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

describe('AuditSubscriber', () => {
  let subscriber: AuditSubscriber;
  let repository: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditSubscriber,
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepository },
      ],
    }).compile();

    subscriber = module.get<AuditSubscriber>(AuditSubscriber);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  describe('constructor', () => {
    it('should have auditedEntities list', () => {
      expect(subscriber).toBeDefined();
    });
  });

  describe('afterInsert', () => {
    it('should create audit log for audited entity', async () => {
      const mockEvent = {
        entity: { id: 'item-1', name: 'Test Item', company_id: 'company-1' },
        metadata: { name: 'Item' },
      } as any;

      const log = createMockAuditLog();
      repository.create.mockReturnValue(log);
      repository.save.mockResolvedValue(log);

      await subscriber.afterInsert(mockEvent);

      expect(repository.create).toHaveBeenCalledWith({
        entity_name: 'Item',
        entity_id: 'item-1',
        company_id: 'company-1',
        project_id: null,
        action: AuditAction.CREATE,
        new_value: mockEvent.entity,
        description: expect.any(String),
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not create log for non-audited entity', async () => {
      const mockEvent = {
        entity: { id: 'company-1', name: 'Test Company' },
        metadata: { name: 'Company' },
      } as any;

      await subscriber.afterInsert(mockEvent);

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should not create log if entity is missing', async () => {
      const mockEvent = {
        entity: null,
        metadata: { name: 'Item' },
      } as any;

      await subscriber.afterInsert(mockEvent);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should extract project_id from budget relation', async () => {
      const mockEvent = {
        entity: {
          id: 'item-1',
          company_id: 'company-1',
          budget: { project_id: 'project-1' },
        },
        metadata: { name: 'Item' },
      } as any;

      const log = createMockAuditLog();
      repository.create.mockReturnValue(log);
      repository.save.mockResolvedValue(log);

      await subscriber.afterInsert(mockEvent);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'project-1',
        }),
      );
    });
  });

  describe('afterUpdate', () => {
    it('should create audit log for update', async () => {
      const mockEvent = {
        entity: { id: 'item-1', name: 'Updated Item', company_id: 'company-1' },
        databaseEntity: {
          id: 'item-1',
          name: 'Original Item',
          company_id: 'company-1',
        },
        metadata: { name: 'Item' },
      } as any;

      const log = createMockAuditLog({ action: AuditAction.UPDATE });
      repository.create.mockReturnValue(log);
      repository.save.mockResolvedValue(log);

      await subscriber.afterUpdate(mockEvent);

      expect(repository.create).toHaveBeenCalledWith({
        entity_name: 'Item',
        entity_id: 'item-1',
        company_id: 'company-1',
        project_id: null,
        action: AuditAction.UPDATE,
        old_value: mockEvent.databaseEntity,
        new_value: mockEvent.entity,
        description: expect.any(String),
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not create log if databaseEntity is missing', async () => {
      const mockEvent = {
        entity: { id: 'item-1', name: 'Updated' },
        databaseEntity: null,
        metadata: { name: 'Item' },
      } as any;

      await subscriber.afterUpdate(mockEvent);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('beforeRemove', () => {
    it('should create audit log for delete', async () => {
      const mockEvent = {
        entity: {
          id: 'item-1',
          name: 'Test Item',
          company_id: 'company-1',
          project_id: 'project-1',
        },
        entityId: 'item-1',
        metadata: { name: 'Item' },
      } as any;

      const log = createMockAuditLog({ action: AuditAction.DELETE });
      repository.create.mockReturnValue(log);
      repository.save.mockResolvedValue(log);

      await subscriber.beforeRemove(mockEvent);

      expect(repository.create).toHaveBeenCalledWith({
        entity_name: 'Item',
        entity_id: 'item-1',
        company_id: 'company-1',
        project_id: 'project-1',
        action: AuditAction.DELETE,
        old_value: mockEvent.entity,
        description: expect.any(String),
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not create log if entityId is missing', async () => {
      const mockEvent = {
        entity: { id: 'item-1', name: 'Test' },
        entityId: null,
        metadata: { name: 'Item' },
      } as any;

      await subscriber.beforeRemove(mockEvent);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
