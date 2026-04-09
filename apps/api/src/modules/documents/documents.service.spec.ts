import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './document.entity';
import { Project } from '../projects/project.entity';

const createMockDocument = (overrides?: Partial<Document>): Document =>
  ({
    id: 'doc-1',
    project_id: 'project-1',
    company_id: 'company-1',
    name: 'Document 1',
    type: 'other' as any,
    file_url: 'http://example.com/doc.pdf',
    size: 1024,
    uploaded_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
    project: {} as Project,
    ...overrides,
  }) as unknown as Document;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    repository = module.get(getRepositoryToken(Document));
  });

  describe('create', () => {
    it('should create a document', async () => {
      const createDto = {
        project_id: 'project-1',
        name: 'Document 1',
        type: 'other' as any,
        file_url: 'http://example.com/doc.pdf',
      };
      const document = createMockDocument();
      repository.create.mockReturnValue(document);
      repository.save.mockResolvedValue(document);

      const result = await service.create(createDto, 'company-1');
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        company_id: 'company-1',
      });
      expect(repository.save).toHaveBeenCalledWith(document);
      expect(result).toEqual(document);
    });
  });

  describe('findAllByProject', () => {
    it('should return documents for a project', async () => {
      const documents = [
        createMockDocument({ id: '1' }),
        createMockDocument({ id: '2' }),
      ];
      repository.find.mockResolvedValue(documents);

      const result = await service.findAllByProject('project-1', 'company-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-1', company_id: 'company-1' },
        order: { uploaded_at: 'DESC' },
        relations: ['project'],
      });
      expect(result).toEqual(documents);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      const document = createMockDocument();
      repository.findOne.mockResolvedValue(document);

      const result = await service.findOne('doc-1', 'company-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-1', company_id: 'company-1' },
        relations: ['project'],
      });
      expect(result).toEqual(document);
    });

    it('should throw NotFoundException if document not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const document = createMockDocument();
      const updated = { ...document, name: 'Updated Document' };
      repository.findOne.mockResolvedValue(document);
      repository.merge.mockReturnValue(updated);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(
        'doc-1',
        { name: 'Updated Document' },
        'company-1',
      );
      expect(result.name).toBe('Updated Document');
    });
  });

  describe('remove', () => {
    it('should remove a document', async () => {
      const document = createMockDocument();
      repository.findOne.mockResolvedValue(document);
      repository.remove.mockResolvedValue(document);

      const result = await service.remove('doc-1', 'company-1');
      expect(repository.remove).toHaveBeenCalledWith(document);
      expect(result).toEqual({ deleted: true });
    });
  });
});
