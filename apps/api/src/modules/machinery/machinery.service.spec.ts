import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MachineryService } from './machinery.service';
import { Machinery } from './machinery.entity';

const createMockMachinery = (overrides?: Partial<Machinery>): Machinery =>
  ({
    id: 'machinery-1',
    company_id: 'company-1',
    name: 'Excavator',
    category: 'heavy',
    price_per_hour: 150,
    price_per_day: 1000,
    notes: 'Test machinery',
    created_at: new Date(),
    ...overrides,
  }) as unknown as Machinery;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('MachineryService', () => {
  let service: MachineryService;
  let repository: jest.Mocked<Repository<Machinery>>;
  const companyId = 'company-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachineryService,
        { provide: getRepositoryToken(Machinery), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<MachineryService>(MachineryService);
    repository = module.get(getRepositoryToken(Machinery));
  });

  describe('create', () => {
    it('should create machinery', async () => {
      const createDto: any = {
        name: 'Excavator',
        category: 'heavy',
        price_per_hour: 150,
        price_per_day: 1000,
      };
      const machinery = createMockMachinery();
      repository.create.mockReturnValue(machinery);
      repository.save.mockResolvedValue(machinery);

      const result = await service.create(companyId, createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        company_id: companyId,
      });
      expect(repository.save).toHaveBeenCalledWith(machinery);
      expect(result).toEqual(machinery);
    });
  });

  describe('findAllByCompany', () => {
    it('should return machinery for a company', async () => {
      const machineryList = [
        createMockMachinery({ id: '1' }),
        createMockMachinery({ id: '2' }),
      ];
      repository.find.mockResolvedValue(machineryList);

      const result = await service.findAllByCompany(companyId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { company_id: companyId },
      });
      expect(result).toEqual(machineryList);
    });
  });

  describe('findOne', () => {
    it('should return machinery by id', async () => {
      const machinery = createMockMachinery();
      repository.findOne.mockResolvedValue(machinery);

      const result = await service.findOne(companyId, 'machinery-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'machinery-1', company_id: companyId },
      });
      expect(result).toEqual(machinery);
    });

    it('should throw NotFoundException when machinery not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove machinery', async () => {
      const machinery = createMockMachinery();
      repository.findOne.mockResolvedValue(machinery);
      repository.remove.mockResolvedValue(machinery);

      const result = await service.remove(companyId, 'machinery-1');

      expect(repository.remove).toHaveBeenCalledWith(machinery);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when removing nonexistent', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(companyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
