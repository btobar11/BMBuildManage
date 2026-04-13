import {
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
