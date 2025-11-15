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
    origin: process.env.CORS_ORIGIN?.split(',') ?? [],
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
