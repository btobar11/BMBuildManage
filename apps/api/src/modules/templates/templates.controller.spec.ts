import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<TemplatesController>(TemplatesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a template', async () => {
      const createDto: any = { name: 'Template A', company_id: 'company-1' };
      const expected = { id: 'template-1', ...createDto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create('company-1', createDto);

      expect(mockService.create).toHaveBeenCalledWith('company-1', createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all templates by company', async () => {
      const expected = [{ id: 'template-1', name: 'Template A' }];
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('company-1');

      expect(mockService.findAll).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single template', async () => {
      const expected = { id: 'template-1', name: 'Template A' };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('company-1', 'template-1');

      expect(mockService.findOne).toHaveBeenCalledWith(
        'template-1',
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a template', async () => {
      const updateDto: any = { name: 'Template B' };
      const expected = { id: 'template-1', ...updateDto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update(
        'company-1',
        'template-1',
        updateDto,
      );

      expect(mockService.update).toHaveBeenCalledWith(
        'template-1',
        'company-1',
        updateDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a template', async () => {
      mockService.remove.mockResolvedValue({ id: 'template-1' });

      const result = await controller.remove('company-1', 'template-1');

      expect(mockService.remove).toHaveBeenCalledWith(
        'template-1',
        'company-1',
      );
      expect(result).toEqual({ id: 'template-1' });
    });
  });
});
