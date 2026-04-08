import { Resource, ResourceType } from './resource.entity';

describe('Resource Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a resource with custom values', () => {
      const resource = new Resource();
      resource.id = 'uuid-1';
      resource.company_id = 'company-uuid-1';
      resource.name = 'Concrete';
      resource.type = ResourceType.MATERIAL;
      resource.category = 'Building Materials';
      resource.description = 'Test description';
      resource.base_price = 50;
      resource.has_vat = true;

      expect(resource.id).toBe('uuid-1');
      expect(resource.company_id).toBe('company-uuid-1');
      expect(resource.name).toBe('Concrete');
      expect(resource.type).toBe(ResourceType.MATERIAL);
      expect(resource.category).toBe('Building Materials');
      expect(resource.base_price).toBe(50);
      expect(resource.has_vat).toBe(true);
    });
  });

  describe('ResourceType enum', () => {
    it('should have all resource types defined', () => {
      expect(ResourceType.MATERIAL).toBe('material');
      expect(ResourceType.LABOR).toBe('labor');
      expect(ResourceType.EQUIPMENT).toBe('equipment');
    });
  });

  describe('relationship fields', () => {
    it('should have unit relationship', () => {
      const resource = new Resource();
      resource.unit = {} as any;
      expect(resource.unit).toBeDefined();
    });

    it('should have price_history relationship', () => {
      const resource = new Resource();
      resource.price_history = [];
      expect(resource.price_history).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const resource = new Resource();
      const requiredFields = [
        'id',
        'company_id',
        'name',
        'type',
        'unit_id',
        'category',
        'description',
        'base_price',
        'has_vat',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(resource).toHaveProperty(field);
      });
    });
  });
});
