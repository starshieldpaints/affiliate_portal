import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minNumbers: 1, minUppercase: 1, minSymbols: 1 })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @IsNotEmpty()
  displayName!: string;

  @IsPhoneNumber()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  @IsBoolean()
  termsAccepted!: boolean;
}
