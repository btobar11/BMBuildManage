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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../project.entity';

export class CreateProjectDto {
  @ApiPropertyOptional({
    description: 'ID de la empresa (auto-asignado desde el token)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  company_id?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente asociado al proyecto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'client_id debe ser un UUID válido' })
  client_id?: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Edificio Costanera Norte',
    maxLength: 300,
  })
  @IsString({ message: 'El nombre es requerido' })
  @MaxLength(300, { message: 'El nombre no puede exceder 300 caracteres' })
  name: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del proyecto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Dirección del proyecto',
    example: 'Av. Providencia 1234',
    maxLength: 500,
  })
  @IsString({ message: 'La dirección es requerida' })
  @MaxLength(500, { message: 'La dirección no puede exceder 500 caracteres' })
  address: string;

  @ApiProperty({
    description: 'Región del proyecto',
    example: 'Metropolitana de Santiago',
    maxLength: 100,
  })
  @IsString({ message: 'La región es requerida' })
  @MaxLength(100, { message: 'La región no puede exceder 100 caracteres' })
  region: string;

  @ApiProperty({
    description: 'Comuna del proyecto',
    example: 'Providencia',
    maxLength: 100,
  })
  @IsString({ message: 'La comuna es requerida' })
  @MaxLength(100, { message: 'La comuna no puede exceder 100 caracteres' })
  commune: string;

  @ApiPropertyOptional({
    description: 'Tipos de proyecto',
    example: ['Edificación', 'Habitacional'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: string[];

  @ApiPropertyOptional({
    description: 'Estado del proyecto',
    enum: ProjectStatus,
  })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Estado de proyecto no válido' })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del proyecto',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDate({ message: 'Fecha de inicio inválida' })
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de término estimada',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDate({ message: 'Fecha de término inválida' })
  @Type(() => Date)
  end_date?: Date;

  @ApiPropertyOptional({
    description: 'Presupuesto total en CLP (u otra divisa)',
    example: 150000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  @Max(999999999999, { message: 'El presupuesto excede el máximo permitido' })
  @Type(() => Number)
  budget?: number;

  @ApiPropertyOptional({
    description: 'Moneda del presupuesto estimado (CLP, UF, etc)',
    example: 'CLP',
  })
  @IsOptional()
  @IsString()
  budget_currency?: string;

  @ApiPropertyOptional({
    description: 'Precio estimado de venta',
    example: 180000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio estimado debe ser un número' })
  @Min(0, { message: 'El precio estimado no puede ser negativo' })
  @Max(999999999999, {
    message: 'El precio estimado excede el máximo permitido',
  })
  @Type(() => Number)
  estimated_price?: number;

  @ApiPropertyOptional({
    description: 'Moneda del precio estimado (CLP, UF, etc)',
    example: 'CLP',
  })
  @IsOptional()
  @IsString()
  price_currency?: string;

  @ApiPropertyOptional({
    description: 'Superficie estimada en m²',
    example: 2500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La superficie debe ser un número' })
  @Min(0, { message: 'La superficie no puede ser negativa' })
  @Max(999999, { message: 'La superficie excede el máximo permitido' })
  @Type(() => Number)
  estimated_area?: number;
}
