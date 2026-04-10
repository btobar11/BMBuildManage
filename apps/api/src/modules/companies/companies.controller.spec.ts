import { Test, TestingModule } from '@nestjs/testing';
import {
  CompaniesController,
  IsUUIDValidationPipe,
} from './companies.controller';
import { CompaniesService } from './companies.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockCompaniesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('CompaniesController', () => {
  let controller: CompaniesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a company', async () => {
      const createDto: any = { name: 'Company A', ruc: '12345678' };
      const expected = { id: 'company-1', ...createDto };
      mockCompaniesService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockCompaniesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all companies', async () => {
      const expected = [{ id: 'company-1', name: 'Company A' }];
      mockCompaniesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(mockCompaniesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single company', async () => {
      const expected = { id: 'company-1', name: 'Company A' };
      mockCompaniesService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('company-1', {
        user: { company_id: 'company-1' },
      });

      expect(mockCompaniesService.findOne).toHaveBeenCalledWith(
        'company-1',
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a company', async () => {
      const updateDto: any = { name: 'Company B' };
      const expected = { id: 'company-1', ...updateDto };
      mockCompaniesService.update.mockResolvedValue(expected);

      const result = await controller.update('company-1', updateDto, {
        user: { company_id: 'company-1' },
      });

      expect(mockCompaniesService.update).toHaveBeenCalledWith(
        'company-1',
        updateDto,
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a company', async () => {
      mockCompaniesService.remove.mockResolvedValue({ id: 'company-1' });

      const result = await controller.remove('company-1');

      expect(mockCompaniesService.remove).toHaveBeenCalledWith('company-1');
      expect(result).toEqual({ id: 'company-1' });
    });
  });

  describe('IsUUIDValidationPipe', () => {
    it('should return value for valid UUID', () => {
      const pipe = new IsUUIDValidationPipe();
      const result = pipe.transform('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw BadRequestException for invalid UUID', () => {
      const pipe = new IsUUIDValidationPipe();
      expect(() => pipe.transform('invalid-uuid')).toThrow();
    });
  });
});
