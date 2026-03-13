import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  company_id: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
