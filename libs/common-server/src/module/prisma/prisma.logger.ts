import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'platform/prisma';
import type { PrismaClientLogger } from './prisma.provider';

/**
 * Adapts Prisma query/log events to the application logger.
 *
 * Query logs are emitted at a verbose level, so they are available in development
 * and troubleshooting without being treated as warnings or errors.
 */
@Injectable()
export class PrismaLogger implements PrismaClientLogger {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  /**
   * Logs a Prisma query event including target, duration, query, and params.
   */
  logQuery = (event: Prisma.QueryEvent) => {
    this.logger.verbose(
      `${event.target} -- ${event.duration} -- ${event.query} -- Parameters: ${
        JSON.stringify(event.params) ?? 'none'
      }`,
      'Prisma',
    );
  };

  /**
   * Maps Prisma log severity to the platform logger severity.
   */
  log = (level: 'info' | 'warn' | 'error', event: Prisma.LogEvent) => {
    const message = `${event.target} - ${event.message}`;
    if (level === 'info') {
      this.logger.verbose(message, 'Prisma');
    } else if (level === 'warn') {
      this.logger.warn(message, 'Prisma');
    } else if (level === 'error') {
      this.logger.error(message, 'Prisma');
    }
  };
}
