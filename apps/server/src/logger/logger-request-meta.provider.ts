import { Inject } from '@nestjs/common';
import { AppLoggerMeta } from 'platform/common-base';
import {
  InjectableLoggerMetaProvider,
  LoggerMetaProvider,
  RequestService,
} from 'platform/common-server';

/**
 * Adds the request id from `RequestService` to log entries.
 */
@InjectableLoggerMetaProvider()
export class LoggerRequestMetaProvider implements LoggerMetaProvider {
  constructor(
    @Inject(RequestService)
    private readonly requestService: RequestService,
  ) {}

  /**
   * Returns request metadata when code runs inside an HTTP request scope.
   */
  getLoggerMeta(): AppLoggerMeta {
    const id = this.requestService.requestId;

    return id ? { request: { id } } : {};
  }
}
