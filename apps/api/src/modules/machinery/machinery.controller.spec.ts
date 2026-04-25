import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MachineryController } from './machinery.controller';
import { MachineryService } from './machinery.service';
import { UsersService } from '../users/users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('MachineryController', () => {
  let controller: MachineryController;
  let service: MachineryService;

  const mockMachineryService = {
    create: jest.fn(),
    findAllByCompany: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersService = {
    ensureUserFromAuth: jest.fn().mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      role: 'admin',
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'http://localhost:54321';
      if (key === 'SUPABASE_ANON_KEY') return 'test-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachineryController],
      providers: [
        {
          provide: MachineryService,
          useValue: mockMachineryService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MachineryController>(MachineryController);
    service = module.get<MachineryService>(MachineryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create machinery', async () => {
      const createDto: any = { name: 'Excavator', company_id: 'company-1' };
      const expected = { id: 'machinery-1', ...createDto };
      mockMachineryService.create.mockResolvedValue(expected);

      const result = await controller.create('company-1', createDto);

      expect(mockMachineryService.create).toHaveBeenCalledWith(
        'company-1',
        createDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all machinery by company', async () => {
      const expected = [{ id: 'machinery-1', name: 'Excavator' }];
      mockMachineryService.findAllByCompany.mockResolvedValue(expected);

      const result = await controller.findAll('company-1');

      expect(mockMachineryService.findAllByCompany).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single machinery', async () => {
      const expected = { id: 'machinery-1', name: 'Excavator' };
      mockMachineryService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('company-1', 'machinery-1');

      expect(mockMachineryService.findOne).toHaveBeenCalledWith(
        'company-1',
        'machinery-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove machinery', async () => {
      mockMachineryService.remove.mockResolvedValue({ id: 'machinery-1' });

      const result = await controller.remove('company-1', 'machinery-1');

      expect(mockMachineryService.remove).toHaveBeenCalledWith(
        'company-1',
        'machinery-1',
      );
      expect(result).toEqual({ id: 'machinery-1' });
    });
  });
});
