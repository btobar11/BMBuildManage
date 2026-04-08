import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { StagesService } from './stages.service';
import { Stage } from './stage.entity';

const mockStage = (overrides = {}): Stage => ({
  id: 'test-id',
  budget_id: 'budget-1',
  name: 'Stage 1',
  position: 1,
  total_cost: 1000,
  total_price: 1500,
  items: [],
  created_at: new Date(),
  updated_at: new Date(),
  budget: {} as any,
  ...overrides,
});

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('StagesService', () => {
  let service: StagesService;
  let repository: jest.Mocked<Repository<Stage>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StagesService,
        { provide: getRepositoryToken(Stage), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<StagesService>(StagesService);
    repository = module.get(getRepositoryToken(Stage));
  });

  describe('create', () => {
    it('should create a stage', async () => {
      const createDto = {
        budget_id: 'budget-1',
        name: 'Stage 1',
        position: 1,
      };
      const stage = mockStage(createDto);
      repository.create.mockReturnValue(stage);
      repository.save.mockResolvedValue(stage);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(stage);
      expect(result).toEqual(stage);
    });
  });

  describe('findAllByBudget', () => {
    it('should return stages for a budget', async () => {
      const stages = [mockStage({ id: '1' }), mockStage({ id: '2' })];
      repository.find.mockResolvedValue(stages);

      const result = await service.findAllByBudget('budget-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { budget_id: 'budget-1' },
        relations: ['items'],
        order: { position: 'ASC' },
      });
      expect(result).toEqual(stages);
    });
  });

  describe('findOne', () => {
    it('should return a stage by id', async () => {
      const stage = mockStage();
      repository.findOne.mockResolvedValue(stage);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['items'],
      });
      expect(result).toEqual(stage);
    });

    it('should throw NotFoundException if stage not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a stage', async () => {
      const stage = mockStage();
      const updatedStage = { ...stage, name: 'Updated Stage' };
      repository.findOne.mockResolvedValue(stage);
      repository.merge.mockReturnValue(updatedStage);
      repository.save.mockResolvedValue(updatedStage);

      const result = await service.update('test-id', { name: 'Updated Stage' });
      expect(result.name).toBe('Updated Stage');
    });
  });

  describe('remove', () => {
    it('should remove a stage', async () => {
      const stage = mockStage();
      repository.findOne.mockResolvedValue(stage);
      repository.remove.mockResolvedValue(stage);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(stage);
      expect(result).toEqual({ deleted: true });
    });
  });
});
