import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectStatus } from '../project.entity';

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  company_id?: string;

  @IsOptional()
  @IsString()
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
  commune: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: string[];

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_price?: number;
}
