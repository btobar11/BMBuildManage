import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ResourceType } from '../resource.entity';

export class CreateResourceDto {
  @IsOptional()
  @IsString()
  company_id?: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsOptional()
  @IsString()
  unit_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  base_price: number;
}
