import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { RfiStatus, RfiPriority } from '../rfi.entity';

export class UpdateRfiDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  question?: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsString()
  @IsOptional()
  answered_by?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsDateString()
  @IsOptional()
  answered_at?: string;

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
