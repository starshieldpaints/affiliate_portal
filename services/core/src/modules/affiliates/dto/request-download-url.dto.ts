import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestDownloadUrlDto {
  @IsString()
  @MinLength(3)
  @MaxLength(512)
  objectName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  purpose?: string;
}
