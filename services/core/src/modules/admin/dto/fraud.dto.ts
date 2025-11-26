import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListFraudAlertsDto {
  @IsOptional()
  @IsEnum(['open', 'resolved', 'all'] as any)
  status?: 'open' | 'resolved' | 'all';

  @IsOptional()
  @IsString()
  type?: string;
}

export class ResolveFraudAlertDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
