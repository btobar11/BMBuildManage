import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  project_id: string;

  @IsString()
  supplier: string;

  @IsString()
  invoice_number: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  file_url?: string;
}
