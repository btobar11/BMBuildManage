import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubmittalsService } from './submittals.service';
import { Submittal, SubmittalStatus } from './submittal.entity';

const createMockSubmittal = (overrides?: Partial<Submittal>): Submittal =>
  ({
    id: 'submittal-1',
    project_id: 'project-1',
    number: 'S-001',
    title: 'Test Submittal',
    description: 'Test Description',
    status: SubmittalStatus.DRAFT,
    submittal_date: new Date(),
    due_date: new Date(),
    received_date: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as Submittal;

const mockSubmittalRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('SubmittalsService', () => {
  let service: SubmittalsService;
  let submittalRepo: jest.Mocked<Repository<Submittal>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmittalsService,
        {
          provide: getRepositoryToken(Submittal),
          useFactory: mockSubmittalRepository,
        },
      ],
    }).compile();

    service = module.get<SubmittalsService>(SubmittalsService);
    submittalRepo = module.get(getRepositoryToken(Submittal));
  });

  describe('create', () => {
    it('should create a submittal', async () => {
      const data = {
        project_id: 'project-1',
        title: 'New Submittal',
        number: 'S-002',
      };
      const submittal = createMockSubmittal(data);
      submittalRepo.create.mockReturnValue(submittal);
      submittalRepo.save.mockResolvedValue(submittal);

      const result = await service.create(data);

      expect(submittalRepo.create).toHaveBeenCalledWith(data);
      expect(submittalRepo.save).toHaveBeenCalled();
      expect(result).toEqual(submittal);
    });
  });

  describe('findAll', () => {
    it('should return all submittals for a project', async () => {
      const submittals = [
        createMockSubmittal(),
        createMockSubmittal({ id: 'submittal-2' }),
      ];
      submittalRepo.find.mockResolvedValue(submittals);

      const result = await service.findAll('project-1');

      expect(submittalRepo.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(submittals);
    });
  });

  describe('findOne', () => {
    it('should return a submittal by id', async () => {
      const submittal = createMockSubmittal();
      submittalRepo.findOne.mockResolvedValue(submittal);

      const result = await service.findOne('submittal-1');

      expect(submittalRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'submittal-1' },
      });
      expect(result).toEqual(submittal);
    });

    it('should throw NotFoundException if submittal not found', async () => {
      submittalRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a submittal', async () => {
      const submittal = createMockSubmittal();
      const updated = { ...submittal, title: 'Updated Title' };
      submittalRepo.findOne.mockResolvedValue(submittal);
      submittalRepo.save.mockResolvedValue(updated);

      const result = await service.update('submittal-1', {
        title: 'Updated Title',
      });

      expect(submittalRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'submittal-1' },
      });
      expect(submittalRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when updating nonexistent', async () => {
      submittalRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a submittal', async () => {
      const submittal = createMockSubmittal();
      submittalRepo.findOne.mockResolvedValue(submittal);
      submittalRepo.remove.mockResolvedValue(submittal);

      await service.remove('submittal-1');

      expect(submittalRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'submittal-1' },
      });
      expect(submittalRepo.remove).toHaveBeenCalledWith(submittal);
    });

    it('should throw NotFoundException when removing nonexistent', async () => {
      submittalRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    it('should return stats for a project', async () => {
      const submittals = [
        createMockSubmittal({ status: SubmittalStatus.DRAFT }),
        createMockSubmittal({ status: SubmittalStatus.SUBMITTED }),
        createMockSubmittal({ status: SubmittalStatus.UNDER_REVIEW }),
        createMockSubmittal({ status: SubmittalStatus.APPROVED }),
        createMockSubmittal({ status: SubmittalStatus.REJECTED }),
      ];
      submittalRepo.find.mockResolvedValue(submittals);

      const result = await service.getStats('project-1');

      expect(result.total).toBe(5);
      expect(result.pending).toBe(3);
      expect(result.approved).toBe(1);
      expect(result.rejected).toBe(1);
    });

    it('should handle empty submittals', async () => {
      submittalRepo.find.mockResolvedValue([]);

      const result = await service.getStats('project-1');

      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.approved).toBe(0);
      expect(result.rejected).toBe(0);
    });
  });
});
