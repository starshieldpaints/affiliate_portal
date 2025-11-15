import { VerificationTarget } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, ValidateIf } from 'class-validator';

export class SendVerificationDto {
  @IsEnum(VerificationTarget)
  type!: VerificationTarget;

  @ValidateIf((dto) => dto.type === VerificationTarget.email)
  @IsEmail()
  @IsString()
  email?: string;

  @ValidateIf((dto) => dto.type === VerificationTarget.phone)
  @IsPhoneNumber()
  @IsNotEmpty()
  phone?: string;
}
