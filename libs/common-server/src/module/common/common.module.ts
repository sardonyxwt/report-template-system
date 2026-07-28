import {
  DynamicModule,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import {
  COMMON_MODULE_OPTIONS,
  CommonModuleAsyncOptions,
  CommonModuleOptions,
} from './common.options';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { RequestMiddleware } from './middleware/request.middleware';
import { LoggerService } from './service/logger.service';
import { OpenapiService } from './service/openapi.service';
import { RequestService } from './service/request.service';
import { WalkerService } from './service/walker.service';

/**
 * Global shared infrastructure module.
 *
 * It provides logging, request ids, OpenAPI discovery, encryption, image
 * processing, scheduled jobs support, and Nest discovery helpers used by other
 * modules.
 */
@Module({})
export class CommonModule implements NestModule {
  private static readonly IMPORTS = [
    DiscoveryModule,
    ScheduleModule.forRoot(),
  ] satisfies ModuleMetadata['imports'];

  private static readonly PROVIDERS = [
    WalkerService,
    RequestService,
    OpenapiService,
    {
      provide: Logger,
      useClass: LoggerService,
    },
  ] satisfies ModuleMetadata['providers'];

  private static readonly EXPORTS = [
    COMMON_MODULE_OPTIONS,
    WalkerService,
    RequestService,
    OpenapiService,
    {
      provide: Logger,
      useClass: LoggerService,
    },
  ] satisfies ModuleMetadata['exports'];

  /**
   * Registers common infrastructure with already resolved options.
   */
  static register(options: CommonModuleOptions): DynamicModule {
    return this.registerAsync({ useFactory: () => options });
  }

  /**
   * Registers common infrastructure from async module options.
   */
  static registerAsync(options: CommonModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: CommonModule,
      imports: CommonModule.IMPORTS,
      providers: [
        {
          provide: COMMON_MODULE_OPTIONS,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        ...CommonModule.PROVIDERS,
      ],
      exports: CommonModule.EXPORTS,
    };
  }

  /**
   * Installs request id and HTTP logging middleware globally.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMiddleware, LoggingMiddleware).forRoutes('*');
  }
}

export * from './common.options';
export * from './common.types';
export * from './decorators/logger.decorators';
export * from './decorators/endpoint.decorators';
export * from './middleware/logging.middleware';
export * from './middleware/request.middleware';
export * from './service/logger.service';
export * from './service/openapi.service';
export * from './service/request.service';
export * from './service/walker.service';
