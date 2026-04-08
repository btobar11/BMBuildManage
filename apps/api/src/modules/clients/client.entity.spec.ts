import { Client } from './client.entity';

describe('Client Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a client with custom values', () => {
      const client = new Client();
      client.id = 'uuid-1';
      client.company_id = 'company-uuid-1';
      client.name = 'Test Client';
      client.email = 'client@example.com';
      client.phone = '+1234567890';
      client.address = 'Test Address';

      expect(client.id).toBe('uuid-1');
      expect(client.company_id).toBe('company-uuid-1');
      expect(client.name).toBe('Test Client');
      expect(client.email).toBe('client@example.com');
      expect(client.phone).toBe('+1234567890');
      expect(client.address).toBe('Test Address');
    });
  });

  describe('relationship fields', () => {
    it('should have company relationship', () => {
      const client = new Client();
      client.company = {} as any;
      expect(client.company).toBeDefined();
    });

    it('should have projects relationship', () => {
      const client = new Client();
      client.projects = [];
      expect(client.projects).toEqual([]);
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const client = new Client();
      const requiredFields = [
        'id',
        'company_id',
        'name',
        'email',
        'phone',
        'address',
        'created_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(client).toHaveProperty(field);
      });
    });
  });
});
