import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMachineryDto {
  @IsUUID()
  company_id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price_per_hour?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price_per_day?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
