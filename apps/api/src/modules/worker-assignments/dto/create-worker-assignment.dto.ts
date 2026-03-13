import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateWorkerAssignmentDto {
  @IsString()
  worker_id: string;

  @IsString()
  project_id: string;

  @IsNumber()
  daily_rate: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
