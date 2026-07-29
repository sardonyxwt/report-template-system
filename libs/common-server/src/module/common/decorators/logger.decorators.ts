import { applyDecorators, Injectable } from '@nestjs/common';
import { InjectableOptions } from '@nestjs/common/decorators/core/injectable.decorator';
import { Reflector } from '@nestjs/core';
import { AppLoggerMeta } from 'platform/common-base';

/**
 * Provider contract for metadata merged into structured application logs.
 */
export type LoggerMetaProvider = {
  getLoggerMeta: () => AppLoggerMeta;
};

/**
 * Marks a provider for discovery by the shared logger service.
 */
export const SetLoggerMetaProviderMetadata = Reflector.createDecorator({
  key: 'LOGGER_META_PROVIDER',
});

/**
 * Marks a provider as a logger metadata contributor.
 *
 * `LoggerService` discovers these providers at runtime and merges their
 * returned metadata into each log context.
 */
export const InjectableLoggerMetaProvider = (
  options?: InjectableOptions,
): ClassDecorator =>
  applyDecorators(SetLoggerMetaProviderMetadata(), Injectable(options));
