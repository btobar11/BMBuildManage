import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocumentsService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = { canActivate: () => true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create a document', async () => {
      const createDto: any = {
        name: 'Test Doc',
        project_id: 'proj-1',
        file_url: 'http://example.com/file.pdf',
      };
      const expected = { id: 'doc-1', ...createDto };
      mockDocumentsService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockDocumentsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all documents by project', async () => {
      const expected = [{ id: 'doc-1', name: 'Doc 1' }];
      mockDocumentsService.findAllByProject.mockResolvedValue(expected);

      const result = await controller.findAll('proj-1');

      expect(mockDocumentsService.findAllByProject).toHaveBeenCalledWith(
        'proj-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single document', async () => {
      const expected = { id: 'doc-1', name: 'Doc 1' };
      mockDocumentsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('doc-1');

      expect(mockDocumentsService.findOne).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a document', async () => {
      const updateDto = { name: 'Updated Doc' };
      const expected = { id: 'doc-1', ...updateDto };
      mockDocumentsService.update.mockResolvedValue(expected);

      const result = await controller.update('doc-1', updateDto);

      expect(mockDocumentsService.update).toHaveBeenCalledWith(
        'doc-1',
        updateDto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove a document', async () => {
      mockDocumentsService.remove.mockResolvedValue({ id: 'doc-1' });

      const result = await controller.remove('doc-1');

      expect(mockDocumentsService.remove).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual({ id: 'doc-1' });
    });
  });
});
