import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ExpenseType } from '../expense.entity';

export class CreateExpenseDto {
  @IsString()
  project_id: string;

  @IsOptional()
  @IsString()
  item_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(ExpenseType)
  expense_type?: ExpenseType;

  @IsDateString()
  date: string;
}
