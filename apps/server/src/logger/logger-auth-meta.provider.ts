import { Inject } from '@nestjs/common';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { AppLoggerMeta } from 'platform/common-base';
import {
  InjectableLoggerMetaProvider,
  LoggerMetaProvider,
  SessionService,
} from 'platform/common-server';

/**
 * Adds authenticated user identity to log context when a session is active.
 *
 * Only operational identifiers are included; credential and token fields remain
 * excluded by the logger sanitization policy.
 */
@InjectableLoggerMetaProvider()
export class LoggerAuthMetaProvider implements LoggerMetaProvider {
  constructor(
    @Inject(SessionService)
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Returns user metadata for the current request scope.
   */
  getLoggerMeta(): AppLoggerMeta {
    const user = this.sessionService.user;

    if (!user) {
      return {};
    }

    return {
      auth: omitBy(
        {
          id: user.id,
          role: user.role,
          fullName: user.fullName,
        },
        isNil,
      ),
    };
  }
}
