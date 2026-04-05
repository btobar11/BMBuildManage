import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateClashDto {
  @IsOptional()
  @IsEnum(['pending', 'accepted', 'resolved', 'ignored'])
  status?: 'pending' | 'accepted' | 'resolved' | 'ignored';

  @IsOptional()
  @IsString()
  resolution_notes?: string;

  @IsOptional()
  @IsString()
  resolved_by?: string;
}
