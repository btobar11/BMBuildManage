import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  const mockItemsService = {
    create: jest.fn(),
    findAllByStage: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create an item', async () => {
      const createDto = { name: 'Test Item', stage_id: 'stage-1' };
      const expected = { id: 'item-1', ...createDto };
      mockItemsService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockItemsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all items by stage', async () => {
      const expected = [{ id: 'item-1', name: 'Item 1' }];
      mockItemsService.findAllByStage.mockResolvedValue(expected);

      const result = await controller.findAll('stage-1');

      expect(mockItemsService.findAllByStage).toHaveBeenCalledWith('stage-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single item', async () => {
      const expected = { id: 'item-1', name: 'Item 1' };
      mockItemsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('item-1');

      expect(mockItemsService.findOne).toHaveBeenCalledWith('item-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update an item', async () => {
      const updateDto = { name: 'Updated Item' };
      const expected = { id: 'item-1', ...updateDto };
      const req = { user: { id: 'user-1', company_id: 'company-1' } };
      mockItemsService.update.mockResolvedValue(expected);

      const result = await controller.update('item-1', updateDto, req);

      expect(mockItemsService.update).toHaveBeenCalledWith(
        'item-1',
        updateDto,
        'user-1',
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove an item', async () => {
      mockItemsService.remove.mockResolvedValue({ id: 'item-1' });

      const result = await controller.remove('item-1');

      expect(mockItemsService.remove).toHaveBeenCalledWith('item-1');
      expect(result).toEqual({ id: 'item-1' });
    });
  });
});
