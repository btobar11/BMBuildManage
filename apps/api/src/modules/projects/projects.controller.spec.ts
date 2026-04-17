import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockProjectsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  bulkRemove: jest.fn(),
  bulkUpdateFolder: jest.fn(),
  addPayment: jest.fn(),
  findPayments: jest.fn(),
  removePayment: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all projects for a company', async () => {
      const mockProjects = [{ id: 'project-1' }, { id: 'project-2' }];
      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      const result = await controller.findAll({
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.findAll).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockProjects);
    });
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto = {
        name: 'Test Project',
        address: 'Test Address',
      } as any;
      const mockProject = {
        id: 'project-1',
        ...createDto,
        company_id: 'company-1',
      };
      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto, {
        user: { company_id: 'company-1' },
      });

      expect(createDto.company_id).toBe('company-1');
      expect(mockProjectsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProject);
    });

    it('should handle create error with validation issues', async () => {
      const error = {
        message: 'Validation failed',
        response: {
          error: { issues: [{ field: 'name', message: 'Required' }] },
        },
      };
      mockProjectsService.create.mockRejectedValue(error);

      await expect(
        controller.create({ name: '' } as any, {
          user: { company_id: 'company-1' },
        }),
      ).rejects.toThrow();
    });

    it('should handle create error with message', async () => {
      const error = {
        message: 'Bad request',
        response: { message: 'Invalid data' },
      };
      mockProjectsService.create.mockRejectedValue(error);

      await expect(
        controller.create({ name: 'Test' } as any, {
          user: { company_id: 'company-1' },
        }),
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all projects for a company', async () => {
      const mockProjects = [{ id: 'project-1' }, { id: 'project-2' }];
      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      const result = await controller.findAll({
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.findAll).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockProjects);
    });

    it('should handle findAll error', async () => {
      mockProjectsService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(
        controller.findAll({ user: { company_id: 'company-1' } }),
      ).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const mockProject = { id: 'project-1', name: 'Test Project' };
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('project-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(
        'project-1',
        'company-1',
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project' };
      const mockProject = { id: 'project-1', ...updateDto };
      mockProjectsService.update.mockResolvedValue(mockProject);

      const result = await controller.update('project-1', updateDto, {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        'project-1',
        'company-1',
        updateDto,
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      mockProjectsService.remove.mockResolvedValue({ id: 'project-1' });

      const result = await controller.remove('project-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        'project-1',
        'company-1',
      );
      expect(result).toEqual({ id: 'project-1' });
    });
  });

  describe('bulkRemove', () => {
    it('should delete multiple projects', async () => {
      const ids = ['project-1', 'project-2'];
      mockProjectsService.bulkRemove.mockResolvedValue({ deleted: 2 });

      const result = await controller.bulkRemove(ids, {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.bulkRemove).toHaveBeenCalledWith(
        ids,
        'company-1',
      );
      expect(result).toEqual({ deleted: 2 });
    });
  });

  describe('bulkUpdateFolder', () => {
    it('should update folder for multiple projects', async () => {
      const data = { ids: ['project-1', 'project-2'], folder: 'new-folder' };
      mockProjectsService.bulkUpdateFolder.mockResolvedValue({ updated: 2 });

      const result = await controller.bulkUpdateFolder(data, {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.bulkUpdateFolder).toHaveBeenCalledWith(
        data.ids,
        data.folder,
        'company-1',
      );
      expect(result).toEqual({ updated: 2 });
    });

    it('should update folder to null', async () => {
      const data = { ids: ['project-1'], folder: null };
      mockProjectsService.bulkUpdateFolder.mockResolvedValue({ updated: 1 });

      const result = await controller.bulkUpdateFolder(data, {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.bulkUpdateFolder).toHaveBeenCalledWith(
        data.ids,
        null,
        'company-1',
      );
      expect(result).toEqual({ updated: 1 });
    });
  });

  describe('addPayment', () => {
    it('should add a payment to a project', async () => {
      const paymentData = { amount: 10000, date: new Date() };
      const mockPayment = { id: 'payment-1', ...paymentData };
      mockProjectsService.addPayment.mockResolvedValue(mockPayment);

      const result = await controller.addPayment('project-1', paymentData, {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.addPayment).toHaveBeenCalledWith(
        'project-1',
        'company-1',
        paymentData,
      );
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findPayments', () => {
    it('should return payments for a project', async () => {
      const mockPayments = [
        { id: 'payment-1', amount: 10000 },
        { id: 'payment-2', amount: 20000 },
      ];
      mockProjectsService.findPayments.mockResolvedValue(mockPayments);

      const result = await controller.findPayments('project-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.findPayments).toHaveBeenCalledWith(
        'project-1',
        'company-1',
      );
      expect(result).toEqual(mockPayments);
    });
  });

  describe('removePayment', () => {
    it('should remove a payment', async () => {
      mockProjectsService.removePayment.mockResolvedValue({ id: 'payment-1' });

      const result = await controller.removePayment('payment-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockProjectsService.removePayment).toHaveBeenCalledWith(
        'payment-1',
        'company-1',
      );
      expect(result).toEqual({ id: 'payment-1' });
    });
  });
});
