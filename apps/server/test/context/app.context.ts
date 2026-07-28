import { ManagerResponse, UserResponse } from 'platform/common-base';
import {
  AuthContext,
  PostSetupTestModule,
  createAppTestModule,
} from './app.module';
import { createAuthHelper } from './helper/auth.helper';
import { createPrismaHelper } from './helper/prisma.helper';
import { createUserHelper } from './helper/user.helper';

export const withAppContext = (postSetup?: PostSetupTestModule) => {
  const appModule = createAppTestModule();

  const prismaHelper = createPrismaHelper(appModule);
  const authHelper = createAuthHelper(appModule);
  const userHelper = createUserHelper(appModule);

  beforeEach(async () => {
    await appModule.setup((module) => {
      // Here place all necessary override
      // module.overrideProvider(Service).useClass(ServiceMock)
      return postSetup?.(module);
    });
    await prismaHelper.cleanup();
    await appModule.init();
  });

  afterEach(async () => {
    await appModule.destroy();
  });

  return {
    context: appModule,
    helpers: {
      auth: authHelper,
      user: userHelper,
    },
    macros: {
      async createAuthorizedUser() {
        return authHelper.authorize(await userHelper.createUser());
      },
      async createAuthorizedAdmin() {
        return authHelper.authorize(await userHelper.createAdmin());
      },
      async createAuthorizedManager(context: AuthContext) {
        const [manager, user] = await userHelper.createManager(context);
        const authorizedUser = await authHelper.authorize(user);
        return [{ ...manager, user }, authorizedUser] satisfies [
          ManagerResponse,
          UserResponse,
        ];
      },
      async wait(ms = 100) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      },
    },
  };
};
