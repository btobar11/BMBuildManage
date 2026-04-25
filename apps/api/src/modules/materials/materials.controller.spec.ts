import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';

describe('MaterialsController', () => {
  let controller: MaterialsController;
  let service: MaterialsService;

  const mockMaterialsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialsController],
      providers: [
        {
          provide: MaterialsService,
          useValue: mockMaterialsService,
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

    controller = module.get<MaterialsController>(MaterialsController);
    service = module.get<MaterialsService>(MaterialsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create material', async () => {
      const createDto: any = { name: 'Cement', unit_id: 'unit-1' };
      const expected = { id: 'material-1', ...createDto };
      mockMaterialsService.create.mockResolvedValue(expected);

      const result = await controller.create('company-1', createDto);

      expect(mockMaterialsService.create).toHaveBeenCalledWith('company-1', createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all materials', async () => {
      const expected = [{ id: 'material-1', name: 'Cement' }];
      mockMaterialsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('company-1', 'cement');

      expect(mockMaterialsService.findAll).toHaveBeenCalledWith('company-1', 'cement');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single material', async () => {
      const expected = { id: 'material-1', name: 'Cement' };
      mockMaterialsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('company-1', 'material-1');

      expect(mockMaterialsService.findOne).toHaveBeenCalledWith('company-1', 'material-1');
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove material', async () => {
      mockMaterialsService.remove.mockResolvedValue({ id: 'material-1' });

      const result = await controller.remove('company-1', 'material-1');

      expect(mockMaterialsService.remove).toHaveBeenCalledWith('company-1', 'material-1');
      expect(result).toEqual({ id: 'material-1' });
    });
  });
});
