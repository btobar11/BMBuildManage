import { Item, ItemType, CubicationMode } from './item.entity';

describe('Item Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create an item with undefined default values (DB defaults apply on insert)', () => {
      const item = new Item();

      expect(item.type).toBeUndefined();
      expect(item.quantity).toBeUndefined();
      expect(item.unit_cost).toBeUndefined();
      expect(item.unit_price).toBeUndefined();
      expect(item.total_cost).toBeUndefined();
      expect(item.total_price).toBeUndefined();
      expect(item.position).toBeUndefined();
      expect(item.cubication_mode).toBeUndefined();
    });

    it('should create an item with custom values', () => {
      const item = new Item();
      item.id = 'uuid-1';
      item.stage_id = 'stage-uuid-1';
      item.name = 'Concrete Foundation';
      item.type = ItemType.MATERIAL;
      item.description = 'Concrete for foundation';
      item.quantity = 25.5;
      item.unit = 'm3';
      item.unit_cost = 150;
      item.unit_price = 200;
      item.cost_code = 'CC-001';
      item.position = 1;
      item.cubication_mode = CubicationMode.DIMENSIONS;
      item.dim_length = 10;
      item.dim_width = 5;
      item.dim_height = 0.5;
      item.dim_count = 2;
      item.formula = 'largo * ancho * alto * cantidad';
      item.geometry_data = { area: 50, perimetro: 30 };
      item.ifc_global_id = 'ifc-123';
      item.quantity_executed = 10;
      item.real_cost = 1500;
      item.is_price_overridden = true;

      expect(item.id).toBe('uuid-1');
      expect(item.stage_id).toBe('stage-uuid-1');
      expect(item.name).toBe('Concrete Foundation');
      expect(item.type).toBe(ItemType.MATERIAL);
      expect(item.quantity).toBe(25.5);
      expect(item.unit).toBe('m3');
      expect(item.unit_cost).toBe(150);
      expect(item.unit_price).toBe(200);
    });
  });

  describe('ItemType enum', () => {
    it('should have all required type values', () => {
      expect(ItemType.MATERIAL).toBe('material');
      expect(ItemType.LABOR).toBe('labor');
      expect(ItemType.MACHINERY).toBe('machinery');
      expect(ItemType.SUBCONTRACT).toBe('subcontract');
    });
  });

  describe('CubicationMode enum', () => {
    it('should have all required mode values', () => {
      expect(CubicationMode.MANUAL).toBe('manual');
      expect(CubicationMode.DIMENSIONS).toBe('dimensions');
      expect(CubicationMode.CAD).toBe('cad');
      expect(CubicationMode.PDF).toBe('pdf');
      expect(CubicationMode.BIM).toBe('bim');
    });
  });

  describe('@BeforeInsert calculateTotals hook', () => {
    it('should calculate quantity from formula during insert', () => {
      const item = new Item();
      item.formula = 'largo * ancho * alto';
      item.dim_length = 10;
      item.dim_width = 5;
      item.dim_height = 2;
      item.geometry_data = {};

      item.calculateTotals();

      expect(item.quantity).toBe(100);
    });

    it('should calculate quantity with area parameter', () => {
      const item = new Item();
      item.formula = 'area * cantidad';
      item.dim_count = 3;
      item.geometry_data = { area: 50 };

      item.calculateTotals();

      expect(item.quantity).toBe(150);
    });

    it('should handle empty formula', () => {
      const item = new Item();
      item.formula = '';
      item.quantity = 100;

      item.calculateTotals();

      expect(item.quantity).toBe(100);
    });

    it('should handle null formula', () => {
      const item = new Item();
      item.formula = null as any;
      item.quantity = 100;

      item.calculateTotals();

      expect(item.quantity).toBe(100);
    });

    it('should reset quantity to 0 if NaN result', () => {
      const item = new Item();
      item.formula = 'largo / ancho';
      item.dim_length = 10;
      item.dim_width = 0;
      item.geometry_data = {};

      item.calculateTotals();

      expect(item.quantity).toBe(0);
    });

    it('should handle complex formula with multiple params', () => {
      const item = new Item();
      item.formula = '(largo * ancho * alto + area) * cantidad';
      item.dim_length = 10;
      item.dim_width = 5;
      item.dim_height = 2;
      item.dim_count = 2;
      item.geometry_data = { area: 50 };

      item.calculateTotals();

      expect(item.quantity).toBe(300);
    });
  });

  describe('@BeforeUpdate calculateTotals hook', () => {
    it('should recalculate quantity on update when formula present', () => {
      const item = new Item();
      item.quantity = 50;
      item.formula = 'largo * ancho';
      item.dim_length = 8;
      item.dim_width = 4;
      item.geometry_data = {};

      item.calculateTotals();

      expect(item.quantity).toBe(32);
    });

    it('should preserve quantity when no formula on update', () => {
      const item = new Item();
      item.quantity = 100;
      item.formula = '';

      item.calculateTotals();

      expect(item.quantity).toBe(100);
    });
  });

  describe('dimension fields', () => {
    it('should store all dimension values', () => {
      const item = new Item();
      item.dim_length = 10.5;
      item.dim_width = 5.5;
      item.dim_height = 3.0;
      item.dim_thickness = 0.15;
      item.dim_count = 10;
      item.dim_holes = 2;

      expect(item.dim_length).toBe(10.5);
      expect(item.dim_width).toBe(5.5);
      expect(item.dim_height).toBe(3.0);
      expect(item.dim_thickness).toBe(0.15);
      expect(item.dim_count).toBe(10);
      expect(item.dim_holes).toBe(2);
    });

    it('should allow null dimensions', () => {
      const item = new Item();
      item.dim_length = null as any;
      item.dim_width = null as any;
      item.dim_height = null as any;

      expect(item.dim_length).toBeNull();
      expect(item.dim_width).toBeNull();
      expect(item.dim_height).toBeNull();
    });
  });

  describe('relationship fields', () => {
    it('should have stage relationship', () => {
      const item = new Item();
      item.stage = {} as any;

      expect(item.stage).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const item = new Item();

      const requiredFields = [
        'id',
        'stage_id',
        'name',
        'type',
        'description',
        'quantity',
        'unit',
        'unit_cost',
        'total_cost',
        'unit_price',
        'total_price',
        'cost_code',
        'position',
        'apu_template_id',
        'cubication_mode',
        'dim_length',
        'dim_width',
        'dim_height',
        'dim_thickness',
        'dim_count',
        'dim_holes',
        'formula',
        'geometry_data',
        'ifc_global_id',
        'quantity_executed',
        'real_cost',
        'is_price_overridden',
        'created_at',
        'updated_at',
      ];

      requiredFields.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  });
});
