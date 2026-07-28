import { z } from 'zod';
import { UserSchema, UserRole } from 'platform/prisma';
import { aliases } from 'platform/zod';
import { UserResponseSchema } from '../user/user.data';

/**
 * Minimal user identity embedded into access and refresh JWTs.
 *
 * Manager users must include packed manager abilities so authorization checks
 * can run without loading the manager row on every request.
 */
export const JwtStrategyPayloadSchema = UserSchema.pick({
  id: true,
  role: true,
})
  .extend({
    managerAbilities: aliases.notEmptyString.optional(),
  })
  .superRefine((arg, ctx) => {
    if (arg.role === UserRole.Manager) {
      if (!arg.managerAbilities) {
        ctx.addIssue({
          path: ['managerAbilities'],
          code: 'custom',
          message: 'managerAbilities requires if role === Manager',
        });
      }
    }
  })
  .meta({ name: 'JwtStrategyPayloadSchema' });

/**
 * Access/refresh token pair returned to non-cookie clients.
 */
export const TokensResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .meta({ name: 'TokensResponseSchema' });

/**
 * Public profile shape returned for the current session user.
 */
export const ProfileResponseSchema = z
  .object({
    ...UserResponseSchema.shape,
  })
  .meta({
    name: 'ProfileResponseSchema',
  });

/**
 * Optional token check payload. When omitted, cookie-based server endpoints can
 * fall back to credentials already attached to the request.
 */
export const CheckSessionRequestSchema = z
  .object({
    accessToken: aliases.notEmptyString.nullish(),
    refreshToken: aliases.notEmptyString.nullish(),
  })
  .optional()
  .meta({
    name: 'CheckSessionRequestSchema',
  });

/**
 * Credential activity report with JWT timing fields expressed in milliseconds.
 */
export const CheckSessionResponseSchema = z
  .object({
    active: z.boolean(),
    refreshable: z.boolean(),
    accessCreatedAt: z.number(),
    accessExpiresAt: z.number(),
    refreshCreatedAt: z.number(),
    refreshExpiresAt: z.number(),
  })
  .meta({
    name: 'CheckSessionResponseSchema',
  });
