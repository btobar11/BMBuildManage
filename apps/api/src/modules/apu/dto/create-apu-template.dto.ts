import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../../resources/resource.entity';

export class CreateApuResourceDto {
  @IsUUID()
  resource_id: string;

  @IsEnum(ResourceType)
  resource_type: ResourceType;

  @IsNumber()
  @Min(0)
  coefficient: number;
}

export class CreateApuTemplateDto {
  @IsOptional()
  @IsString()
  company_id?: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  unit_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApuResourceDto)
  apu_resources?: CreateApuResourceDto[];
}
