import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: 'test-id',
    company_id: 'company-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as any,
    created_at: new Date(),
    updated_at: new Date(),
    company: {} as any,
    ...overrides,
  }) as User;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createDto = {
        company_id: 'company-1',
        email: 'test@example.com',
        name: 'Test User',
      };
      const user = createMockUser(createDto);
      repository.create.mockReturnValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [createMockUser({ id: '1' }), createMockUser({ id: '2' })];
      repository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalledWith({ relations: ['company'] });
      expect(result).toEqual(users);
    });
  });

  describe('findByCompany', () => {
    it('should return users for a company', async () => {
      const users = [createMockUser()];
      repository.find.mockResolvedValue(users);

      const result = await service.findByCompany('company-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { company_id: 'company-1' },
      });
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = createMockUser();
      repository.findOne.mockResolvedValue(user);

      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['company'],
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = createMockUser();
      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['company'],
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = createMockUser();
      const updated = { ...user, name: 'Updated Name' };
      repository.findOne.mockResolvedValue(user);
      repository.merge.mockReturnValue(updated);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('test-id', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = createMockUser();
      repository.findOne.mockResolvedValue(user);
      repository.remove.mockResolvedValue(user);

      const result = await service.remove('test-id');
      expect(repository.remove).toHaveBeenCalledWith(user);
      expect(result).toEqual({ deleted: true });
    });
  });
});
