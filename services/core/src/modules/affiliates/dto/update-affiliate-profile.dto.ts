import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class UpdateAffiliateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  payoutMethod?: string | null;

  @IsOptional()
  @IsObject()
  payoutDetails?: Record<string, unknown> | null;

  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(16)
  panNumber?: string;
}
