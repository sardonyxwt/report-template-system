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

    const responseDto = res.body as UserResponse;

    expect(responseDto.email === user.email).toBeTruthy();
    expect(responseDto.role === user.role).toBeTruthy();
  });

  it('profile by cookie', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const res = await context.apiCall({
      ...endpoints.auth.profile,
      cookies: [`${AUTH_COOKIE_KEY}=${user.tokens.accessToken}`],
    });

    expect(res.status).toBe(HttpStatus.OK);

    const responseDto = res.body as UserResponse;

    expect(responseDto.email).toBe(user.email);
    expect(responseDto.role).toBe(user.role);
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

    const responseDto = res.body as UserResponse;

    expect(responseDto.email).toBe(user.email);
    expect(responseDto.role).toBe(user.role);
  });

  it('refresh', async () => {
    const user = await macros.createAuthorizedUser();

    const res = await context.apiCall({
      ...endpoints.auth.refresh,
      accessToken: user.refreshToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const tokens = res.body as TokensResponse;

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const validateUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(validateUser).toBeTruthy();
    expect(validateUser!.accessToken).toBeTruthy();
  });

  it('refresh session', async () => {
    const user = await helpers.user.createAndActivate(userFixtures.user);

    const refreshSessionRes = await context.apiCall({
      ...endpoints.auth.refreshSession,
      cookies: [`${AUTH_REFRESH_COOKIE_KEY}=${user.tokens.refreshToken}`],
    });

    const refreshedCookies = refreshSessionRes.headers[
      'set-cookie'
    ] as unknown as string[];

    expect(refreshedCookies && refreshedCookies.length > 0).toBeTruthy();
    expect(
      refreshedCookies.find((cookie) => cookie.startsWith(AUTH_COOKIE_KEY)),
    ).toBeTruthy();

    const validateUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(validateUser).toBeTruthy();
    expect(validateUser!.accessToken).toBeTruthy();
  });

  it('logout', async () => {
    const user = await macros.createAuthorizedUser();

    const res = await context.apiCall({
      ...endpoints.auth.logout,
      accessToken: user.accessToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const validateUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(validateUser).toBeTruthy();
    expect(!validateUser!.accessToken).toBeTruthy();
    expect(!validateUser!.refreshToken).toBeTruthy();
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

    const responseDto = res.body as CheckSessionResponse;

    expect(res.status).toBe(HttpStatus.OK);
    expect(responseDto.active).toBeTruthy();
    expect(responseDto.refreshable).toBeTruthy();
    expect(responseDto.accessExpiresAt).toBeGreaterThan(0);
    expect(responseDto.refreshExpiresAt).toBeGreaterThan(0);
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

    const responseDto = res.body as CheckSessionResponse;

    expect(res.status).toBe(HttpStatus.OK);
    expect(responseDto.active).toBeTruthy();
    expect(responseDto.refreshable).toBeTruthy();
    expect(responseDto.accessExpiresAt).toBeGreaterThan(0);
    expect(responseDto.refreshExpiresAt).toBeGreaterThan(0);
  });
});
