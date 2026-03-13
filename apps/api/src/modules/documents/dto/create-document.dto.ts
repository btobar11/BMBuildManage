import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { DocumentType } from '../document.entity';

export class CreateDocumentDto {
  @IsString()
  project_id: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsString()
  file_url: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;
}
