export default () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  app: {
    affiliateBaseUrl: process.env.AFFILIATE_APP_URL ?? 'http://localhost:3000'
  },
  database: {
    url: process.env.DATABASE_URL ?? ''
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d'
  },
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '600', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10)
  },
  notifications: {
    sendgridApiKey: process.env.SENDGRID_API_KEY ?? '',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL ?? '',
    smsProvider: process.env.SMS_PROVIDER ?? 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? ''
    }
  },
  firebase: {
    projectId:
      process.env.FIREBASE_PROJECT_ID ??
      process.env.GCS_PROJECT_ID ??
      undefined,
    clientEmail:
      process.env.FIREBASE_CLIENT_EMAIL ??
      process.env.GCS_CLIENT_EMAIL ??
      undefined,
    privateKey:
      process.env.FIREBASE_PRIVATE_KEY ??
      process.env.GCS_PRIVATE_KEY ??
      undefined
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    pretty: process.env.LOG_PRETTY === 'true'
  },
  security: {
    cookieDomain: process.env.COOKIE_DOMAIN ?? '',
    saltRounds: parseInt(process.env.SALT_ROUNDS ?? '12', 10)
  },
  shopify: {
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET ?? ''
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '120', 10),
    authTtl: parseInt(process.env.RATE_LIMIT_AUTH_TTL ?? '60', 10),
    authLimit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT ?? '10', 10)
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID ?? undefined,
    bucket: process.env.GCS_BUCKET ?? '',
    clientEmail: process.env.GCS_CLIENT_EMAIL ?? undefined,
    privateKey: process.env.GCS_PRIVATE_KEY ?? undefined,
    credentialsPath: process.env.GCS_CREDENTIALS_PATH ?? undefined
  },
  tracking: {
    fallbackUrl: process.env.TRACKING_FALLBACK_URL ?? 'https://starshieldpaints.com',
    baseUrl:
      process.env.TRACKING_BASE_URL ?? process.env.AFFILIATE_APP_URL ?? 'http://localhost:4000'
  }
});
