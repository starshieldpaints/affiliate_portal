export default () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  app: {
    affiliateBaseUrl: process.env.AFFILIATE_APP_URL ?? 'http://localhost:3000'
  },
  database: {
    url: process.env.DATABASE_URL ?? ''
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
  security: {
    cookieDomain: process.env.COOKIE_DOMAIN ?? '',
    saltRounds: parseInt(process.env.SALT_ROUNDS ?? '12', 10)
  },
  shopify: {
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET ?? ''
  },
  tracking: {
    fallbackUrl: process.env.TRACKING_FALLBACK_URL ?? 'https://starshieldpaints.com',
    baseUrl:
      process.env.TRACKING_BASE_URL ?? process.env.AFFILIATE_APP_URL ?? 'http://localhost:4000'
  }
});
