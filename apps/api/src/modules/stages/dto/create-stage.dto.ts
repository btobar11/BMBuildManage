import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateStageDto {
  @IsString()
  budget_id: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}
