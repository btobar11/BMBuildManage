import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateWorkerDto {
  @IsOptional()
  @IsString()
  company_id: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @IsOptional()
  @IsNumber()
  daily_rate?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
