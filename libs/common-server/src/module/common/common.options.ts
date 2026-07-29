import { FactoryProvider } from '@nestjs/common';
import { transport as WinstonTransport } from 'winston';
import { AppLoggerLevel } from 'platform/common-base';

/**
 * Injection token for the resolved common infrastructure configuration.
 */
export const COMMON_MODULE_OPTIONS = Symbol('COMMON_MODULE_OPTIONS');

/**
 * Logger settings consumed by `CommonModule`.
 */
export type CommonModuleOptions = {
  logger: {
    level?: AppLoggerLevel;
    transports?: WinstonTransport[];
  };
};

/**
 * Async Nest registration factory for `CommonModule`.
 */
export type CommonModuleAsyncOptions = Pick<
  FactoryProvider<CommonModuleOptions>,
  'inject' | 'useFactory'
>;
