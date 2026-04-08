import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

const mockService = {
  create: jest.fn(),
  bulkCreate: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findHistory: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
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
      ],
    }).compile();

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

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /bulk', () => {
    it('should bulk create resources', async () => {
      const items: any[] = [{ name: 'Resource A' }, { name: 'Resource B' }];
      const expected = [{ id: 'resource-1' }, { id: 'resource-2' }];
      mockService.bulkCreate.mockResolvedValue(expected);

      const result = await controller.bulkCreate(items);

      expect(mockService.bulkCreate).toHaveBeenCalledWith(items);
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

      const result = await controller.findOne('resource-1');

      expect(mockService.findOne).toHaveBeenCalledWith('resource-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id/history', () => {
    it('should return resource history', async () => {
      const expected = [{ id: 'history-1', action: 'created' }];
      mockService.findHistory.mockResolvedValue(expected);

      const result = await controller.getHistory('resource-1');

      expect(mockService.findHistory).toHaveBeenCalledWith('resource-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a resource', async () => {
      const updateDto: any = { name: 'Resource B' };
      const expected = { id: 'resource-1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update('resource-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('resource-1', updateDto);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a resource', async () => {
      mockService.remove.mockResolvedValue({ id: 'resource-1' });

      const result = await controller.remove('resource-1');

      expect(mockService.remove).toHaveBeenCalledWith('resource-1');
      expect(result).toEqual({ id: 'resource-1' });
    });
  });
});
