import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PunchListService } from './punch-list.service';
import { PunchItem, PunchItemStatus } from './punch-item.entity';

const mockPunchItem = (overrides = {}): PunchItem => ({
  id: 'punch-1',
  project_id: 'project-1',
  company_id: 'company-1',
  title: 'Fix wall crack',
  description: 'Crack in hallway',
  status: PunchItemStatus.OPEN,
  priority: 'medium' as any,
  location: 'Hallway',
  reported_by: 'user-1',
  assigned_to: undefined,
  due_date: undefined,
  completed_date: undefined,
  photo_url: undefined,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
} as unknown as PunchItem);

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('PunchListService', () => {
  let service: PunchListService;
  let repository: jest.Mocked<Repository<PunchItem>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PunchListService,
        { provide: getRepositoryToken(PunchItem), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<PunchListService>(PunchListService);
    repository = module.get(getRepositoryToken(PunchItem));
  });

  describe('create', () => {
    it('should create a punch item', async () => {
      const data = {
        project_id: 'project-1',
        title: 'Fix wall crack',
        status: PunchItemStatus.OPEN,
      };
      const item = mockPunchItem(data);
      repository.create.mockReturnValue(item);
      repository.save.mockResolvedValue(item);

      const result = await service.create(data);
      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(item);
      expect(result).toEqual(item);
    });
  });

  describe('findAll', () => {
    it('should return all punch items for a project', async () => {
      const items = [mockPunchItem({ id: '1' }), mockPunchItem({ id: '2' })];
      repository.find.mockResolvedValue(items);

      const result = await service.findAll('project-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(items);
    });

    it('should return empty array when no items exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll('project-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a punch item by id', async () => {
      const item = mockPunchItem();
      repository.findOne.mockResolvedValue(item);

      const result = await service.findOne('punch-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'punch-1' },
      });
      expect(result).toEqual(item);
    });

    it('should throw NotFoundException if item not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a punch item', async () => {
      const item = mockPunchItem({ title: 'Old Title' });
      const updatedItem = { ...item, title: 'New Title' };
      repository.findOne.mockResolvedValue(item);
      repository.save.mockResolvedValue(updatedItem);

      const result = await service.update('punch-1', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });
  });

  describe('remove', () => {
    it('should remove a punch item', async () => {
      const item = mockPunchItem();
      repository.findOne.mockResolvedValue(item);
      repository.remove.mockResolvedValue(item);

      await service.remove('punch-1');
      expect(repository.remove).toHaveBeenCalledWith(item);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      const items = [
        mockPunchItem({ status: PunchItemStatus.OPEN }),
        mockPunchItem({ status: PunchItemStatus.IN_PROGRESS }),
        mockPunchItem({ status: PunchItemStatus.IN_PROGRESS }),
        mockPunchItem({ status: PunchItemStatus.VERIFIED }),
        mockPunchItem({ status: PunchItemStatus.CLOSED }),
      ];
      repository.find.mockResolvedValue(items);

      const result = await service.getStats('project-1');
      expect(result.total).toBe(5);
      expect(result.open).toBe(1);
      expect(result.inProgress).toBe(2);
      expect(result.verified).toBe(1);
      expect(result.closed).toBe(1);
    });

    it('should return zero stats for empty project', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getStats('project-1');
      expect(result.total).toBe(0);
      expect(result.open).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.verified).toBe(0);
      expect(result.closed).toBe(0);
    });
  });
});
