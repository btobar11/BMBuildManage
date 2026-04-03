import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExecutionLogDto {
  @IsUUID()
  budget_item_id: string;

  @IsNumber()
  @Min(0)
  quantity_executed: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  real_cost?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
