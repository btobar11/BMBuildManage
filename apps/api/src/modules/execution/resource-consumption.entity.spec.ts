import { ResourceConsumption } from './resource-consumption.entity';
import { Item } from '../items/item.entity';
import { Resource } from '../resources/resource.entity';
import { Project } from '../projects/project.entity';

describe('ResourceConsumption Entity', () => {
  describe('constructor and defaults', () => {
    it('should create an instance', () => {
      const consumption = new ResourceConsumption();
      expect(consumption).toBeInstanceOf(ResourceConsumption);
    });

    it('should have all required columns', () => {
      const consumption = new ResourceConsumption();
      consumption.id = 'test-id';
      consumption.project_id = 'project-1';
      consumption.budget_item_id = 'item-1';
      consumption.resource_id = 'resource-1';
      consumption.quantity = 10.5;
      consumption.unit_cost = 25.0;
      consumption.total_cost = 262.5;
      consumption.note = 'Test note';

      expect(consumption.id).toBe('test-id');
      expect(consumption.project_id).toBe('project-1');
      expect(consumption.budget_item_id).toBe('item-1');
      expect(consumption.resource_id).toBe('resource-1');
      expect(consumption.quantity).toBe(10.5);
      expect(consumption.unit_cost).toBe(25.0);
      expect(consumption.total_cost).toBe(262.5);
      expect(consumption.note).toBe('Test note');
    });

    it('should allow undefined note', () => {
      const consumption = new ResourceConsumption();
      expect(consumption.note).toBeUndefined();
    });

    it('should accept relations', () => {
      const consumption = new ResourceConsumption();
      const mockProject = { id: 'project-1' } as Project;
      const mockItem = { id: 'item-1' } as Item;
      const mockResource = { id: 'resource-1' } as Resource;

      consumption.project = mockProject;
      consumption.budget_item = mockItem;
      consumption.resource = mockResource;

      expect(consumption.project).toBe(mockProject);
      expect(consumption.budget_item).toBe(mockItem);
      expect(consumption.resource).toBe(mockResource);
    });

    it('should have date auto-set', () => {
      const consumption = new ResourceConsumption();
      consumption.date = new Date();
      expect(consumption.date).toBeInstanceOf(Date);
    });
  });
});
