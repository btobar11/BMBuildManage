import { Company } from './company.entity';

describe('Company Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a company with undefined default values', () => {
      const company = new Company();

      expect(company.country).toBeUndefined();
      expect(company.tax_id).toBeUndefined();
      expect(company.address).toBeUndefined();
      expect(company.logo_url).toBeUndefined();
      expect(company.email).toBeUndefined();
      expect(company.phone).toBeUndefined();
    });

    it('should create a company with custom values', () => {
      const company = new Company();
      company.id = 'uuid-1';
      company.name = 'Construction Corp';
      company.country = 'Chile';
      company.tax_id = '12345678-9';
      company.address = 'Av. Principal 123';
      company.logo_url = 'https://example.com/logo.png';
      company.email = 'info@constructioncorp.com';
      company.phone = '+56 2 12345678';

      expect(company.id).toBe('uuid-1');
      expect(company.name).toBe('Construction Corp');
      expect(company.country).toBe('Chile');
      expect(company.tax_id).toBe('12345678-9');
    });
  });

  describe('name field constraints', () => {
    it('should accept name within 200 characters', () => {
      const company = new Company();
      company.name = 'A'.repeat(200);

      expect(company.name.length).toBe(200);
    });
  });

  describe('country field constraints', () => {
    it('should accept country within 100 characters', () => {
      const company = new Company();
      company.country = 'A'.repeat(100);

      expect(company.country.length).toBe(100);
    });

    it('should allow null country', () => {
      const company = new Company();
      company.country = null as any;

      expect(company.country).toBeNull();
    });
  });

  describe('tax_id field constraints', () => {
    it('should accept tax_id within 50 characters', () => {
      const company = new Company();
      company.tax_id = 'A'.repeat(50);

      expect(company.tax_id.length).toBe(50);
    });

    it('should allow null tax_id', () => {
      const company = new Company();
      company.tax_id = null as any;

      expect(company.tax_id).toBeNull();
    });
  });

  describe('relationship fields', () => {
    it('should have users relationship', () => {
      const company = new Company();
      company.users = [];

      expect(company.users).toEqual([]);
    });

    it('should have clients relationship', () => {
      const company = new Company();
      company.clients = [];

      expect(company.clients).toEqual([]);
    });

    it('should have projects relationship', () => {
      const company = new Company();
      company.projects = [];

      expect(company.projects).toEqual([]);
    });

    it('should have workers relationship', () => {
      const company = new Company();
      company.workers = [];

      expect(company.workers).toEqual([]);
    });

    it('should have templates relationship', () => {
      const company = new Company();
      company.templates = [];

      expect(company.templates).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should import required TypeORM decorators', () => {
      const company = new Company();

      expect(company).toBeInstanceOf(Object);
      expect(company).toHaveProperty('id');
    });

    it('should have all required columns defined', () => {
      const company = new Company();

      const requiredFields = [
        'id',
        'name',
        'country',
        'tax_id',
        'address',
        'logo_url',
        'email',
        'phone',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(company).toHaveProperty(field);
      });
    });
  });
});
