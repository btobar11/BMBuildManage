import { ProjectContingency } from './project-contingency.entity';

describe('ProjectContingency Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a contingency with custom values', () => {
      const contingency = new ProjectContingency();
      contingency.id = 'uuid-1';
      contingency.project_id = 'project-uuid-1';
      contingency.description = 'Test contingency';
      contingency.quantity = 5;
      contingency.unit_cost = 100;
      contingency.notes = 'Test notes';

      expect(contingency.id).toBe('uuid-1');
      expect(contingency.project_id).toBe('project-uuid-1');
      expect(contingency.description).toBe('Test contingency');
      expect(contingency.quantity).toBe(5);
      expect(contingency.unit_cost).toBe(100);
      expect(contingency.notes).toBe('Test notes');
    });
  });

  describe('calculateTotal hook', () => {
    it('should calculate total cost on before insert', () => {
      const contingency = new ProjectContingency();
      contingency.quantity = 10;
      contingency.unit_cost = 50;
      contingency.calculateTotal();
      expect(contingency.total_cost).toBe(500);
    });

    it('should calculate total cost on before update', () => {
      const contingency = new ProjectContingency();
      contingency.quantity = 3;
      contingency.unit_cost = 200;
      contingency.calculateTotal();
      expect(contingency.total_cost).toBe(600);
    });

    it('should handle zero values', () => {
      const contingency = new ProjectContingency();
      contingency.quantity = 0;
      contingency.unit_cost = 100;
      contingency.calculateTotal();
      expect(contingency.total_cost).toBe(0);
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const contingency = new ProjectContingency();
      contingency.project = {} as any;
      expect(contingency.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const contingency = new ProjectContingency();
      const requiredFields = [
        'id',
        'project_id',
        'description',
        'quantity',
        'unit_cost',
        'total_cost',
        'notes',
        'date',
      ];
      requiredFields.forEach((field) => {
        expect(contingency).toHaveProperty(field);
      });
    });
  });
});
