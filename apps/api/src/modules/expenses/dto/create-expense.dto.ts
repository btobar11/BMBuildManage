import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ExpenseType } from '../expense.entity';

export class CreateExpenseDto {
  @IsString()
  project_id: string;

  @IsOptional()
  @IsString()
  company_id: string;

  @IsOptional()
  @IsString()
  item_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsEnum(ExpenseType)
  expense_type?: ExpenseType;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  document_url?: string;

  @IsOptional()
  @IsString()
  document_id?: string;
}
