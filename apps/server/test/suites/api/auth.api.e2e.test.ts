import { HttpStatus } from '@nestjs/common';
import {
  AUTH_COOKIE_KEY,
  AUTH_REFRESH_COOKIE_KEY,
  CheckSessionResponse,
  TokensResponse,
  UserResponse,
} from 'platform/common-base';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { userFixtures } from '../../fixture/user.fixture';

const { context, macros, helpers } = withAppContext();

describe('api.auth', () => {
  it('profile', async () => {
    const user = await macros.createAuthorizedAdmin();

    const res = await context.apiCall({
      ...endpoints.auth.profile,
      accessToken: user.accessToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const userData = res.body as UserResponse;

    expect(userData.email === user.email).toBeTruthy();
    expect(userData.role === user.role).toBeTruthy();
  });

  it('profile by cookie', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const res = await context.apiCall({
      ...endpoints.auth.profile,
      cookies: [`${AUTH_COOKIE_KEY}=${user.tokens.accessToken}`],
    });

    expect(res.status).toBe(HttpStatus.OK);

    const userData = res.body as UserResponse;

    expect(userData.email).toBe(user.email);
    expect(userData.role).toBe(user.role);
  });

  it('profile by signed cookie', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const res = await context.apiCall({
      ...endpoints.auth.profile,
      cookies: [
        helpers.auth.createSignedCookie(
          AUTH_COOKIE_KEY,
          user.tokens.accessToken,
        ),
      ],
    });

    expect(res.status).toBe(HttpStatus.OK);

    const userData = res.body as UserResponse;

    expect(userData.email).toBe(user.email);
    expect(userData.role).toBe(user.role);
  });

  it('refresh', async () => {
    const user = await macros.createAuthorizedUser();

    const res = await context.apiCall({
      ...endpoints.auth.refresh,
      accessToken: user.refreshToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const tokensData = res.body as TokensResponse;

    expect(tokensData.accessToken).toBeTruthy();
    expect(tokensData.refreshToken).toBeTruthy();

    const updatedUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.accessToken).toBeTruthy();
  });

  it('refresh session', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const res = await context.apiCall({
      ...endpoints.auth.refreshSession,
      cookies: [`${AUTH_REFRESH_COOKIE_KEY}=${user.tokens.refreshToken}`],
    });

    const refreshedCookies = res.headers['set-cookie'] as unknown as string[];

    expect(refreshedCookies && refreshedCookies.length > 0).toBeTruthy();
    expect(
      refreshedCookies.find((cookie) => cookie.startsWith(AUTH_COOKIE_KEY)),
    ).toBeTruthy();

    const updatedUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.accessToken).toBeTruthy();
  });

  it('logout', async () => {
    const user = await macros.createAuthorizedUser();

    const res = await context.apiCall({
      ...endpoints.auth.logout,
      accessToken: user.accessToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const updatedUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(updatedUser).toBeTruthy();
    expect(!updatedUser!.accessToken).toBeTruthy();
    expect(!updatedUser!.refreshToken).toBeTruthy();
  });

  it('check access token', async () => {
    const user = await macros.createAuthorizedUser();

    const res = await context
      .apiCall({
        ...endpoints.auth.check,
      })
      .send({
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      });

    const checkSessionData = res.body as CheckSessionResponse;

    expect(res.status).toBe(HttpStatus.OK);
    expect(checkSessionData.active).toBeTruthy();
    expect(checkSessionData.refreshable).toBeTruthy();
    expect(checkSessionData.accessExpiresAt).toBeGreaterThan(0);
    expect(checkSessionData.refreshExpiresAt).toBeGreaterThan(0);
  });

  it('check cookies', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const res = await context.apiCall({
      ...endpoints.auth.check,
      cookies: [
        `${AUTH_COOKIE_KEY}=${user.tokens.accessToken}`,
        `${AUTH_REFRESH_COOKIE_KEY}=${user.tokens.refreshToken}`,
      ],
    });

    const checkSessionData = res.body as CheckSessionResponse;

    expect(res.status).toBe(HttpStatus.OK);
    expect(checkSessionData.active).toBeTruthy();
    expect(checkSessionData.refreshable).toBeTruthy();
    expect(checkSessionData.accessExpiresAt).toBeGreaterThan(0);
    expect(checkSessionData.refreshExpiresAt).toBeGreaterThan(0);
  });
});
