import { Test, TestingModule } from '@nestjs/testing';
import { RfisController } from './rfis.controller';
import { RfisService } from './rfis.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('RfisController', () => {
  let controller: RfisController;
  let service: RfisService;

  const mockRfisService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getStats: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfisController],
      providers: [
        {
          provide: RfisService,
          useValue: mockRfisService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<RfisController>(RfisController);
    service = module.get<RfisService>(RfisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create an RFI', async () => {
      const createDto: any = { project_id: 'proj-1', subject: 'Test RFI' };
      const expected = { id: 'rfi-1', ...createDto };
      mockRfisService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockRfisService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all RFIs by project', async () => {
      const expected = [{ id: 'rfi-1', subject: 'RFI 1' }];
      mockRfisService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockRfisService.findAll).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /stats', () => {
    it('should return RFI stats', async () => {
      const expected = { total: 10, open: 5, closed: 5 };
      mockRfisService.getStats.mockResolvedValue(expected);

      const result = await controller.getStats('proj-1');

      expect(mockRfisService.getStats).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single RFI', async () => {
      const expected = { id: 'rfi-1', subject: 'Test RFI' };
      mockRfisService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('rfi-1');

      expect(mockRfisService.findOne).toHaveBeenCalledWith('rfi-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update an RFI', async () => {
      const updateDto: any = { status: 'closed' };
      const expected = { id: 'rfi-1', ...updateDto };
      mockRfisService.update.mockResolvedValue(expected);

      const result = await controller.update('rfi-1', updateDto);

      expect(mockRfisService.update).toHaveBeenCalledWith('rfi-1', updateDto);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an RFI', async () => {
      mockRfisService.remove.mockResolvedValue({ id: 'rfi-1' });

      const result = await controller.remove('rfi-1');

      expect(mockRfisService.remove).toHaveBeenCalledWith('rfi-1');
      expect(result).toEqual({ id: 'rfi-1' });
    });
  });
});
