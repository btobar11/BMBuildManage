import { Test, TestingModule } from '@nestjs/testing';
import { PunchListController } from './punch-list.controller';
import { PunchListService } from './punch-list.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('PunchListController', () => {
  let controller: PunchListController;
  let service: PunchListService;

  const mockPunchListService = {
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
      controllers: [PunchListController],
      providers: [
        {
          provide: PunchListService,
          useValue: mockPunchListService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<PunchListController>(PunchListController);
    service = module.get<PunchListService>(PunchListService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a punch item', async () => {
      const data: any = { project_id: 'proj-1', description: 'Test Item' };
      const expected = { id: 'punch-1', ...data };
      mockPunchListService.create.mockResolvedValue(expected);

      const result = await controller.create(data);

      expect(mockPunchListService.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all punch items by project', async () => {
      const expected = [{ id: 'punch-1', description: 'Item 1' }];
      mockPunchListService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockPunchListService.findAll).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /stats', () => {
    it('should return punch list stats', async () => {
      const expected = { total: 10, open: 3, closed: 7 };
      mockPunchListService.getStats.mockResolvedValue(expected);

      const result = await controller.getStats('proj-1');

      expect(mockPunchListService.getStats).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single punch item', async () => {
      const expected = { id: 'punch-1', description: 'Test Item' };
      mockPunchListService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('punch-1');

      expect(mockPunchListService.findOne).toHaveBeenCalledWith('punch-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a punch item', async () => {
      const data = { status: 'resolved' };
      const expected = { id: 'punch-1', ...data };
      mockPunchListService.update.mockResolvedValue(expected);

      const result = await controller.update('punch-1', data);

      expect(mockPunchListService.update).toHaveBeenCalledWith('punch-1', data);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a punch item', async () => {
      mockPunchListService.remove.mockResolvedValue({ id: 'punch-1' });

      const result = await controller.remove('punch-1');

      expect(mockPunchListService.remove).toHaveBeenCalledWith('punch-1');
      expect(result).toEqual({ id: 'punch-1' });
    });
  });
});
