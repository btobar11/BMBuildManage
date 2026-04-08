import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockClientsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a client', async () => {
      const createDto: any = { name: 'Client A', email: 'client@test.com' };
      const expected = { id: 'client-1', ...createDto };
      mockClientsService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockClientsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all clients by company', async () => {
      const expected = [{ id: 'client-1', name: 'Client A' }];
      mockClientsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('company-1');

      expect(mockClientsService.findAll).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single client', async () => {
      const expected = { id: 'client-1', name: 'Client A' };
      mockClientsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('client-1', 'company-1');

      expect(mockClientsService.findOne).toHaveBeenCalledWith(
        'client-1',
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a client', async () => {
      const updateDto: any = { name: 'Client B' };
      const expected = { id: 'client-1', ...updateDto };
      mockClientsService.update.mockResolvedValue(expected);

      const result = await controller.update(
        'client-1',
        'company-1',
        updateDto,
      );

      expect(mockClientsService.update).toHaveBeenCalledWith(
        'client-1',
        'company-1',
        updateDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a client', async () => {
      mockClientsService.remove.mockResolvedValue({ id: 'client-1' });

      const result = await controller.remove('client-1', 'company-1');

      expect(mockClientsService.remove).toHaveBeenCalledWith(
        'client-1',
        'company-1',
      );
      expect(result).toEqual({ id: 'client-1' });
    });
  });
});
