import { Test, TestingModule } from '@nestjs/testing';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockStagesService = {
  create: jest.fn(),
  findAllByBudget: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('StagesController', () => {
  let controller: StagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StagesController],
      providers: [{ provide: StagesService, useValue: mockStagesService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<StagesController>(StagesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return stages by budget_id', async () => {
      const mockStages = [{ id: 'stage-1' }, { id: 'stage-2' }];
      mockStagesService.findAllByBudget.mockResolvedValue(mockStages);

      const result = await controller.findAll('budget-1');

      expect(mockStagesService.findAllByBudget).toHaveBeenCalledWith(
        'budget-1',
      );
      expect(result).toEqual(mockStages);
    });
  });

  describe('create', () => {
    it('should create a stage', async () => {
      const createDto = { budget_id: 'budget-1', name: 'Stage 1' };
      const mockStage = { id: 'stage-1', ...createDto };
      mockStagesService.create.mockResolvedValue(mockStage);

      const result = await controller.create(createDto);

      expect(mockStagesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockStage);
    });
  });

  describe('findOne', () => {
    it('should return a stage by id', async () => {
      const mockStage = { id: 'stage-1', name: 'Stage 1' };
      mockStagesService.findOne.mockResolvedValue(mockStage);

      const result = await controller.findOne('stage-1');

      expect(mockStagesService.findOne).toHaveBeenCalledWith('stage-1');
      expect(result).toEqual(mockStage);
    });
  });

  describe('update', () => {
    it('should update a stage', async () => {
      const updateDto = { name: 'Updated Stage' };
      const mockStage = { id: 'stage-1', ...updateDto };
      mockStagesService.update.mockResolvedValue(mockStage);

      const result = await controller.update('stage-1', updateDto);

      expect(mockStagesService.update).toHaveBeenCalledWith(
        'stage-1',
        updateDto,
      );
      expect(result).toEqual(mockStage);
    });
  });

  describe('remove', () => {
    it('should remove a stage', async () => {
      mockStagesService.remove.mockResolvedValue({ id: 'stage-1' });

      const result = await controller.remove('stage-1');

      expect(mockStagesService.remove).toHaveBeenCalledWith('stage-1');
      expect(result).toEqual({ id: 'stage-1' });
    });
  });
});
