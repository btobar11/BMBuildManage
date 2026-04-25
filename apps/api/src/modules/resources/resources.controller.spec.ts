import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';

const mockService = {
  create: jest.fn(),
  bulkCreate: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findHistory: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('ResourcesController', () => {
  let controller: ResourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: mockService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-url') },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a resource', async () => {
      const createDto: any = { name: 'Resource A', type: 'material' };
      const expected = { id: 'resource-1', ...createDto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create('company-1', createDto);

      expect(mockService.create).toHaveBeenCalledWith('company-1', createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /bulk', () => {
    it('should bulk create resources', async () => {
      const items: any[] = [{ name: 'Resource A' }, { name: 'Resource B' }];
      const expected = [{ id: 'resource-1' }, { id: 'resource-2' }];
      mockService.bulkCreate.mockResolvedValue(expected);

      const result = await controller.bulkCreate('company-1', items);

      expect(mockService.bulkCreate).toHaveBeenCalledWith('company-1', items);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all resources by company and tab', async () => {
      const expected = [{ id: 'resource-1', name: 'Resource A' }];
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('company-1', 'materials');

      expect(mockService.findAll).toHaveBeenCalledWith({
        companyId: 'company-1',
        tab: 'materials',
      });
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single resource', async () => {
      const expected = { id: 'resource-1', name: 'Resource A' };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('company-1', 'resource-1');

      expect(mockService.findOne).toHaveBeenCalledWith('company-1', 'resource-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id/history', () => {
    it('should return resource history', async () => {
      const expected = [{ id: 'history-1', action: 'created' }];
      mockService.findHistory.mockResolvedValue(expected);

      const result = await controller.getHistory('company-1', 'resource-1');

      expect(mockService.findHistory).toHaveBeenCalledWith('company-1', 'resource-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a resource', async () => {
      const updateDto: any = { name: 'Resource B' };
      const expected = { id: 'resource-1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update('company-1', 'resource-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('company-1', 'resource-1', updateDto);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a resource', async () => {
      mockService.remove.mockResolvedValue({ id: 'resource-1' });

      const result = await controller.remove('company-1', 'resource-1');

      expect(mockService.remove).toHaveBeenCalledWith('company-1', 'resource-1');
      expect(result).toEqual({ id: 'resource-1' });
    });
  });
});
