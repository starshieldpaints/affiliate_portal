import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CommissionRuleScopeDto {
  @IsEnum(['product', 'category', 'affiliate', 'country', 'global'], {
    message: 'Scope type must be one of product, category, affiliate, country, or global'
  })
  type!: 'product' | 'category' | 'affiliate' | 'country' | 'global';

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class CreateCommissionRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsNumber()
  rate!: number;

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
  @ValidateNested({ each: true })
  @Type(() => CommissionRuleScopeDto)
  scopes?: CommissionRuleScopeDto[];
}
