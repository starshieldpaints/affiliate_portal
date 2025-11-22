import { IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { SendVerificationDto } from './send-verification.dto';

export class VerifyOtpDto extends SendVerificationDto {
  @ValidateIf((dto) => !dto.firebaseIdToken)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,8}$/, { message: 'OTP must be a 4-8 digit code' })
  code?: string;

  @ValidateIf((dto) => !dto.code)
  @IsString()
  @IsOptional()
  firebaseIdToken?: string;
}
