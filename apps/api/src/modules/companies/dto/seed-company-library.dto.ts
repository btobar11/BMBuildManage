import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { CompanySpecialty, SeismicZone } from '../company.entity';

export class SeedCompanyLibraryDto {
  @IsEnum(CompanySpecialty)
  specialty: CompanySpecialty;

  @IsOptional()
  @IsEnum(SeismicZone)
  seismic_zone?: SeismicZone;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  region_code?: string = 'CL-RM';
}
