import { FactoryProvider } from '@nestjs/common';

/**
 * Injection token for the resolved OpenAI module configuration.
 */
export const OPEN_AI_MODULE_OPTIONS = Symbol('OPEN_AI_MODULE_OPTIONS');

/**
 * Runtime settings used to initialize the OpenAI SDK client.
 */
export type OpenAiModuleOptions = {
  apiKey: string;
  modelAllowlist: string[];
  timeoutMs?: number;
};

/**
 * Async Nest registration factory for `OpenAiModule`.
 */
export type OpenAiModuleAsyncOptions = Pick<
  FactoryProvider<OpenAiModuleOptions>,
  'inject' | 'useFactory'
>;
