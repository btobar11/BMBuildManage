import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  IsUUID,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export const CHILEAN_RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

export class CreateCompanyDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(CHILEAN_RUT_REGEX, {
    message: 'RUT debe tener formato chileno: XX.XXX.XXX-X',
  })
  rut?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  tax_id?: string;

  @IsOptional()
  @IsString()
  legal_type?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  created_by_user_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, {
    message: 'Debes seleccionar al menos un tipo de construcción',
  })
  industry?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challenges?: string[];
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
