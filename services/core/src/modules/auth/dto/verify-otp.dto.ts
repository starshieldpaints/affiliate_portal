import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { SendVerificationDto } from './send-verification.dto';

export class VerifyOtpDto extends SendVerificationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,8}$/, { message: 'OTP must be a 4-8 digit code' })
  code!: string;
}
