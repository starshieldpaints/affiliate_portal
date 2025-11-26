import { IsArray, IsDateString, IsOptional, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';

export class CreatePayoutBatchDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  affiliateIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}

export class UpdateBatchStatusDto {
  @IsString()
  status!: 'processing' | 'paid' | 'failed';

  @IsOptional()
  @IsString()
  providerBatchId?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class ReconcileBatchDto {
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
