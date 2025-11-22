import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestUploadUrlDto {
  @IsString()
  @MaxLength(128)
  fileName!: string;

  @IsString()
  @MaxLength(64)
  mimeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  purpose?: string;
}
