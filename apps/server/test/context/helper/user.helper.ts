import {
  ManagerResponse,
  UserCreateRequest,
  UserResponse,
} from 'platform/common-base';
import { AuthProviderType } from 'platform/prisma';
import { AuthService } from '../../../src/future/auth/auth.service';
import { ManagerService } from '../../../src/future/manager/manager.service';
import { managerFixtures } from '../../fixture/manager.fixture';
import { userFixtures } from '../../fixture/user.fixture';
import { AppTestModule, AuthContext } from '../app.module';

export const createUserHelper = (appModule: AppTestModule) => {
  const createAndActivate = async (userFixture: UserCreateRequest) => {
    const user = await appModule.app.get(AuthService).oauthSignup({
      externalId: 'test',
      name: 'Test',
      surname: 'User',
      provider: AuthProviderType.Google,
      ...userFixture,
    });
    const tokens = await appModule.app.get(AuthService).oauthLogin(user.id);
    return { ...user, tokens };
  };

  const createAdmin = () => createAndActivate(userFixtures.admin);

  const createUser = () => createAndActivate(userFixtures.user);

  const createManager = async (context: AuthContext) => {
    const user = await createUser();

    const manager = await appModule.withContext(context, () =>
      appModule.app
        .get(ManagerService)
        .create(managerFixtures.manager(user.id)),
    );

    return [manager, user] satisfies [ManagerResponse, UserResponse];
  };

  return {
    createAdmin,
    createUser,
    createManager,
    createAndActivate,
  };
};

export type UserHelper = ReturnType<typeof createUserHelper>;
