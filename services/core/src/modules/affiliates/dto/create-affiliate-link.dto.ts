import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsUrl({}, { message: 'landingUrl must be a valid URL' })
  landingUrl!: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsString()
  @MaxLength(64)
  referralCode!: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
