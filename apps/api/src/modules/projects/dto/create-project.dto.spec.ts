import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  IsArray,
  IsUUID,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../project.entity';

describe('CreateProjectDto', () => {
  const createDto = () => ({
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    client_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Project',
    description: 'Test description',
    address: 'Test Address',
    region: 'Test Region',
    commune: 'Test Commune',
    type: ['Commercial', 'Residential'],
    folder: '/test',
    status: ProjectStatus.DRAFT,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-01-01'),
    budget: 1000000,
    budget_currency: 'CLP',
    estimated_price: 1500000,
    price_currency: 'CLP',
    estimated_area: 5000,
  });

  it('should accept valid project data', () => {
    const dto = createDto();
    expect(dto.name).toBe('Test Project');
    expect(dto.status).toBe(ProjectStatus.DRAFT);
    expect(dto.budget).toBe(1000000);
  });

  it('should handle optional fields', () => {
    const dto = {
      name: 'Test',
      address: 'Address',
      region: 'Region',
      commune: 'Commune',
    };
    expect(dto.name).toBe('Test');
  });

  it('should handle status enum', () => {
    expect(ProjectStatus.DRAFT).toBe('draft');
    expect(ProjectStatus.SENT).toBe('sent');
    expect(ProjectStatus.APPROVED).toBe('approved');
    expect(ProjectStatus.IN_PROGRESS).toBe('in_progress');
    expect(ProjectStatus.COMPLETED).toBe('completed');
  });

  it('should handle currency fields', () => {
    const dto = createDto();
    expect(dto.budget_currency).toBe('CLP');
    expect(dto.price_currency).toBe('CLP');
  });

  it('should handle array type field', () => {
    const dto = createDto();
    expect(dto.type).toEqual(['Commercial', 'Residential']);
  });

  it('should handle date fields', () => {
    const dto = createDto();
    expect(dto.start_date).toEqual(new Date('2024-01-01'));
    expect(dto.end_date).toEqual(new Date('2025-01-01'));
  });
});

describe('UpdateProjectDto', () => {
  it('should allow partial updates', () => {
    const dto = { name: 'Updated Name' };
    expect(dto.name).toBe('Updated Name');
  });

  it('should allow updating multiple fields', () => {
    const dto = {
      name: 'Updated',
      description: 'New description',
      status: ProjectStatus.IN_PROGRESS,
    };
    expect(dto.name).toBe('Updated');
    expect(dto.status).toBe(ProjectStatus.IN_PROGRESS);
  });
});
