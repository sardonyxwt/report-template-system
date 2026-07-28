import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { User, userInclude } from 'platform/prisma';
import { Configuration } from '../../../src/configuration';
import { AuthService } from '../../../src/future/auth/auth.service';
import { AppTestModule } from '../app.module';

export const createAuthHelper = (appModule: AppTestModule) => {
  const authorize = async ({ id }: Pick<User, 'id'>) => {
    const user = await appModule.prisma.user.findUniqueOrThrow({
      where: { id },
      include: userInclude.include,
    });
    const tokens = await appModule.app.get(AuthService).oauthLogin(id);
    return {
      ...user,
      ...tokens,
    };
  };

  const signCookieValue = (value: string, secret: string) => {
    const signature = createHmac('sha256', secret)
      .update(value)
      .digest('base64')
      .replace(/=+$/, '');

    return `s:${value}.${signature}`;
  };

  const createSignedCookie = (key: string, value: string) => {
    const secret = appModule.app
      .get(ConfigService<Configuration>)
      .getOrThrow('COOKIE_SECRET');

    return `${key}=${encodeURIComponent(signCookieValue(value, secret))}`;
  };

  return {
    authorize,
    createSignedCookie,
  };
};

export type AuthHelper = ReturnType<typeof createAuthHelper>;
