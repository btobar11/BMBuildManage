import { Machinery } from './machinery.entity';

describe('Machinery Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create machinery with custom values', () => {
      const machinery = new Machinery();
      machinery.id = 'uuid-1';
      machinery.company_id = 'company-uuid-1';
      machinery.name = 'Excavator';
      machinery.category = 'Heavy Equipment';
      machinery.price_per_hour = 150;
      machinery.price_per_day = 1000;
      machinery.notes = 'Test notes';

      expect(machinery.id).toBe('uuid-1');
      expect(machinery.company_id).toBe('company-uuid-1');
      expect(machinery.name).toBe('Excavator');
      expect(machinery.category).toBe('Heavy Equipment');
      expect(machinery.price_per_hour).toBe(150);
      expect(machinery.price_per_day).toBe(1000);
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const machinery = new Machinery();
      machinery.company = {} as any;
      expect(machinery.company).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const machinery = new Machinery();
      const requiredFields = [
        'id',
        'company_id',
        'name',
        'category',
        'price_per_hour',
        'price_per_day',
        'notes',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(machinery).toHaveProperty(field);
      });
    });
  });
});
