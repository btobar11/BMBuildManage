import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a user', async () => {
      const createDto: any = { email: 'user@test.com', name: 'User A' };
      const expected = { id: 'user-1', ...createDto };
      mockUsersService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all users', async () => {
      const expected = [{ id: 'user-1', email: 'user@test.com' }];
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single user', async () => {
      const expected = { id: 'user-1', email: 'user@test.com' };
      mockUsersService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('user-1');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a user', async () => {
      const updateDto: any = { name: 'User B' };
      const expected = { id: 'user-1', ...updateDto };
      mockUsersService.update.mockResolvedValue(expected);

      const result = await controller.update('user-1', updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith('user-1', updateDto);
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue({ id: 'user-1' });

      const result = await controller.remove('user-1');

      expect(mockUsersService.remove).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ id: 'user-1' });
    });
  });
});
