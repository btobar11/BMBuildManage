import { Test, TestingModule } from '@nestjs/testing';
import { ApuController } from './apu.controller';
import { ApuService } from './apu.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockApuService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  duplicate: jest.fn(),
  importGlobalLibrary: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('ApuController', () => {
  let controller: ApuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApuController],
      providers: [{ provide: ApuService, useValue: mockApuService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ApuController>(ApuController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an APU template', async () => {
      const dto = { name: 'Test APU', unit_id: 'unit-1' };
      const mockResult = { id: 'apu-1', ...dto };
      mockApuService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(mockApuService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('importMany', () => {
    it('should import multiple APU templates', async () => {
      const dtos = [{ name: 'APU 1' }, { name: 'APU 2' }];
      const mockResults: any[] = [{ id: 'apu-1' }, { id: 'apu-2' }];
      mockApuService.create
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await controller.importMany(dtos);

      expect(mockApuService.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResults);
    });
  });

  describe('importGlobalLibrary', () => {
    it('should import global library for company', async () => {
      const mockResult = { imported: 10, total: 20 };
      mockApuService.importGlobalLibrary.mockResolvedValue(mockResult);

      const result = await controller.importGlobalLibrary('company-1');

      expect(mockApuService.importGlobalLibrary).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all APU templates', async () => {
      const mockResults = [{ id: 'apu-1' }, { id: 'apu-2' }];
      mockApuService.findAll.mockResolvedValue(mockResults);

      const result = await controller.findAll('company-1', 'test', 'personal');

      expect(mockApuService.findAll).toHaveBeenCalledWith(
        'company-1',
        'test',
        'personal',
      );
      expect(result).toEqual(mockResults);
    });

    it('should return all without filters', async () => {
      const mockResults = [];
      mockApuService.findAll.mockResolvedValue(mockResults);

      const result = await controller.findAll(undefined, undefined, undefined);

      expect(mockApuService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('findOne', () => {
    it('should return a single APU template', async () => {
      const mockResult = { id: 'apu-1', name: 'Test APU' };
      mockApuService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('apu-1');

      expect(mockApuService.findOne).toHaveBeenCalledWith('apu-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('duplicate', () => {
    it('should duplicate an APU template', async () => {
      const mockResult = { id: 'apu-2', name: 'Test APU (copia)' };
      mockApuService.duplicate.mockResolvedValue(mockResult);

      const result = await controller.duplicate('apu-1');

      expect(mockApuService.duplicate).toHaveBeenCalledWith('apu-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update an APU template', async () => {
      const dto = { name: 'Updated APU' };
      const mockResult = { id: 'apu-1', ...dto };
      mockApuService.update.mockResolvedValue(mockResult);

      const result = await controller.update('apu-1', dto);

      expect(mockApuService.update).toHaveBeenCalledWith('apu-1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should remove an APU template', async () => {
      const mockResult = { deleted: true };
      mockApuService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('apu-1');

      expect(mockApuService.remove).toHaveBeenCalledWith('apu-1');
      expect(result).toEqual(mockResult);
    });
  });
});
