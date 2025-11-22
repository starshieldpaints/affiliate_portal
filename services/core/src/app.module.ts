import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AdminModule } from './modules/admin/admin.module';
import { ShopifyModule } from './modules/shopify/shopify.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { level, pretty } = configService.get('logging') ?? { level: 'info', pretty: false };
        return {
          pinoHttp: {
            level,
            // generate/propagate request ids and redact sensitive info
            genReqId: (req, res) => {
              const existing = req.headers['x-request-id'] as string | undefined;
              if (existing) {
                res.setHeader('x-request-id', existing);
                return existing;
              }
              const id = randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            transport:
              process.env.NODE_ENV === 'development' || pretty
                ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
                : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.token',
                'req.body.accessToken',
                'req.body.refreshToken'
              ],
              remove: true
            }
          }
        };
      }
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rateLimit = configService.get('rateLimit');
        return [
          {
            name: 'default',
            ttl: rateLimit?.ttl ?? 60,
            limit: rateLimit?.limit ?? 120
          },
          {
            name: 'auth',
            ttl: rateLimit?.authTtl ?? rateLimit?.ttl ?? 60,
            limit: rateLimit?.authLimit ?? 10
          }
        ];
      }
    }),
    PrismaModule,
    AuthModule,
    AffiliatesModule,
    CatalogModule,
    PayoutsModule,
    AdminModule,
    ShopifyModule,
    TrackingModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {}
