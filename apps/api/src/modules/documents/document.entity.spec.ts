import { Document, DocumentType } from './document.entity';

describe('Document Entity', () => {
  describe('constructor and field initialization', () => {
    it('should create a document with custom values', () => {
      const document = new Document();
      document.id = 'uuid-1';
      document.project_id = 'project-uuid-1';
      document.name = 'Test Document';
      document.file_url = 'https://example.com/file.pdf';
      document.type = DocumentType.CONTRACT;

      expect(document.id).toBe('uuid-1');
      expect(document.project_id).toBe('project-uuid-1');
      expect(document.name).toBe('Test Document');
      expect(document.file_url).toBe('https://example.com/file.pdf');
      expect(document.type).toBe(DocumentType.CONTRACT);
    });
  });

  describe('DocumentType enum', () => {
    it('should have all document types defined', () => {
      expect(DocumentType.PLAN).toBe('plan');
      expect(DocumentType.QUANTITY_TAKEOFF).toBe('quantity_takeoff');
      expect(DocumentType.CONTRACT).toBe('contract');
      expect(DocumentType.INVOICE).toBe('invoice');
      expect(DocumentType.RECEIPT).toBe('receipt');
      expect(DocumentType.PURCHASE_ORDER).toBe('purchase_order');
      expect(DocumentType.PERMIT).toBe('permit');
      expect(DocumentType.PHOTO).toBe('photo');
      expect(DocumentType.OTHER).toBe('other');
    });
  });

  describe('relationship fields', () => {
    it('should have project relationship', () => {
      const document = new Document();
      document.project = {} as any;
      expect(document.project).toBeDefined();
    });
  });

  describe('module imports verification', () => {
    it('should have all required columns defined', () => {
      const document = new Document();
      const requiredFields = [
        'id',
        'project_id',
        'name',
        'file_url',
        'type',
        'uploaded_at',
        'updated_at',
      ];
      requiredFields.forEach((field) => {
        expect(document).toHaveProperty(field);
      });
    });
  });
});
