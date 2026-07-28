import { DynamicModule, ForwardReference, Logger, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

type IEntryNestModule =
  | Type
  | DynamicModule
  | ForwardReference
  | Promise<IEntryNestModule>;

/**
 * Creates the Nest Express application with platform-specific bootstrap flags.
 *
 * The default Nest logger is disabled because `LoggerService` is installed from
 * `CommonModule` after dependency injection is ready.
 */
export const createApp = async (module: IEntryNestModule) => {
  return NestFactory.create<NestExpressApplication>(module, { logger: false });
};

/**
 * Applies process-level application configuration before listening.
 */
export const configureApp = (
  app: NestExpressApplication,
): NestExpressApplication => {
  app.enableShutdownHooks();
  return app;
};

/**
 * Starts the HTTP listener from the validated configuration and switches Nest to
 * the injected application logger.
 */
export const startApp = async (app: NestExpressApplication) => {
  const config = app.get<ConfigService>(ConfigService);
  const logger = app.get(Logger);

  await app.listen(config.getOrThrow('PORT'), config.getOrThrow('HOST'));

  app.useLogger(logger);
};
