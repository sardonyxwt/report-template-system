import { DynamicModule, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { APP_FILTER } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './filter/prisma-client-exception.filter';
import { PrismaLogger } from './prisma.logger';
import {
  PRISMA_MODULE_OPTIONS,
  PrismaModuleAsyncOptions,
  PrismaModuleOptions,
} from './prisma.options';
import { PrismaClient, PrismaProvider } from './prisma.provider';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma infrastructure module.
 *
 * It creates the shared Prisma client, connects it to structured logging,
 * exposes transaction helpers, and installs the Prisma exception filter.
 */
@Module({})
export class PrismaModule {
  private static readonly PROVIDERS = [
    PrismaLogger,
    PrismaProvider,
    PrismaService,
    {
      provide: PrismaClient,
      inject: [PrismaProvider],
      useFactory: (provider: PrismaProvider) => provider.client,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ] satisfies ModuleMetadata['providers'];

  private static readonly EXPORTS = [
    PrismaClient,
    PrismaService,
  ] satisfies ModuleMetadata['exports'];

  /**
   * Registers Prisma infrastructure with already resolved options.
   */
  static register(options: PrismaModuleOptions): DynamicModule {
    return this.registerAsync({ useFactory: () => options });
  }

  /**
   * Registers Prisma infrastructure from async module options.
   */
  static registerAsync(options: PrismaModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: PrismaModule,
      providers: [
        {
          provide: PRISMA_MODULE_OPTIONS,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        ...PrismaModule.PROVIDERS,
      ],
      exports: PrismaModule.EXPORTS,
    };
  }
}

export * from './filter/prisma-client-exception.filter';
export * from './prisma.provider';
export * from './prisma.logger';
export * from './prisma.options';
export * from './prisma.service';
