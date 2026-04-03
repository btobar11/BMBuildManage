import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateWorkerAssignmentDto {
  @IsString()
  worker_id: string;

  @IsString()
  project_id: string;

  @IsNumber()
  @Min(0)
  daily_rate: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_paid?: number;
}
