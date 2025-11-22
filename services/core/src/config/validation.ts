import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync
} from 'class-validator';

const Environments = ['development', 'staging', 'production'] as const;
type Environment = (typeof Environments)[number];

class EnvironmentVariables {
  @IsIn(Environments as readonly string[])
  NODE_ENV!: Environment;

  @IsNumber()
  PORT!: number;

  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  AFFILIATE_APP_URL?: string;

  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL?: string;

  @IsNumber()
  @IsOptional()
  OTP_TTL_SECONDS?: number;

  @IsNumber()
  @IsOptional()
  OTP_MAX_ATTEMPTS?: number;

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_EMAIL?: string;

  @IsString()
  @IsOptional()
  SMS_PROVIDER?: string;

  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID?: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN?: string;

  @IsString()
  @IsOptional()
  TWILIO_FROM_NUMBER?: string;

  @IsString()
  @IsOptional()
  SHOPIFY_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  TRACKING_FALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  TRACKING_BASE_URL?: string;

  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  @IsNumber()
  @IsOptional()
  SALT_ROUNDS?: number;

  @IsString()
  @IsOptional()
  GCS_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  GCS_BUCKET?: string;

  @IsString()
  @IsOptional()
  GCS_CLIENT_EMAIL?: string;

  @IsString()
  @IsOptional()
  GCS_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  GCS_CREDENTIALS_PATH?: string;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL?: number;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_LIMIT?: number;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_AUTH_TTL?: number;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_AUTH_LIMIT?: number;

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string;

  @IsBoolean()
  @IsOptional()
  LOG_PRETTY?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
