import {
  IsUUID,
  IsArray,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateFederatedClashJobDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  federation_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tolerance_mm?: number = 10;

  @IsArray()
  @IsEnum(
    [
      'architecture',
      'structure',
      'mep_hvac',
      'mep_plumbing',
      'mep_electrical',
      'topography',
      'landscape',
    ],
    { each: true },
  )
  enabled_disciplines: string[];

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity_threshold?: string = 'medium';
}
