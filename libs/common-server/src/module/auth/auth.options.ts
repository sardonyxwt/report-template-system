import { FactoryProvider } from '@nestjs/common';

export const AUTH_MODULE_OPTIONS = Symbol('AUTH_MODULE_OPTIONS');

export type AuthModuleOptions = {
  cookieSecret: string;
  cookieSecure: boolean;
  cookieDomain: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtSecretExpires: number;
  jwtRefreshSecretExpires: number;
};

export type AuthModuleAsyncOptions = Pick<
  FactoryProvider<AuthModuleOptions>,
  'inject' | 'useFactory'
>;
