import { IsUUID, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateContingencyDto {
  @IsUUID()
  project_id: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number;
}
