import { FactoryProvider } from '@nestjs/common';

export const PRISMA_MODULE_OPTIONS = Symbol('PRISMA_MODULE_OPTIONS');

export type PrismaModuleOptions = {
  databaseUrl: string;
};

export type PrismaModuleAsyncOptions = Pick<
  FactoryProvider<PrismaModuleOptions>,
  'inject' | 'useFactory'
>;
