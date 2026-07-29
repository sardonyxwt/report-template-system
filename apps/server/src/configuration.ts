import { z } from 'zod';
import { CommonEnvSchema, HOUR, WEEK } from 'platform/common-base';
import { aliases } from 'platform/zod';

/**
 * Runtime configuration schema for the server application.
 *
 * The root `ConfigModule` parses all process env values through this schema at
 * startup. Keep defaults and coercion here so downstream modules can use
 * `ConfigService.getOrThrow(...)` without repeating parsing rules.
 */
export const ConfigurationSchema = z.object({
  ...CommonEnvSchema.shape,

  PORT: aliases.preprocessNumber(z.number().int().positive()),
  HOST: aliases.preprocessString(aliases.notEmptyString),
  CORS_ORIGIN: aliases.preprocessString(aliases.notEmptyString),

  DATABASE_URL: aliases.preprocessString(aliases.notEmptyString),

  JWT_SECRET_EXPIRES: aliases.preprocessNumber(
    z.number().int().positive().default(HOUR),
  ),
  JWT_REFRESH_SECRET_EXPIRES: aliases.preprocessNumber(
    z.number().int().positive().default(WEEK),
  ),

  GOOGLE_CLIENT_ID: aliases.preprocessString(aliases.notEmptyString),
  GOOGLE_CLIENT_SECRET: aliases.preprocessString(aliases.notEmptyString),
  GOOGLE_REDIRECT_URL: aliases.preprocessString(aliases.notEmptyString),

  OPENAI_API_KEY: aliases.preprocessString(aliases.notEmptyString),
  OPENAI_MODEL: aliases.preprocessString(
    aliases.notEmptyString.default('gpt-5.6-luna'),
  ),
  OPENAI_TIMEOUT_MS: aliases.preprocessNumber(
    z.number().int().positive().default(120_000),
  ),
});

/**
 * Validated server environment available through Nest `ConfigService`.
 */
export type Configuration = z.infer<typeof ConfigurationSchema>;

/**
 * Validates raw environment values for Nest `ConfigModule`.
 */
export const validateConfiguration = (
  config: Record<string, unknown>,
): Configuration => ConfigurationSchema.parse(config);
