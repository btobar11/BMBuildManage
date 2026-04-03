import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  unit: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  default_price?: number;

  @IsString()
  @IsOptional()
  supplier?: string;
}
