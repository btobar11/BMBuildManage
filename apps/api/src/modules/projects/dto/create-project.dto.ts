import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  IsUUID,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(500)
  address: string;

  @IsString()
  @MaxLength(100)
  region: string;

  @IsString()
  @MaxLength(100)
  commune: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  start_date?: string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999999)
  @Type(() => Number)
  budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999999)
  @Type(() => Number)
  estimated_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  @Type(() => Number)
  estimated_area?: number | null;
}