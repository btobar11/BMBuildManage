import { Material } from './material.entity';

describe('Material Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create material with custom values', () => {
      const material = new Material();
      material.id = 'uuid-1';
      material.name = 'Concrete';
      material.category = 'Building Materials';
      material.unit = 'm3';
      material.default_price = 50;
      material.supplier = 'Test Supplier';

      expect(material.id).toBe('uuid-1');
      expect(material.name).toBe('Concrete');
      expect(material.category).toBe('Building Materials');
      expect(material.unit).toBe('m3');
      expect(material.default_price).toBe(50);
      expect(material.supplier).toBe('Test Supplier');
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const material = new Material();
      const requiredFields = [
        'id',
        'name',
        'category',
        'unit',
        'default_price',
        'supplier',
        'created_at',
      ];
      requiredFields.forEach((field) => {
        expect(material).toHaveProperty(field);
      });
    });
  });
});
