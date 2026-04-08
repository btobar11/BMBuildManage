import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { Template } from './template.entity';
import { TemplateStage } from './template-stage.entity';

const createMockTemplate = (overrides?: Partial<Template>): Template =>
  ({
    id: 'template-1',
    company_id: 'company-1',
    name: 'Template 1',
    description: 'Test template',
    created_at: new Date(),
    updated_at: new Date(),
    stages: [],
    ...overrides,
  }) as unknown as Template;

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let repository: jest.Mocked<Repository<Template>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: getRepositoryToken(Template), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    repository = module.get(getRepositoryToken(Template));
  });

  describe('create', () => {
    it('should create a template', async () => {
      const createDto = { company_id: 'company-1', name: 'Template 1' };
      const template = createMockTemplate(createDto);
      repository.create.mockReturnValue(template);
      repository.save.mockResolvedValue(template);

      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(template);
      expect(result).toEqual(template);
    });
  });

  describe('findAll', () => {
    it('should return templates for a company', async () => {
      const templates = [
        createMockTemplate({ id: '1' }),
        createMockTemplate({ id: '2' }),
      ];
      repository.find.mockResolvedValue(templates);

      const result = await service.findAll('company-1');
      expect(repository.find).toHaveBeenCalledWith({
        where: { company_id: 'company-1' },
        relations: ['stages', 'stages.items'],
      });
      expect(result).toEqual(templates);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      const template = createMockTemplate();
      repository.findOne.mockResolvedValue(template);

      const result = await service.findOne('template-1', 'company-1');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-1', company_id: 'company-1' },
        relations: ['stages', 'stages.items'],
      });
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const template = createMockTemplate();
      const updated = { ...template, name: 'Updated Template' };
      repository.findOne.mockResolvedValue(template);
      repository.merge.mockReturnValue(updated);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('template-1', 'company-1', {
        name: 'Updated Template',
      });
      expect(result.name).toBe('Updated Template');
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      const template = createMockTemplate();
      repository.findOne.mockResolvedValue(template);
      repository.remove.mockResolvedValue(template);

      const result = await service.remove('template-1', 'company-1');
      expect(repository.remove).toHaveBeenCalledWith(template);
      expect(result).toEqual({ deleted: true });
    });
  });
});
