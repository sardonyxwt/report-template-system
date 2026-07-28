import { AuthProviderType } from 'platform/prisma';
import {
  CheckSessionRequest,
  CheckSessionResponse,
  ProfileResponse,
} from '../data/auth/auth.types';
import { AuthEndpoints } from '../endpoints/auth.endpoints';
import { HttpMethod } from '../enums';
import { ApiRequest } from '../types';

export type SetCookiesResponse = {
  setCookies: string[] | null;
};

export type OauthOptions = {
  /** OAuth provider whose endpoint contract should be used. */
  provider: AuthProviderType;
  /** Provider callback query string forwarded to the backend OAuth endpoint. */
  query: string;
};

/**
 * Builds typed auth client helpers from shared endpoint contracts.
 *
 * Cookie-oriented helpers return `Set-Cookie` headers through `resTransformer`
 * so SSR/server clients can persist browser session cookies explicitly.
 */
export const createAuthApi = (
  request: ApiRequest,
  endpoints: AuthEndpoints,
) => ({
  /**
   * Completes provider OAuth and returns session cookies from the response.
   */
  createOauthSession: ({
    provider,
    query,
  }: OauthOptions): Promise<string[] | null> => {
    let path!: string, method!: HttpMethod;

    switch (provider) {
      case AuthProviderType.Google:
        ({ path, method } = endpoints.oauthGoogleCreateSession);
        break;
    }

    return request({
      path: `${path}?${query}`,
      method,
      resTransformer: (res) => res.headers.getSetCookie(),
    });
  },
  /**
   * Refreshes the browser access session and returns replacement cookies.
   */
  refreshSession: (): Promise<string[] | null> => {
    const { path, method } = endpoints.refreshSession;
    return request({
      path,
      method,
      resTransformer: (res) => res.headers.getSetCookie(),
    });
  },
  /**
   * Loads the current authenticated profile.
   */
  profile: (): Promise<ProfileResponse> => {
    const { path, method } = endpoints.profile;
    return request({ path, method });
  },
  /**
   * Invalidates the current session on the backend.
   */
  logout: () => {
    const { path, method } = endpoints.logout;
    return request({ path, method });
  },
  /**
   * Checks credential activity and returns any cookie clear/set instructions.
   */
  check: (
    body?: CheckSessionRequest,
  ): Promise<CheckSessionResponse & SetCookiesResponse> => {
    const { path, method } = endpoints.check;
    return request({
      path,
      method,
      body,
      resTransformer: async (res) => ({
        ...(await res.json()),
        setCookies: res.headers.getSetCookie(),
      }),
    });
  },
});
