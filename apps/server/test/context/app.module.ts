import { ConfigModule } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test as NestTest, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { HttpMethod, UserResponse } from 'platform/common-base';
import { SessionService } from 'platform/common-server';
import { PrismaClient } from 'platform/prisma/client';
import { AppConfigModule, AppModule } from '../../src/app.module';
import { configureApp, startApp } from '../../src/config';
import { Configuration, validateConfiguration } from '../../src/configuration';

export type AuthContext = {
  id: number;
  accessToken?: string | null;
};

export type PostSetupTestModule = (
  testingModule: TestingModuleBuilder,
) =>
  | void
  | Promise<void>
  | Partial<Configuration>
  | Promise<Partial<Configuration>>;

export const createAppTestModule = () => {
  let application: NestExpressApplication | undefined;

  const getApp = (): NestExpressApplication => {
    if (!application) {
      throw new Error('Call application before initialization');
    }
    return application;
  };

  const getPrisma = (): PrismaClient => {
    return getApp().get(PrismaClient);
  };

  const init = async () => {
    await getApp().init();
  };

  const setup = async (postSetup?: PostSetupTestModule) => {
    const testingModule = NestTest.createTestingModule({
      imports: [AppModule],
    });

    if (postSetup) {
      const configurationOverrides = await postSetup(testingModule);
      if (
        configurationOverrides &&
        Object.keys(configurationOverrides).length > 0
      ) {
        testingModule.overrideModule(AppConfigModule).useModule(
          ConfigModule.forRoot({
            ignoreEnvFile: true,
            isGlobal: true,
            validate: (config) =>
              validateConfiguration({
                ...config,
                ...configurationOverrides,
              }),
          }),
        );
      }
    }

    const module = await testingModule.compile();

    application = module.createNestApplication<NestExpressApplication>();

    await startApp(configureApp(application));
  };

  const withContext = async <T>(
    { id, accessToken }: AuthContext,
    cb: (user: UserResponse) => Promise<T>,
  ): Promise<T> => {
    if (!id || !accessToken) {
      throw new Error('User not authorized');
    }

    const sessionService = getApp().get(SessionService);

    return new Promise((resolve, reject) => {
      sessionService.init(async () => {
        try {
          const sessionUser = await sessionService.authorizeByIdAndAccessToken(
            id,
            accessToken,
          );
          await cb(sessionUser).then(resolve, reject);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  const apiCall = (options: {
    method: HttpMethod;
    path: string;
    cookies?: string[];
    accessToken?: string;
  }) => {
    let req = request(getApp().getHttpServer())[
      options.method.toLowerCase() as Lowercase<typeof options.method>
    ](options.path);

    if (options.accessToken) {
      req = req.set({
        Authorization: `bearer ${options.accessToken}`,
      });
    }

    if (options.cookies) {
      req = req.set('Cookie', options.cookies);
    }

    return req;
  };

  const destroy = async () => {
    await getApp().close();
    application = undefined;
  };

  return {
    init,
    setup,
    withContext,
    destroy,
    apiCall,
    get app() {
      return getApp();
    },
    get prisma() {
      return getPrisma();
    },
  };
};

export type AppTestModule = ReturnType<typeof createAppTestModule>;
