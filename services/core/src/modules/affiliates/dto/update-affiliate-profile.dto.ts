import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator';
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

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10)
  panNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(12)
  aadhaarNumber!: string;

  @IsString()
  @IsNotEmpty()
  panImageUrl!: string;

  @IsString()
  @IsNotEmpty()
  aadhaarFrontUrl!: string;

  @IsString()
  @IsNotEmpty()
  aadhaarBackUrl!: string;
}
