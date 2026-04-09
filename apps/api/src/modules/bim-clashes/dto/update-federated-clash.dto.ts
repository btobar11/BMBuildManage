import { IsOptional, IsEnum, IsString, IsEmail } from 'class-validator';

export class UpdateFederatedClashDto {
  @IsOptional()
  @IsEnum(['open', 'assigned', 'resolved', 'ignored'])
  status?: string;

  @IsOptional()
  @IsEmail()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  resolution_notes?: string;
}

export class AddClashCommentDto {
  @IsString()
  content: string;

  @IsEmail()
  author_email: string;

  @IsOptional()
  @IsString()
  author_name?: string;
}
