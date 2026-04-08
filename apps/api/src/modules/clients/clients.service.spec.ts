import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';

const createMockClient = (overrides?: Partial<Client>): Client =>
  ({
    id: 'client-1',
    company_id: 'company-1',
    name: 'Client 1',
    email: 'client@example.com',
    phone: '123456',
    address: 'Test address',
    tax_id: 'TAX001',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as unknown as Client;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get(getRepositoryToken(Client));
  });

  describe('create', () => {
    it('should create a client', async () => {
      const createDto = {
        company_id: 'company-1',
        name: 'Client 1',
        email: 'test@example.com',
      };
      const client = createMockClient(createDto);
      repository.create.mockReturnValue(client);
      repository.save.mockResolvedValue(client);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(client);
      expect(result).toEqual(client);
    });
  });

  describe('findAll', () => {
    it('should return clients for a company', async () => {
      const clients = [
        createMockClient({ id: '1' }),
        createMockClient({ id: '2' }),
      ];
      repository.find.mockResolvedValue(clients);

      const result = await service.findAll('company-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { company_id: 'company-1' },
      });
      expect(result).toEqual(clients);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      const client = createMockClient();
      repository.findOne.mockResolvedValue(client);

      const result = await service.findOne('client-1', 'company-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-1', company_id: 'company-1' },
      });
      expect(result).toEqual(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const client = createMockClient();
      const updated = { ...client, name: 'Updated Client' };
      repository.findOne.mockResolvedValue(client);
      repository.merge.mockReturnValue(updated);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('client-1', 'company-1', {
        name: 'Updated Client',
      });
      expect(result.name).toBe('Updated Client');
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      const client = createMockClient();
      repository.findOne.mockResolvedValue(client);
      repository.remove.mockResolvedValue(client);

      const result = await service.remove('client-1', 'company-1');
      expect(repository.remove).toHaveBeenCalledWith(client);
      expect(result).toEqual({ deleted: true });
    });
  });
});
