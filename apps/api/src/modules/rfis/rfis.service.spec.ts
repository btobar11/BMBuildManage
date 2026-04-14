import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RfisService } from './rfis.service';
import { Rfi, RfiStatus } from './rfi.entity';

const mockRfi = (overrides = {}): Rfi =>
  ({
    id: 'rfi-1',
    project_id: 'project-1',
    company_id: 'company-1',
    title: 'Test RFI',
    question: 'What is the spec?',
    answer: undefined,
    submitted_by: 'user-1',
    answered_by: undefined,
    due_date: new Date('2026-12-31'),
    answered_at: undefined,
    status: RfiStatus.SUBMITTED,
    priority: 'medium' as any,
    category: 'technical',
    created_at: new Date(),
    updated_at: new Date(),
    project: {} as any,
    ...overrides,
  }) as unknown as Rfi;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('RfisService', () => {
  let service: RfisService;
  let repository: jest.Mocked<Repository<Rfi>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfisService,
        { provide: getRepositoryToken(Rfi), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<RfisService>(RfisService);
    repository = module.get(getRepositoryToken(Rfi));
  });

  describe('create', () => {
    it('should create an RFI', async () => {
      const createDto = {
        project_id: 'project-1',
        title: 'Test RFI',
        question: 'What is the spec?',
        status: RfiStatus.DRAFT,
      };
      const rfi = mockRfi(createDto);
      repository.create.mockReturnValue(rfi);
      repository.save.mockResolvedValue(rfi);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(rfi);
      expect(result).toEqual(rfi);
    });
  });

  describe('findAll', () => {
    it('should return all RFIs for a project', async () => {
      const rfis = [mockRfi({ id: '1' }), mockRfi({ id: '2' })];
      repository.find.mockResolvedValue(rfis);

      const result = await service.findAll('project-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(rfis);
    });

    it('should return empty array when no RFIs exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll('project-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an RFI by id', async () => {
      const rfi = mockRfi();
      repository.findOne.mockResolvedValue(rfi);

      const result = await service.findOne('rfi-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'rfi-1' },
      });
      expect(result).toEqual(rfi);
    });

    it('should throw NotFoundException if RFI not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an RFI', async () => {
      const rfi = mockRfi({ title: 'Old Title' });
      const updatedRfi = { ...rfi, title: 'New Title' };
      repository.findOne.mockResolvedValue(rfi);
      repository.save.mockResolvedValue(updatedRfi);

      const result = await service.update('rfi-1', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });
  });

  describe('remove', () => {
    it('should remove an RFI', async () => {
      const rfi = mockRfi();
      repository.findOne.mockResolvedValue(rfi);
      repository.remove.mockResolvedValue(rfi);

      await service.remove('rfi-1');
      expect(repository.remove).toHaveBeenCalledWith(rfi);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      const rfis = [
        mockRfi({
          status: RfiStatus.SUBMITTED,
          due_date: new Date('2026-12-31'),
        }),
        mockRfi({
          status: RfiStatus.SUBMITTED,
          due_date: new Date('2025-01-01'),
        }),
        mockRfi({ status: RfiStatus.CLOSED }),
        mockRfi({ status: RfiStatus.UNDER_REVIEW }),
      ];
      repository.find.mockResolvedValue(rfis);

      const result = await service.getStats('project-1');
      expect(result.total).toBe(4);
      expect(result.open).toBe(3);
      expect(result.closed).toBe(1);
      expect(result.overdue).toBe(1);
    });

    it('should return zero stats for empty project', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getStats('project-1');
      expect(result.total).toBe(0);
      expect(result.open).toBe(0);
      expect(result.closed).toBe(0);
      expect(result.overdue).toBe(0);
    });
  });
});
