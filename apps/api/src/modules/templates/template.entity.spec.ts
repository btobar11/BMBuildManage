import { Template } from './template.entity';
import { TemplateStage } from './template-stage.entity';
import { TemplateItem } from './template-item.entity';

describe('Template Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a template with custom values', () => {
      const template = new Template();
      template.id = 'uuid-1';
      template.company_id = 'company-uuid-1';
      template.name = 'Test Template';
      template.description = 'Test description';

      expect(template.id).toBe('uuid-1');
      expect(template.company_id).toBe('company-uuid-1');
      expect(template.name).toBe('Test Template');
      expect(template.description).toBe('Test description');
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const template = new Template();
      template.company = {} as any;
      expect(template.company).toBeDefined();
    });

    it('should have stages relationship', () => {
      const template = new Template();
      template.stages = [];
      expect(template.stages).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const template = new Template();
      const requiredFields = [
        'id',
        'company_id',
        'name',
        'description',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(template).toHaveProperty(field);
      });
    });
  });
});

describe('TemplateStage Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a template stage with custom values', () => {
      const stage = new TemplateStage();
      stage.id = 'uuid-1';
      stage.template_id = 'template-uuid-1';
      stage.name = 'Foundation';
      stage.position = 1;

      expect(stage.id).toBe('uuid-1');
      expect(stage.template_id).toBe('template-uuid-1');
      expect(stage.name).toBe('Foundation');
      expect(stage.position).toBe(1);
    });
  });

  describe('relationship fields', () => {
    it('should have template relationship', () => {
      const stage = new TemplateStage();
      stage.template = {} as any;
      expect(stage.template).toBeDefined();
    });

    it('should have items relationship', () => {
      const stage = new TemplateStage();
      stage.items = [];
      expect(stage.items).toEqual([]);
    });
  });
});

describe('TemplateItem Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a template item with custom values', () => {
      const item = new TemplateItem();
      item.id = 'uuid-1';
      item.template_stage_id = 'stage-uuid-1';
      item.name = 'Concrete';
      item.unit = 'm3';
      item.default_quantity = 100;
      item.default_cost = 50;

      expect(item.id).toBe('uuid-1');
      expect(item.template_stage_id).toBe('stage-uuid-1');
      expect(item.name).toBe('Concrete');
      expect(item.unit).toBe('m3');
      expect(item.default_quantity).toBe(100);
      expect(item.default_cost).toBe(50);
    });
  });

  describe('relationship fields', () => {
    it('should have template_stage relationship', () => {
      const item = new TemplateItem();
      item.template_stage = {} as any;
      expect(item.template_stage).toBeDefined();
    });
  });
});
