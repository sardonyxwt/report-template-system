import { FactoryProvider } from '@nestjs/common';
import { transport as WinstonTransport } from 'winston';
import { AppLoggerLevel } from 'platform/common-base';

export const COMMON_MODULE_OPTIONS = Symbol('COMMON_MODULE_OPTIONS');

export type CommonModuleOptions = {
  logger: {
    level?: AppLoggerLevel;
    transports?: WinstonTransport[];
  };
};

export type CommonModuleAsyncOptions = Pick<
  FactoryProvider<CommonModuleOptions>,
  'inject' | 'useFactory'
>;
