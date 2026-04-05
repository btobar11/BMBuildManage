import { IsString, IsUUID } from 'class-validator';

export class CreateClashJobDto {
  @IsUUID()
  project_id!: string;

  @IsUUID()
  model_a_id!: string;

  @IsUUID()
  model_b_id!: string;

  company_id?: string;
}
