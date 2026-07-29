import { FactoryProvider } from '@nestjs/common';

/**
 * Injection token for the resolved Prisma module configuration.
 */
export const PRISMA_MODULE_OPTIONS = Symbol('PRISMA_MODULE_OPTIONS');

/**
 * Connection settings required to initialize the shared Prisma client.
 */
export type PrismaModuleOptions = {
  databaseUrl: string;
};

/**
 * Async Nest registration factory for `PrismaModule`.
 */
export type PrismaModuleAsyncOptions = Pick<
  FactoryProvider<PrismaModuleOptions>,
  'inject' | 'useFactory'
>;
