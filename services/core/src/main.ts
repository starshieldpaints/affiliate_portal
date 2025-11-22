import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { json } from "express";
import type { Request } from "express";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

function buildCorsOrigins() {
  const configuredOrigins =
    process.env.CORS_ORIGIN?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const allowAny = configuredOrigins.includes("*");

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

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "https:", "data:"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                connectSrc: ["'self'", process.env.AFFILIATE_APP_URL ?? ""]
              }
            }
          : false,
      hsts: process.env.NODE_ENV === "production"
    })
  );
  app.use(
    json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      }
    })
  );
  app.enableCors({
    origin: buildCorsOrigins(),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`dYs? Core API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Bootstrap failure", error);
  process.exit(1);
});
