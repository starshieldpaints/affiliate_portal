import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { json } from 'express';
import type { Request } from 'express';
import { AppModule } from './app.module';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

function buildCorsOrigins() {
  const configuredOrigins =
    process.env.CORS_ORIGIN?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const allowAny = configuredOrigins.includes('*');

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowAny) {
      return callback(null, true);
    }
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (/^https?:\/\/localhost(?::\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin ${origin} is not allowed`));
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(
    json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      }
    })
  );
  app.enableCors({
    origin: buildCorsOrigins(),
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    forbidNonWhitelisted:true,
    transform:true
  }))

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Core API running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error(error, 'Bootstrap');
  process.exit(1);
});
