import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Logs one structured entry per HTTP response.
 *
 * Severity is derived from response status: 5xx as errors, 4xx as warnings,
 * and successful responses as info logs. Sensitive fields are filtered later by
 * the shared logger sanitization policy.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Registers a finish listener that logs request and response metadata.
   */
  use(request: Request, response: Response, next: NextFunction) {
    const startAt = process.hrtime();

    response.on('finish', () => {
      const userAgent = request.get('user-agent') || '';
      const contentLength = response.get('content-length');

      const timeDiff = process.hrtime(startAt);
      const responseTime = timeDiff[0] * 1e3 + timeDiff[1] * 1e-6;

      const context = {
        ip: request.ip,
        method: request.method,
        originalUrl: request.originalUrl,
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        contentLength,
        userAgent,
        cookies: request.cookies,
        signedCookies: request.signedCookies,
        headers: request.headers,
        params: request.params,
        body: request.body,
        responseTime,
      };

      const logMessage = `${request.method} ${response.statusCode} ${response.statusMessage} ${request.originalUrl}`;

      if (response.statusCode >= 500) {
        return this.logger.error(logMessage, LoggingMiddleware.name, context);
      }

      if (response.statusCode >= 400) {
        return this.logger.warn(logMessage, LoggingMiddleware.name, context);
      }

      return this.logger.log(logMessage, LoggingMiddleware.name, context);
    });

    next();
  }
}
