import { z } from 'zod';
import { aliases } from 'platform/zod';

/**
 * Environment values that can be safely shared with client/runtime code.
 */
export const CommonEnvPublicSchema = z.object({
  LOGGER_LEVEL: aliases.preprocessString(
    aliases.notEmptyString.default('info'),
  ),
});

/**
 * Shared server environment schema used as the base for app-specific config.
 */
export const CommonEnvSchema = z.object({
  ...CommonEnvPublicSchema.shape,
  COOKIE_SECURE: aliases.preprocessBoolean(z.boolean().default(false)),
  COOKIE_SECRET: aliases.preprocessString(aliases.notEmptyString),
  COOKIE_DOMAIN: aliases.preprocessString(aliases.notEmptyString),
  JWT_SECRET: aliases.preprocessString(aliases.notEmptyString),
  JWT_REFRESH_SECRET: aliases.preprocessString(aliases.notEmptyString),
});
