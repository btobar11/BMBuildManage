import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetStatus } from '../budget.entity';

class CreateItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  apu_template_id?: string;

  @IsOptional()
  @IsString()
  cubication_mode?: string;

  @IsOptional()
  @IsNumber()
  dim_length?: number;

  @IsOptional()
  @IsNumber()
  dim_width?: number;

  @IsOptional()
  @IsNumber()
  dim_height?: number;

  @IsOptional()
  @IsNumber()
  dim_thickness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity_executed?: number;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsString()
  geometry_data?: string;
}

class CreateStageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items?: CreateItemDto[];
}

export class CreateBudgetDto {
  @IsString()
  project_id: string;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_estimated_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_estimated_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  professional_fee_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_utility?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markup_percentage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];
}
