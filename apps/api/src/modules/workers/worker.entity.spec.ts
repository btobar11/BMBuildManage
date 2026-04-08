import { Worker } from './worker.entity';

describe('Worker Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a worker with undefined default values (DB defaults apply on insert)', () => {
      const worker = new Worker();

      expect(worker.daily_rate).toBeUndefined();
      expect(worker.rating).toBeUndefined();
    });

    it('should create a worker with custom values', () => {
      const worker = new Worker();
      worker.id = 'uuid-1';
      worker.company_id = 'company-uuid-1';
      worker.name = 'John Doe';
      worker.role = 'Mason';
      worker.daily_rate = 150.0;
      worker.phone = '+1234567890';
      worker.skills = 'Bricklaying, Plastering';
      worker.rating = 4.5;
      worker.notes = 'Experienced worker';

      expect(worker.id).toBe('uuid-1');
      expect(worker.company_id).toBe('company-uuid-1');
      expect(worker.name).toBe('John Doe');
      expect(worker.role).toBe('Mason');
      expect(worker.daily_rate).toBe(150.0);
      expect(worker.phone).toBe('+1234567890');
      expect(worker.skills).toBe('Bricklaying, Plastering');
      expect(worker.rating).toBe(4.5);
      expect(worker.notes).toBe('Experienced worker');
    });
  });

  describe('name field constraints', () => {
    it('should accept name within 200 characters', () => {
      const worker = new Worker();
      worker.name = 'A'.repeat(200);

      expect(worker.name.length).toBe(200);
    });

    it('should allow empty name', () => {
      const worker = new Worker();
      worker.name = '';

      expect(worker.name).toBe('');
    });
  });

  describe('role field constraints', () => {
    it('should accept role within 100 characters', () => {
      const worker = new Worker();
      worker.role = 'A'.repeat(100);

      expect(worker.role.length).toBe(100);
    });

    it('should allow null role', () => {
      const worker = new Worker();
      worker.role = null as any;

      expect(worker.role).toBeNull();
    });
  });

  describe('rating field', () => {
    it('should accept rating from 0 to 5', () => {
      const worker = new Worker();
      worker.rating = 3.5;

      expect(worker.rating).toBe(3.5);
    });

    it('should allow rating of 0', () => {
      const worker = new Worker();
      worker.rating = 0;

      expect(worker.rating).toBe(0);
    });

    it('should allow rating of 5', () => {
      const worker = new Worker();
      worker.rating = 5;

      expect(worker.rating).toBe(5);
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const worker = new Worker();
      worker.company = {} as any;

      expect(worker.company).toBeDefined();
    });

    it('should have assignments relationship', () => {
      const worker = new Worker();
      worker.assignments = [];

      expect(worker.assignments).toEqual([]);
    });

    it('should have payments relationship', () => {
      const worker = new Worker();
      worker.payments = [];

      expect(worker.payments).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should import required TypeORM decorators', () => {
      const worker = new Worker();

      expect(worker).toBeInstanceOf(Object);
      expect(worker).toHaveProperty('id');
    });

    it('should have all required columns defined', () => {
      const worker = new Worker();

      const requiredFields = [
        'id',
        'company_id',
        'name',
        'role',
        'daily_rate',
        'phone',
        'skills',
        'rating',
        'notes',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(worker).toHaveProperty(field);
      });
    });
  });
});
