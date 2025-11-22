import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    this.logger.error(
      {
        err: exception,
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id']
      },
      'Request failed'
    );

    response.status(status).json({
      statusCode: status,
      message: responseBody,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
