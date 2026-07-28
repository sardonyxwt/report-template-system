import { ZodType } from 'zod';
import { OAUTH_GOOGLE_KEY } from '../constants';
import {
  CheckSessionRequestSchema,
  CheckSessionResponseSchema,
  ProfileResponseSchema,
  TokensResponseSchema,
} from '../data/auth/auth.data';
import { VoidResponseSchema } from '../data/common/common.data';
import { HttpMethod } from '../enums';
import { ApiEndpoints } from '../types';

const root = 'auth';

/**
 * Creates shared authentication endpoint contracts.
 *
 * These contracts are consumed by Nest controllers, OpenAPI generation, and
 * typed client helpers. OAuth routes use provider guard keys so the server can
 * resolve Passport strategy names from the same metadata.
 */
export const createAuthEndpoints = (base = '') =>
  ({
    oauthGoogle: {
      method: HttpMethod.Get,
      path: `${base}/${root}/oauth/google`,
      response: VoidResponseSchema as ZodType,
      guards: [OAUTH_GOOGLE_KEY],
    },
    oauthGoogleCreateSession: {
      method: HttpMethod.Post,
      path: `${base}/${root}/oauth/google/session`,
      response: VoidResponseSchema as ZodType,
      guards: [OAUTH_GOOGLE_KEY],
    },
    oauthGoogleLogin: {
      method: HttpMethod.Post,
      path: `${base}/${root}/oauth/google/login`,
      response: TokensResponseSchema as ZodType,
      guards: [OAUTH_GOOGLE_KEY],
    },
    refresh: {
      method: HttpMethod.Post,
      path: `${base}/${root}/refresh`,
      response: TokensResponseSchema as ZodType,
      guards: ['auth-refresh'],
    },
    refreshSession: {
      method: HttpMethod.Post,
      path: `${base}/${root}/refresh/session`,
      response: VoidResponseSchema as ZodType,
      guards: ['auth-refresh'],
    },
    logout: {
      method: HttpMethod.Post,
      path: `${base}/${root}/logout`,
      response: VoidResponseSchema as ZodType,
      guards: ['auth'],
    },
    profile: {
      method: HttpMethod.Get,
      path: `${base}/${root}/profile`,
      response: ProfileResponseSchema as ZodType,
      guards: ['auth'],
    },
    check: {
      method: HttpMethod.Post,
      path: `${base}/${root}/check`,
      body: CheckSessionRequestSchema as ZodType,
      response: CheckSessionResponseSchema as ZodType,
    },
  }) satisfies ApiEndpoints;

export type AuthEndpoints = ReturnType<typeof createAuthEndpoints>;
