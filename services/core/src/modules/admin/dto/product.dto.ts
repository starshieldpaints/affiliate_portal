import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MinLength
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @MinLength(3)
  currency!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsUrl()
  landingUrl?: string | null;

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends CreateProductDto {}
