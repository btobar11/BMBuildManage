import { Test, TestingModule } from '@nestjs/testing';
import { SubmittalsController } from './submittals.controller';
import { SubmittalsService } from './submittals.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('SubmittalsController', () => {
  let controller: SubmittalsController;
  let service: SubmittalsService;

  const mockSubmittalsService = {
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
      controllers: [SubmittalsController],
      providers: [
        {
          provide: SubmittalsService,
          useValue: mockSubmittalsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SubmittalsController>(SubmittalsController);
    service = module.get<SubmittalsService>(SubmittalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a submittal', async () => {
      const data: any = { project_id: 'proj-1', title: 'Test Submittal' };
      const expected = { id: 'sub-1', ...data };
      mockSubmittalsService.create.mockResolvedValue(expected);

      const result = await controller.create(data);

      expect(mockSubmittalsService.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all submittals by project', async () => {
      const expected = [{ id: 'sub-1', title: 'Submittal 1' }];
      mockSubmittalsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockSubmittalsService.findAll).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /stats', () => {
    it('should return submittal stats', async () => {
      const expected = { total: 10, pending: 3, approved: 7 };
      mockSubmittalsService.getStats.mockResolvedValue(expected);

      const result = await controller.getStats('proj-1');

      expect(mockSubmittalsService.getStats).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single submittal', async () => {
      const expected = { id: 'sub-1', title: 'Test Submittal' };
      mockSubmittalsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('sub-1');

      expect(mockSubmittalsService.findOne).toHaveBeenCalledWith('sub-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a submittal', async () => {
      const data = { status: 'approved' };
      const expected = { id: 'sub-1', ...data };
      mockSubmittalsService.update.mockResolvedValue(expected);

      const result = await controller.update('sub-1', data);

      expect(mockSubmittalsService.update).toHaveBeenCalledWith('sub-1', data);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a submittal', async () => {
      mockSubmittalsService.remove.mockResolvedValue({ id: 'sub-1' });

      const result = await controller.remove('sub-1');

      expect(mockSubmittalsService.remove).toHaveBeenCalledWith('sub-1');
      expect(result).toEqual({ id: 'sub-1' });
    });
  });
});
