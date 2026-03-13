import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { BudgetStatus } from '../budget.entity';

export class CreateBudgetDto {
  @IsString()
  project_id: string;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  total_estimated_cost?: number;

  @IsOptional()
  @IsNumber()
  total_estimated_price?: number;
}
