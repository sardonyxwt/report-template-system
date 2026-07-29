import { FactoryProvider } from '@nestjs/common';

/**
 * Injection token for the resolved authentication module configuration.
 */
export const AUTH_MODULE_OPTIONS = Symbol('AUTH_MODULE_OPTIONS');

/**
 * Cookie and JWT settings required by the authentication infrastructure.
 */
export type AuthModuleOptions = {
  cookieSecret: string;
  cookieSecure: boolean;
  cookieDomain: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtSecretExpires: number;
  jwtRefreshSecretExpires: number;
};

/**
 * Async Nest registration factory for `AuthModule`.
 */
export type AuthModuleAsyncOptions = Pick<
  FactoryProvider<AuthModuleOptions>,
  'inject' | 'useFactory'
>;
