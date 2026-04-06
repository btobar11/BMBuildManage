import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { RfiStatus, RfiPriority } from '../rfi.entity';

export class CreateRfiDto {
  @IsString()
  project_id!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  submitted_by?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsEnum(RfiStatus)
  @IsOptional()
  status?: RfiStatus;

  @IsEnum(RfiPriority)
  @IsOptional()
  priority?: RfiPriority;

  @IsString()
  @IsOptional()
  category?: string;
}
