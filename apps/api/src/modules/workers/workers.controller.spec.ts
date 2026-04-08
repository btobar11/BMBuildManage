import { Test, TestingModule } from '@nestjs/testing';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockWorkersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('WorkersController', () => {
  let controller: WorkersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [{ provide: WorkersService, useValue: mockWorkersService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<WorkersController>(WorkersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all workers for a company', async () => {
      const mockWorkers = [{ id: 'worker-1' }, { id: 'worker-2' }];
      mockWorkersService.findAll.mockResolvedValue(mockWorkers);

      const result = await controller.findAll({
        user: { company_id: 'company-1' },
      });

      expect(mockWorkersService.findAll).toHaveBeenCalledWith(
        'company-1',
        undefined,
      );
      expect(result).toEqual(mockWorkers);
    });

    it('should filter workers by project_id', async () => {
      const mockWorkers = [{ id: 'worker-1', project_id: 'project-1' }];
      mockWorkersService.findAll.mockResolvedValue(mockWorkers);

      const result = await controller.findAll(
        { user: { company_id: 'company-1' } },
        'project-1',
      );

      expect(mockWorkersService.findAll).toHaveBeenCalledWith(
        'company-1',
        'project-1',
      );
      expect(result).toEqual(mockWorkers);
    });
  });

  describe('create', () => {
    it('should create a worker', async () => {
      const createDto = { name: 'John Doe', role: 'Carpenter' } as any;
      const mockWorker = {
        id: 'worker-1',
        ...createDto,
        company_id: 'company-1',
      };
      mockWorkersService.create.mockResolvedValue(mockWorker);

      const result = await controller.create(createDto, {
        user: { company_id: 'company-1' },
      });

      expect(createDto.company_id).toBe('company-1');
      expect(mockWorkersService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockWorker);
    });
  });

  describe('findOne', () => {
    it('should return a worker by id', async () => {
      const mockWorker = { id: 'worker-1', name: 'John Doe' };
      mockWorkersService.findOne.mockResolvedValue(mockWorker);

      const result = await controller.findOne('worker-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockWorkersService.findOne).toHaveBeenCalledWith(
        'worker-1',
        'company-1',
      );
      expect(result).toEqual(mockWorker);
    });
  });

  describe('update', () => {
    it('should update a worker', async () => {
      const updateDto = { name: 'Jane Doe' };
      const mockWorker = { id: 'worker-1', ...updateDto };
      mockWorkersService.update.mockResolvedValue(mockWorker);

      const result = await controller.update(
        'worker-1',
        { user: { company_id: 'company-1' } },
        updateDto,
      );

      expect(mockWorkersService.update).toHaveBeenCalledWith(
        'worker-1',
        'company-1',
        updateDto,
      );
      expect(result).toEqual(mockWorker);
    });
  });

  describe('remove', () => {
    it('should remove a worker', async () => {
      mockWorkersService.remove.mockResolvedValue({ id: 'worker-1' });

      const result = await controller.remove('worker-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockWorkersService.remove).toHaveBeenCalledWith(
        'worker-1',
        'company-1',
      );
      expect(result).toEqual({ id: 'worker-1' });
    });
  });
});
