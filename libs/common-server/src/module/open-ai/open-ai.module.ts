import { DynamicModule, Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import {
  OPEN_AI_MODULE_OPTIONS,
  OpenAiModuleAsyncOptions,
  OpenAiModuleOptions,
} from './open-ai.options';
import { OpenAiService } from './open-ai.service';

/**
 * Global infrastructure module that configures and exports `OpenAiService`.
 */
@Module({})
export class OpenAiModule {
  private static readonly PROVIDERS = [
    OpenAiService,
  ] satisfies ModuleMetadata['providers'];

  /**
   * Registers the module from an already resolved options object.
   */
  static register(options: OpenAiModuleOptions): DynamicModule {
    return this.registerAsync({ useFactory: () => options });
  }

  /**
   * Registers the module using dependency-injected async configuration.
   */
  static registerAsync(options: OpenAiModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: OpenAiModule,
      providers: [
        {
          provide: OPEN_AI_MODULE_OPTIONS,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        ...OpenAiModule.PROVIDERS,
      ],
      exports: OpenAiModule.PROVIDERS,
    };
  }
}

export * from './open-ai.options';
export * from './open-ai.service';
