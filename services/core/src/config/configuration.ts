export default () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL ?? ''
  },
  jwt: {
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d'
  },
  security: {
    cookieDomain: process.env.COOKIE_DOMAIN ?? '',
    saltRounds: parseInt(process.env.SALT_ROUNDS ?? '12', 10)
  }
});
