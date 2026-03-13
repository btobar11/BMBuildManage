import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateWorkerDto {
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
}
