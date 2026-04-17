import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompaniesService } from './companies.service';
import { Company, CompanySpecialty, SeismicZone } from './company.entity';
import { User } from '../users/user.entity';

const createMockCompany = (overrides?: Partial<Company>): Company =>
  ({
    id: 'company-1',
    name: 'Company 1',
    country: 'US',
    tax_id: 'TAX001',
    address: 'Test address',
    logo_url: null,
    email: 'company@example.com',
    phone: '123456',
    specialty: null,
    seismic_zone: null,
    region_code: 'CL-RM',
    library_seeded: false,
    seeded_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as unknown as Company;

const mockCompanyRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  update: jest.fn(),
});

const mockUserRepository = () => ({
  update: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn((key: string): string | undefined => {
    const config: Record<string, string> = {
      'supabase.url': 'http://localhost:54321',
      'supabase.anonKey': 'test-anon-key',
    };
    return config[key];
  }),
});

const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ count: 50, error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({ error: null })),
    })),
  })),
};

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepository: jest.Mocked<Repository<Company>>;
  let userRepository: jest.Mocked<Repository<User>>;

  let configService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useFactory: mockCompanyRepository,
        },
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companyRepository = module.get(getRepositoryToken(Company));
    userRepository = module.get(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);

    // Mock the Supabase client
    (service as any).supabase = mockSupabase;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

describe('create', () => {
    it('should create a company', async () => {
      const createDto = { name: 'Company 1', country: 'US' };
      const company = createMockCompany(createDto);
      companyRepository.create.mockReturnValue(company);
      companyRepository.save.mockResolvedValue(company);

      const result = await service.create(createDto);
      expect(companyRepository.create).toHaveBeenCalledWith(createDto);
      expect(companyRepository.save).toHaveBeenCalledWith(company);
      expect(result).toEqual(company);
    });

    it('should link user to company when createdByUserId provided', async () => {
      const createDto = { name: 'Company 1', country: 'US' };
      const company = createMockCompany({ id: 'new-company-1' });
      companyRepository.create.mockReturnValue(company);
      companyRepository.save.mockResolvedValue(company);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.create(createDto, 'user-1');
      expect(userRepository.update).toHaveBeenCalledWith('user-1', { company_id: 'new-company-1' });
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      const company = createMockCompany();
      companyRepository.findOne.mockResolvedValue(company);

      const result = await service.findOne('company-1');
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
      expect(result).toEqual(company);
    });

    it('should throw NotFoundException if company not found', async () => {
      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when companyId does not match', async () => {
      const company = createMockCompany({ id: 'company-1' });
      companyRepository.findOne.mockResolvedValue(company);

      await expect(service.findOne('company-1', 'different-company-id')).rejects.toThrow(
        NotFoundException,
      );
    });

it('should allow access when companyId matches', async () => {
      const company = createMockCompany({ id: 'company-1' });
      companyRepository.findOne.mockResolvedValue(company);

      const result = await service.findOne('company-1', 'company-1');
      expect(result).toEqual(company);
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const companies = [
        createMockCompany({ id: '1' }),
        createMockCompany({ id: '2' }),
      ];
      companyRepository.find.mockResolvedValue(companies);

      const result = await service.findAll();
      expect(companyRepository.find).toHaveBeenCalled();
      expect(result).toEqual(companies);
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      const company = createMockCompany();
      companyRepository.findOne.mockResolvedValue(company);

      const result = await service.findOne('company-1');
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
      expect(result).toEqual(company);
    });

    it('should throw NotFoundException if company not found', async () => {
      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const company = createMockCompany();
      const updated = { ...company, name: 'Updated Company' };
      companyRepository.findOne.mockResolvedValue(company);
      companyRepository.merge.mockReturnValue(updated);
      companyRepository.save.mockResolvedValue(updated);

      const result = await service.update('company-1', {
        name: 'Updated Company',
      });
      expect(result.name).toBe('Updated Company');
    });
  });

  describe('remove', () => {
    it('should remove a company', async () => {
      const company = createMockCompany();
      companyRepository.findOne.mockResolvedValue(company);
      companyRepository.remove.mockResolvedValue(company);

      const result = await service.remove('company-1');
      expect(companyRepository.remove).toHaveBeenCalledWith(company);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('Library Seeding', () => {
    it('should seed company library successfully', async () => {
      const company = createMockCompany();
      companyRepository.findOne.mockResolvedValue(company);

      const mockSeedResult = {
        success: true,
        resources_created: 75,
        apus_created: 25,
        seeded_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockSeedResult,
        error: null,
      });

      companyRepository.update.mockResolvedValueOnce({
        affected: 1,
        raw: [],
      } as any);

      const seedDto = {
        specialty: CompanySpecialty.RESIDENTIAL,
        seismic_zone: SeismicZone.C,
        region_code: 'CL-RM',
      };

      const result = await service.seedCompanyLibrary('company-1', seedDto);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('seed_company_library', {
        p_company_id: 'company-1',
        p_specialty: CompanySpecialty.RESIDENTIAL,
        p_seismic_zone: SeismicZone.C,
        p_region_code: 'CL-RM',
      });

      expect(companyRepository.update).toHaveBeenCalledWith('company-1', {
        specialty: CompanySpecialty.RESIDENTIAL,
        seismic_zone: SeismicZone.C,
        region_code: 'CL-RM',
        library_seeded: true,
        seeded_at: expect.any(Date),
      });

      expect(result.success).toBe(true);
      expect(result.resources_created).toBe(75);
      expect(result.apus_created).toBe(25);
    });

    it('should prevent double seeding', async () => {
      const seededCompany = createMockCompany({
        library_seeded: true,
      });
      companyRepository.findOne.mockResolvedValue(seededCompany);

      const seedDto = {
        specialty: CompanySpecialty.RESIDENTIAL,
      };

      const result = await service.seedCompanyLibrary('company-1', seedDto);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Company library already seeded');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should get seeded library stats', async () => {
      const seededCompany = createMockCompany({
        library_seeded: true,
        seeded_at: new Date(),
        specialty: CompanySpecialty.RESIDENTIAL,
        seismic_zone: SeismicZone.C,
      });

      companyRepository.findOne.mockResolvedValue(seededCompany);

      const result = await service.getSeededLibraryStats('company-1');

      expect(result.isSeeded).toBe(true);
      expect(result.specialty).toBe(CompanySpecialty.RESIDENTIAL);
      expect(result.seismicZone).toBe(SeismicZone.C);
      expect(result.resourcesCount).toBe(50); // From mock
      expect(result.apusCount).toBe(50); // From mock
    });

    it('should return available specialties', async () => {
      const result = await service.getAvailableSpecialties();

      expect(result.specialties).toHaveLength(5);
      expect(result.seismicZones).toHaveLength(5);

      expect(result.specialties[0]).toHaveProperty('value');
      expect(result.specialties[0]).toHaveProperty('label');
      expect(result.specialties[0]).toHaveProperty('description');
    });
  });
});
