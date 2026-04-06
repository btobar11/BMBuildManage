import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';
import { ItemType, CubicationMode } from '../item.entity';

export class CreateItemDto {
  @IsString()
  stage_id: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cost_code?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  apu_template_id?: string;

  @IsOptional()
  @IsEnum(CubicationMode)
  cubication_mode?: CubicationMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dim_length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dim_width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dim_height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dim_thickness?: number;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  ifc_global_id?: string;

  @IsOptional()
  geometry_data?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity_executed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  real_cost?: number;

  @IsOptional()
  is_price_overridden?: boolean;
}
