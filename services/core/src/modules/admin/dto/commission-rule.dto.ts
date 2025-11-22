import { IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCommissionRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsIn(['percent', 'fixed'])
  rateType!: 'percent' | 'fixed';

  @IsNumber()
  rateValue!: number;

  @IsBoolean()
  @IsOptional()
  excludeTaxShipping?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  conditions?: unknown;

  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  productIds?: string[];

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}

export class UpdateCommissionRuleDto extends PartialType(CreateCommissionRuleDto) {}
