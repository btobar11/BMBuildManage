import { Test, type TestingModule } from '@nestjs/testing';
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

  it('creates a user scoped to company', async () => {
    const createDto: any = { email: 'user@test.com', name: 'User A' };
    const expected = { id: 'user-1', ...createDto, company_id: 'company-1' };
    mockUsersService.create.mockResolvedValue(expected);

    const result = await controller.create('company-1', createDto);

    expect(mockUsersService.create).toHaveBeenCalledWith(
      'company-1',
      createDto,
    );
    expect(result).toEqual(expected);
  });

  it('lists users in company', async () => {
    const expected = [{ id: 'user-1', email: 'user@test.com' }];
    mockUsersService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll('company-1');

    expect(mockUsersService.findAll).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(expected);
  });

  it('returns current user via /me', async () => {
    const expected = { id: 'user-1', email: 'user@test.com' };
    mockUsersService.findOne.mockResolvedValue(expected);

    const result = await controller.findMe({
      id: 'user-1',
      email: 'user@test.com',
      company_id: 'company-1',
      role: 'engineer',
    } as any);

    expect(mockUsersService.findOne).toHaveBeenCalledWith(
      'user-1',
      'company-1',
    );
    expect(result).toEqual(expected);
  });

  it('allows self lookup', async () => {
    const expected = { id: 'user-1', email: 'user@test.com' };
    mockUsersService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne(
      'user-1',
      { id: 'user-1', role: 'engineer' } as any,
      'company-1',
    );

    expect(mockUsersService.findOne).toHaveBeenCalledWith(
      'user-1',
      'company-1',
    );
    expect(result).toEqual(expected);
  });

  it('updates user in company', async () => {
    const updateDto: any = { name: 'User B' };
    const expected = { id: 'user-1', ...updateDto };
    mockUsersService.update.mockResolvedValue(expected);

    const result = await controller.update(
      'user-1',
      updateDto,
      { id: 'user-1', role: 'engineer' } as any,
      'company-1',
    );

    expect(mockUsersService.update).toHaveBeenCalledWith(
      'user-1',
      'company-1',
      updateDto,
      'user-1',
    );
    expect(result).toEqual(expected);
  });

  it('removes user in company', async () => {
    mockUsersService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('user-1', 'company-1');

    expect(mockUsersService.remove).toHaveBeenCalledWith('user-1', 'company-1');
    expect(result).toEqual({ deleted: true });
  });
});
